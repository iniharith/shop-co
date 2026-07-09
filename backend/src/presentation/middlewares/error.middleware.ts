/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { NextFunction, Request, Response } from "express";
import { statusCodes, messages } from "../../shared/constants/api.constant";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`${messages.NOT_FOUND} - ${req.originalUrl}`);
    console.log(`${messages.NOT_FOUND} - ${req.originalUrl}`)
    res.status(statusCodes.NOT_FOUND);
    next(error);
}


import fs from 'fs';
import path from 'path';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    let statusCode = res.statusCode == statusCodes.OK ? statusCodes.INTERNAL_SERVER_ERROR : res.statusCode;
    let message = err.message;
    console.log(message);
    
    // Append to error log
    try {
        const logPath = path.join(process.cwd(), 'error.log');
        const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${statusCode} - ${message}\n${err.stack || ''}\n\n`;
        fs.appendFileSync(logPath, logEntry);
    } catch (e) {
        console.error('Failed to write to error.log', e);
    }

    if (err.name === "CastError" && (err as any).kind === "ObjectId") {
        statusCode = statusCodes.NOT_FOUND;
        message = messages.NOT_FOUND;
    }

    res.status(statusCode).json({
        message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    })

}