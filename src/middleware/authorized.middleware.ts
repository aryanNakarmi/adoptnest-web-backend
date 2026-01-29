import { Request, Response, NextFunction } from 'express';
import { JWT_SECRET } from '../config';
import jwt from 'jsonwebtoken';
import { IUser } from '../models/user.model';
import { UserRepository } from '../repositories/user.repository';
import { HttpError } from '../errors/http-error';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: Record<string, any> | IUser;
        }
    }
}

const userRepository = new UserRepository();

export const authorizedMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        // Check if authorization header exists and starts with "Bearer "
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpError(401, 'Unauthorized: JWT invalid or missing');
        }

        // Extract token from "Bearer <token>"
        const token = authHeader.split(' ')[1];

        if (!token) {
            throw new HttpError(401, 'Unauthorized: JWT token missing');
        }

        // Verify token with JWT_SECRET
        const decodedToken = jwt.verify(token, JWT_SECRET) as Record<string, any>;

        // Check if token was decoded successfully and has id
        if (!decodedToken || !decodedToken.id) {
            throw new HttpError(401, 'Unauthorized: JWT unverified or invalid');
        }

        // Get user from database using decoded id
        const user = await userRepository.getUserById(decodedToken.id);

        if (!user) {
            throw new HttpError(401, 'Unauthorized: User not found');
        }

        // Attach user to request object
        req.user = user;

        // Continue to next middleware/route
        next();
    } catch (err: Error | any) {
        // Handle JWT errors specifically
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Invalid JWT token',
            });
        }

        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: JWT token expired',
            });
        }

        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message || 'Authentication failed',
        });
    }
};


export const adminMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Check if user is attached to request (should be from authorizedMiddleware)
        if (!req.user) {
            throw new HttpError(401, 'Unauthorized: No user information');
        }

        // Check if user role is 'admin'
        if (req.user.role !== 'admin') {
            throw new HttpError(403, 'Forbidden: Admin access required');
        }

        // User is admin, continue
        next();
    } catch (err: Error | any) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message || 'Authorization failed',
        });
    }
};


export const protect = authorizedMiddleware; 