"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = void 0;
const api_constant_1 = require("../../shared/constants/api.constant");
const notFound = (req, res, next) => {
    const error = new Error(`${api_constant_1.messages.NOT_FOUND} - ${req.originalUrl}`);
    console.log(`${api_constant_1.messages.NOT_FOUND} - ${req.originalUrl}`);
    res.status(api_constant_1.statusCodes.NOT_FOUND);
    next(error);
};
exports.notFound = notFound;
const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode == api_constant_1.statusCodes.OK ? api_constant_1.statusCodes.INTERNAL_SERVER_ERROR : res.statusCode;
    let message = err.message;
    console.log(message);
    if (err.name === "CastError" && err.kind === "ObjectId") {
        statusCode = api_constant_1.statusCodes.NOT_FOUND;
        message = api_constant_1.messages.NOT_FOUND;
    }
    res.status(statusCode).json({
        message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};
exports.errorHandler = errorHandler;
