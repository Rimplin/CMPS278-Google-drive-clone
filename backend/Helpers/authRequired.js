import jwt from 'jsonwebtoken';

export default function authRequired(req, res, next) {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.slice(7); // remove "Bearer "

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        // attach user info to request so endpoints can use it
        req.user = payload;
        next();
    } catch (err) {
        console.error('JWT error:', err.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
