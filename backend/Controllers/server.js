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
/* Debugging middleware.
This middleware runs for every incoming request, before the actual route handler.*/
app.use(express.json()); // needed to read JSON bodies
app.use((req, res, next) => {
  console.log("METHOD:", req.method);
  console.log("PATH:", req.path);
  console.log("HEADERS:", req.headers);
  console.log("QUERY:", req.query);
  console.log("BODY:", req.body);
  console.log("------------------------------------------------");
  next();
});
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

app.get(`${API}/health`, (_req, res) => {
    const dbState = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
    res.json({
        ok: true,
        service: 'express',
        db: dbState === 1 ? 'connected' : dbState,
        time: new Date().toISOString()
    });
});

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
        /*  For future storage tracking, try:
            const storageUsed = await File.aggregate([
            { $match: { owner: userId } },
            { $group: { _id: null, total: { $sum: "$size" } } }
            ]);
        */
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
    try {
        const userId = req.user.sub;

        const {
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

        if (scope === "shared") {
            query.sharedWith = req.user.email;
        }
        else if (scope === "starred") {
            query.isStarred = true;
            query.owner = userId;
        }
        else {
            query.owner = userId;
        }

        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        if (type) {
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

    catch (err) {
        console.error("GET /api/files error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.get(`${API}/files/recent`, authRequired, async (req, res) => {
    try {
        const userId = req.user.sub;
        const { limit = 20 } = req.query;

        const query = { owner: userId };

        const files = await File.find(query)
            .sort({ updatedAt: -1 })
            .limit(Number(limit) || 20)
            .lean();

        res.json(files);
    }
    catch (err) {
        console.error("GET /api/files/recent error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.get(`${API}/files/:id`, authRequired, async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.sub;
        const userEmail = req.user.email;

        const file = await File.findById(fileId).lean();

        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }

        const isOwner = file.owner?.toString() === userId;
        const isShared = file.sharedWith?.includes(userEmail);

        if (!isOwner && !isShared) {
            return res.status(404).json({ error: "File not accessible" });
        }

        res.json(file);
    }
    catch (err) {
        console.error("GET /api/files/:id error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.get(`${API}/files/:id/children`, authRequired, async (req, res) => {
    try {
        const folderId = req.params.id;
        const userId = req.user.sub;
        const userEmail = req.user.email;

        //used to avoid a cast error if someone sends a bad ID (like /api/files/234-invalid)
        if(!mongoose.isValidObjectId(folderId)) {
            return res.status(404).json({ error: "Invalid file ID"});
        }        

        const folder = await File.findById(folderId).lean();

        if (!folder) {
            return res.status(404).json({ error: "Folder not found" });
        }

        if (!folder.isFolder) {
            return res.status(400).json({ error: "This file is not a folder" });
        }

        const isOwner = folder.owner?.toString() === userId;
        const isShared = folder.sharedWith?.includes(userEmail);

        if (!isOwner && !isShared) {
            return res.status(404).json({ error: "Folder not accessible" });
        }

        const childLocation = `${folder.location}/${folder.name}`;

        const children = await File.find({
            location: childLocation,
            $or: [
                {
                    owner: userId
                },
                {
                    sharedWith: userEmail
                }
            ]
        })
            .sort({ isFolder: -1, name: 1 })
            .lean();

        res.json(children);
    }
    catch (err) {
        console.error("GET /api/files/:id/children error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.use(API, fileActionsRouter);

// 404 for API routes
app.use(API, (_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Centralized error handler (must have 4 args)
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

// Start server AFTER DB connects
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`API ready on http://localhost:${PORT}`);
    });
});

['SIGINT', 'SIGTERM'].forEach(sig => {
    process.on(sig, async () => {
        console.log(`\n${sig} received: closing server and Mongo connection…`);
        await mongoose.connection.close();
        process.exit(0);
    });
});
