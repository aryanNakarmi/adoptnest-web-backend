import multer, { FileFilterCallback, StorageEngine } from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';

// File size limits
const maxImageSize: number = 5 * 1024 * 1024; // 5MB for images
const maxVideoSize: number = 50 * 1024 * 1024; // 50MB for videos

/**
 * Create all required directories if they don't exist
 * This runs automatically when the app starts
 */
const createDirectories = () => {
    const directories = [
        path.join('public', 'animal_reports'),    // For client animal reports (lost/found)
        path.join('public', 'animal_posts'),      // For admin adoption posts
        path.join('public', 'profile_pictures'),  // For user profile pictures
    ];

    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✅ Created directory: ${dir}`);
        } else {
            console.log(`✅ Directory exists: ${dir}`);
        }
    });
};

// Create directories on startup
createDirectories();

/**
 * Configure multer storage
 * Routes files to appropriate directories based on field name
 */
const storage: StorageEngine = multer.diskStorage({
    destination: (
        req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, destination: string) => void
    ): void => {
        // Client reports lost/found animals
        if (file.fieldname === 'animalReport') {
            cb(null, path.join('public', 'animal_reports'));
        }
        // Admin posts animals for adoption
        else if (file.fieldname === 'animalPost') {
            cb(null, path.join('public', 'animal_posts'));
        }
        // User profile pictures
        else if (file.fieldname === 'profilePicture') {
            cb(null, path.join('public', 'profile_pictures'));
        }
        // Invalid field name
        else {
            cb(new Error('Invalid field name for upload.'), '');
        }
    },
    filename: (
        req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, filename: string) => void
    ): void => {
        const ext = path.extname(file.originalname);
        let prefix = 'file';

        // Set prefix based on field name
        if (file.fieldname === 'animalReport') {
            prefix = 'report';
        } else if (file.fieldname === 'animalPost') {
            prefix = 'post';
        } else if (file.fieldname === 'profilePicture') {
            prefix = 'profile';
        }

        // Generate filename: prefix-timestamp.ext
        // Example: report-1704067200000.jpg
        cb(null, `${prefix}-${Date.now()}${ext}`);
    },
});

/**
 * File filter - validates file types based on field name
 */
const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
): void => {
    // Only allow images (jpg, jpeg, png, gif)
    if (
        file.fieldname === 'animalReport' ||
        file.fieldname === 'animalPost' ||
        file.fieldname === 'profilePicture'
    ) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            cb(new Error('Image format not supported. Allowed: jpg, jpeg, png, gif'));
            return;
        }
        cb(null, true);
        return;
    }

    // Invalid field name
    cb(new Error('Invalid field name for upload.'));
    return;
};

/**
 * Multer instance for all image uploads
 * Used for: animalReport, animalPost, profilePicture
 * 
 * Usage examples:
 * - uploadImage.single('animalReport')
 * - uploadImage.single('profilePicture')
 * - uploadImage.array('animalPost', 5)  // Multiple photos for adoption post
 */
export const uploadImage = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: maxImageSize }, // 5MB limit
});

/**
 * Export for backward compatibility
 */
const upload = uploadImage;
export default upload;