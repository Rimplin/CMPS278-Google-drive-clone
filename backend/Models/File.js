// File.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const fileSchema = new Schema(
    {
        // Display name of the file / folder
        name: {
            type: String,
            required: true,
            trim: true
        },

        // "doc" | "sheet" | "text" | "zip" | "pdf" | "video" | "folder"
        type: {
            type: String,
            required: true,
            enum: ['doc', 'sheet', 'text', 'zip', 'pdf', 'video', 'folder']
        },

        // Owner reference (for permissions)
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        // Denormalized for faster response (no populate needed)
        ownerName: {
            type: String,
            required: true,
            trim: true
        },
        ownerEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        // Size in bytes (0 for folders)
        size: {
            type: Number,
            default: 0,
            min: 0
        },

        // Path or category like "My Drive", "My Drive/Projects"
        location: {
            type: String,
            required: true,
            trim: true,
            default: 'My Drive'
        },

        // Folder flag
        isFolder: {
            type: Boolean,
            required: true,
            default: false
        },

        // Starred flag
        isStarred: {
            type: Boolean,
            default: false
        },

        // Who this file is shared with (store emails directly, simple)
        sharedWith: {
            type: [String],
            default: []
        },

        // Optional description
        description: {
            type: String,
            default: ''
        },
    },
    {
        timestamps: true // createdAt = "uploadedAt", updatedAt
    }
);

// Some useful indexes (optional but nice)
fileSchema.index({ owner: 1, location: 1 });
fileSchema.index({ isStarred: 1 });
fileSchema.index({ sharedWith: 1 });

export default mongoose.model('File', fileSchema);
