import multer, { FileFilterCallback, StorageEngine } from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';

// File size limits
const maxImageSize: number = 5 * 1024 * 1024; // 5MB for images
const maxVideoSize: number = 50 * 1024 * 1024; // 50MB for videos


const createDirectories = () => {
    const directories = [
        path.join('public', 'animal_reports'),    
        path.join('public', 'animal_posts'),     
        path.join('public', 'profile_pictures'), 
    ];

    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        } else {
            console.log(`Directory exists: ${dir}`);
        }
    });
};


createDirectories();

const storage: StorageEngine = multer.diskStorage({
    destination: (
        req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, destination: string) => void
    ): void => {
       
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

       
        if (file.fieldname === 'animalReport') {
            prefix = 'report';
        } else if (file.fieldname === 'animalPost') {
            prefix = 'post';
        } else if (file.fieldname === 'profilePicture') {
            prefix = 'profile';
        }

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

export const uploadImage = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: maxImageSize }, // 5MB limit
});

const upload = uploadImage;
export default upload;