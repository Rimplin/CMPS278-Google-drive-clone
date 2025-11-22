// router.js
import express from 'express';
import mongoose from 'mongoose';
import authRequired from '../Helpers/authRequired.js';
import File from '../Models/File.js';

const router = express.Router();

// Create a new file or folder (metadata only)
router.post('/files', authRequired, async (req, res, next) => {
    try {
        const userId = req.user.sub;
        const userEmail = req.user.email;
        const userName = req.user.name;

        const {
            name,
            type,              // required for non-folders: 'doc' | 'sheet' | 'text' | 'zip' | 'pdf' | 'video'
            isFolder = false,
            location = 'My Drive',
            size = 0,
            description = '',
            contentPreview = ''
        } = req.body || {};

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'name is required' });
        }

        // For non-folder items, we expect a valid type
        const allowedTypes = ['doc', 'sheet', 'text', 'zip', 'pdf', 'video'];
        if (!isFolder) {
            if (!type || typeof type !== 'string') {
                return res.status(400).json({ error: 'type is required for non-folder items' });
            }
            if (!allowedTypes.includes(type)) {
                return res.status(400).json({
                    error: `type must be one of: ${allowedTypes.join(', ')}`
                });
            }
        }

        const file = await File.create({
            name: name.trim(),
            type: isFolder ? 'folder' : type,      // folder type is always "folder"
            isFolder: Boolean(isFolder),
            location: location?.trim() || 'My Drive',
            size: Number(size) || 0,
            owner: userId,
            ownerName: userName?.trim() || 'Unknown',
            ownerEmail: String(userEmail || '').toLowerCase().trim(),
            isStarred: false,
            sharedWith: [],
            description: description || '',
            contentPreview: contentPreview || ''
        });

        res.status(201).json(file.toObject());
    } catch (err) {
        next(err);
    }
});


router.get(`/files`, authRequired, async (req, res) => {
    try {
        const userId = req.user.sub;
        const userEmail = req.user.email;

        const {
            scope,          // "shared" | "starred" | undefined
            search,         // text query (name or content)
            type,           // doc | sheet | text | zip | pdf | video | folder
            fileType,       // alias for type
            owner,          // owner userId (as string)
            ownerEmail,     // filter by ownerEmail
            location,       // "My Drive", "Trash", etc.
            kind,           // "file" | "folder" (spec 7a)
            minSize,        // bytes
            maxSize,        // bytes
            uploadedAfter,  // ISO date string
            uploadedBefore, // ISO date string
            sort = "createdAt",  // "name" | "size" | "createdAt"
            order = "desc"       // "asc" | "desc"
        } = req.query;

        const query = {};

        // Scope:
        // - shared: files where I'm in sharedWith
        // - starred: my files with isStarred = true
        // - default: my files
        if (scope === "shared") {
            query.sharedWith = userEmail;
        } else if (scope === "starred") {
            query.isStarred = true;
            query.owner = userId;
        } else {
            query.owner = userId;
        }

        // Filter by location (My Drive, Trash, etc.)
// If no location is provided, EXCLUDE Trash by default.
        if (location) {
            query.location = String(location).trim();
        } else {
            query.location = { $ne: 'Trash' };
        }


        // Files vs folders (spec #7a)
        if (kind === "folder") {
            query.isFolder = true;
        } else if (kind === "file") {
            query.isFolder = false;
        }

        // File type (doc, sheet, pdf, video, etc.) (spec #7b)
        const effectiveType = type || fileType;
        if (effectiveType) {
            query.type = String(effectiveType).trim();
        }

        // Filter by owner (id) or ownerEmail (spec #7c: "files shared by specific people")
        if (owner) {
            query.owner = owner;
        }
        if (ownerEmail) {
            query.ownerEmail = String(ownerEmail).toLowerCase().trim();
        }

        // Advanced filters: size range (bytes)
        if (minSize || maxSize) {
            query.size = {};
            if (minSize) query.size.$gte = Number(minSize);
            if (maxSize) query.size.$lte = Number(maxSize);
        }

        // Advanced filters: upload date range (createdAt)
        if (uploadedAfter || uploadedBefore) {
            query.createdAt = {};
            if (uploadedAfter) query.createdAt.$gte = new Date(uploadedAfter);
            if (uploadedBefore) query.createdAt.$lte = new Date(uploadedBefore);
        }

        // Search by name OR description OR contentPreview
        if (search && String(search).trim().length > 0) {
            const regex = new RegExp(String(search).trim(), "i");
            query.$or = [
                { name: regex },
                { description: regex },
                { contentPreview: regex }
            ];
        }

        // Sorting: only allow a safe subset
        const allowedSorts = new Set(["name", "size", "createdAt", "updatedAt"]);
        let sortField = allowedSorts.has(sort) ? sort : "createdAt";

        // Allow frontend to pass "uploadDate" and map it to createdAt (spec #15c)
        if (sort === "uploadDate") {
            sortField = "createdAt";
        }

        const sortQuery = {};
        sortQuery[sortField] = order === "asc" ? 1 : -1;

        const files = await File.find(query).sort(sortQuery).lean();
        res.json(files);
    }
    catch (err) {
        console.error("GET /api/files error:", err);
        res.status(500).json({ error: "Server error" });
    }
});


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
