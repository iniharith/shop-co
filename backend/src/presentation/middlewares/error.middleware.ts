/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { NextFunction, Request, Response } from "express";
import { statusCodes, messages } from "../../shared/constants/api.constant";
import * as Sentry from '@sentry/node';
import { promises as fs } from 'fs';
import path from 'path';
import { sanitizeSensitiveText } from '../../instrumentation';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`${messages.NOT_FOUND} - ${req.path}`);
    res.status(statusCodes.NOT_FOUND);
    next(error);
}

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
    let statusCode = res.statusCode == statusCodes.OK ? statusCodes.INTERNAL_SERVER_ERROR : res.statusCode;
    let message = err.message;

    if (err.name === "CastError" && (err as any).kind === "ObjectId") {
        statusCode = statusCodes.NOT_FOUND;
        message = messages.NOT_FOUND;
    }

    const safeError = {
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode,
        error: sanitizeSensitiveText(err.name),
        message: sanitizeSensitiveText(message),
        stack: err.stack ? sanitizeSensitiveText(err.stack) : undefined,
    };

    console.error(JSON.stringify(safeError));
    void fs.appendFile(
        path.join(process.cwd(), 'error.log'),
        `${JSON.stringify(safeError)}\n`,
    ).catch((writeError: unknown) => {
        console.error(JSON.stringify({
            requestId: req.requestId,
            error: 'error_log_write_failed',
            message: sanitizeSensitiveText(writeError instanceof Error ? writeError.message : String(writeError)),
        }));
    });

    if (statusCode >= 500) {
        Sentry.withScope((scope) => {
            scope.setTags({
                requestId: req.requestId,
                method: req.method,
                path: req.path,
            });
            Sentry.captureException(err);
        });
    }

    const responseMessage = process.env.NODE_ENV === 'production' && statusCode >= 500
        ? 'Internal server error'
        : message;

    res.status(statusCode).json({
        message: responseMessage,
        requestId: req.requestId,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    })

}
