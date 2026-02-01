import multer, { FileFilterCallback, StorageEngine } from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';

// File size limits
const maxImageSize: number = 5 * 1024 * 1024; // 5MB for images

const createDirectories = () => {
    const directories = [
        path.join(process.cwd(), 'public', 'animal_reports'),    
        path.join(process.cwd(), 'public', 'animal_posts'),     
        path.join(process.cwd(), 'public', 'profile_pictures'), 
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
            const destPath = path.join(process.cwd(), 'public', 'animal_reports');
            console.log(`Uploading to: ${destPath}`);
            cb(null, destPath);
        }
        else if (file.fieldname === 'animalPost') {
            cb(null, path.join(process.cwd(), 'public', 'animal_posts'));
        }
        else if (file.fieldname === 'profilePicture') {
            cb(null, path.join(process.cwd(), 'public', 'profile_pictures'));
        }
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

        const filename = `${prefix}-${Date.now()}${ext}`;
        console.log(`📸 Saving file: ${filename}`);
        cb(null, filename);
    },
});

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
): void => {
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

    cb(new Error('Invalid field name for upload.'));
    return;
};

export const uploadImage = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: maxImageSize },
});

export default uploadImage;