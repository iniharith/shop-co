"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOrderOwnerOrStaff = requireOrderOwnerOrStaff;
const mongoose_1 = require("mongoose");
const order_model_1 = __importDefault(require("../../infrastructure/db/models/order.model"));
const orderStaffRoles = new Set(['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging']);
/** Customers may only open their own orders; staff may open manual orders too. */
function requireOrderOwnerOrStaff(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (orderStaffRoles.has(req.role || '')) {
            next();
            return;
        }
        if (!req.userId || !mongoose_1.Types.ObjectId.isValid(req.params.orderId)) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        try {
            const owned = yield order_model_1.default.exists({ _id: req.params.orderId, userId: req.userId });
            if (!owned) {
                res.status(404).json({ message: 'Order not found' });
                return;
            }
            next();
        }
        catch (error) {
            next(error);
        }
    });
}
