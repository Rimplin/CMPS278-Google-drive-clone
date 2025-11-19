/* eslint-env node */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../Models/User.js';
import jwt from "jsonwebtoken";
import fileActionsRouter from './router.js';
import authRequired from '../Helpers/authRequired.js';
import File from '../Models/File.js'

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const API = '/api';
mongoose.set('strictQuery', true); //mongo connection

async function connectDB() {
    if (!MONGODB_URI) {
        console.error('Missing MONGODB_URI in .env');
        process.exit(1);
    }
    try {
        await mongoose.connect(MONGODB_URI, {
            // keep options minimal; mongoose v7+ picks sane defaults
            dbName: "google-drive-clone"
        });
        console.log('✓ MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
}

// --- Health check ---
app.get(`${API}/health`, (_req, res) => {
    const dbState = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
    res.json({
        ok: true,
        service: 'express',
        db: dbState === 1 ? 'connected' : dbState,
        time: new Date().toISOString()
    });
});

// --- Your routes go here ---
// POST /api/signup  { email, name, password }
app.post(`${API}/signup`, async (req, res, next) => {
    try {
        const { email, name, password } = req.body || {};
        if (!email || !name || !password) {
            return res.status(400).json({ error: 'email, name, and password are required' });
        }

        // const normEmail = String(email).toLowerCase().trim();
        // const normName  = String(name).trim();

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            email: email,
            name: name,
            passwordHash: passwordHash
        });

        res.status(201).json({
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
        });
    } catch (err) {
        if (err && err.code === 11000) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        next(err);
    }
});



// POST /api/login  { email, password }
app.post(`${API}/login`, async (req, res, next) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }

        const user = await User.findOne({ email: email }).exec();
        if (!user) return res.status(401).json({ error: 'invalid credentials' });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'invalid credentials' });

        const token = jwt.sign(
            { sub: user._id.toString(), email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name
            }
        });
    } catch (err) {
        next(err);
    }
});

app.get(`${API}/me`, authRequired, async (req, res) => {
    try {
        const userId = req.user.sub;

        const user = await User.findById(userId).exec();
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const avatarInitial = user.name?.charAt(0)?.toUpperCase() || "?";

        const storageUsed = 0;
        const storageTotal = 15; // GB (mock)

        res.json({
            username: user.name,
            email: user.email,
            avatarInitial,
            storageUsed,
            storageTotal
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }

});

app.get(`${API}/files`, authRequired, async (req, res) => {
    try{
        const userId = req.user.sub;

        const{
            scope,
            search,
            type,
            fileType,
            owner,
            location,
            sort = "createdAt",
            order = "desc"
        } = req.query;

        const query = {};

        if(scope === "shared"){
            query.shareWith = req.user.email;
        }
        else if (scope === "starred"){
            query.isStarred = true;
            query.owner = userId;
        }
        else{
            query.owner = userId;
        }

        if(search){
            query.name = { $regex: search, $options: "i"};
        }

        if(type){
            query.type = type;
        }

        if (fileType) {
            query.type = fileType;
        }

        if (owner) {
            query.owner = owner;
        }

        if (location) {
            query.location = location;
        }

        const sortQuery = {};
        sortQuery[sort] = order === "asc" ? 1 : -1;

        const files = await File.find(query).sort(sortQuery).lean();

        res.json(files);
    }

    catch(err){
        console.error("GET /api/files error:", err);
    }
})


app.use(API, fileActionsRouter);

// --- 404 for API routes ---
app.use(API, (_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// --- Centralized error handler (must have 4 args) ---
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

// --- Start server AFTER DB connects ---
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`API ready on http://localhost:${PORT}`);
    });
});

// --- Graceful shutdown ---
['SIGINT', 'SIGTERM'].forEach(sig => {
    process.on(sig, async () => {
        console.log(`\n${sig} received: closing server and Mongo connection…`);
        await mongoose.connection.close();
        process.exit(0);
    });
});
