import express from 'express';
import mongoose from 'mongoose';
import authRequired from '../Helpers/authRequired.js';
import File from '../Models/File.js';

const router = express.Router();

// Update basic metadata for a single file
router.patch('/files/:id', authRequired, async (req, res, next) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.sub;

        if (!mongoose.isValidObjectId(fileId)) {
            return res.status(404).json({ error: 'Invalid file ID' });
        }

        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (file.owner?.toString() !== userId) {
            return res.status(403).json({ error: 'Not allowed to edit this file' });
        }

        const { name, isStarred, location, description } = req.body || {};
        const updates = {};

        if (typeof name !== 'undefined') updates.name = name;
        if (typeof isStarred !== 'undefined') updates.isStarred = isStarred;
        if (typeof location !== 'undefined') updates.location = location;
        if (typeof description !== 'undefined') updates.description = description;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        Object.assign(file, updates);
        await file.save();

        res.json(file.toObject());
    } catch (err) {
        next(err);
    }
});

// Move a file into the Trash area
router.patch('/files/:id/trash', authRequired, async (req, res, next) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.sub;

        if (!mongoose.isValidObjectId(fileId)) {
            return res.status(404).json({ error: 'Invalid file ID' });
        }

        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (file.owner?.toString() !== userId) {
            return res.status(403).json({ error: 'Not allowed to trash this file' });
        }

        file.location = 'Trash';
        await file.save();

        res.json(file.toObject());
    } catch (err) {
        next(err);
    }
});

// Share a file with a list of email addresses
router.post('/files/:id/share', authRequired, async (req, res, next) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.sub;
        const { emails } = req.body || {};

        if (!mongoose.isValidObjectId(fileId)) {
            return res.status(404).json({ error: 'Invalid file ID' });
        }

        if (!Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ error: 'emails must be a non-empty array' });
        }

        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (file.owner?.toString() !== userId) {
            return res.status(403).json({ error: 'Only the owner can share this file' });
        }

        const cleanedEmails = Array.from(
            new Set(
                emails
                    .map(e => String(e || '').toLowerCase().trim())
                    .filter(e => e.length > 0)
            )
        );

        const existing = Array.isArray(file.sharedWith) ? file.sharedWith : [];
        file.sharedWith = Array.from(new Set([...existing, ...cleanedEmails]));

        await file.save();

        res.json(file.toObject());
    } catch (err) {
        next(err);
    }
});

// Apply one operation to many files at once
router.post('/files/bulk', authRequired, async (req, res, next) => {
    try {
        const userId = req.user.sub;
        const { operation, fileIds, data } = req.body || {};

        if (!operation || !Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({ error: 'operation and fileIds are required' });
        }

        const allowedOps = new Set(['trash', 'star', 'unstar', 'move', 'share']);
        if (!allowedOps.has(operation)) {
            return res.status(400).json({ error: 'Unsupported operation' });
        }

        const results = [];

        for (const fileId of fileIds) {
            if (!mongoose.isValidObjectId(fileId)) {
                results.push({ id: fileId, status: 'invalid-id' });
                continue;
            }

            const file = await File.findById(fileId);
            if (!file) {
                results.push({ id: fileId, status: 'not-found' });
                continue;
            }

            if (file.owner?.toString() !== userId) {
                results.push({ id: fileId, status: 'forbidden' });
                continue;
            }

            if (operation === 'trash') {
                file.location = 'Trash';
            } else if (operation === 'star') {
                file.isStarred = true;
            } else if (operation === 'unstar') {
                file.isStarred = false;
            } else if (operation === 'move') {
                const newLocation = data?.location;
                if (!newLocation || typeof newLocation !== 'string' || !newLocation.trim()) {
                    results.push({ id: fileId, status: 'bad-data' });
                    continue;
                }
                file.location = newLocation.trim();
            } else if (operation === 'share') {
                const emails = data?.emails;
                if (!Array.isArray(emails) || emails.length === 0) {
                    results.push({ id: fileId, status: 'bad-data' });
                    continue;
                }
                const cleanedEmails = Array.from(
                    new Set(
                        emails
                            .map(e => String(e || '').toLowerCase().trim())
                            .filter(e => e.length > 0)
                    )
                );
                const existing = Array.isArray(file.sharedWith) ? file.sharedWith : [];
                file.sharedWith = Array.from(new Set([...existing, ...cleanedEmails]));
            }

            await file.save();
            results.push({ id: fileId, status: 'ok' });
        }

        res.json({ operation, results });
    } catch (err) {
        next(err);
    }
});

export default router;
