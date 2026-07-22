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
Object.defineProperty(exports, "__esModule", { value: true });
exports.areWhatsAppCustomerUpdatesEnabled = areWhatsAppCustomerUpdatesEnabled;
exports.setWhatsAppCustomerUpdatesEnabled = setWhatsAppCustomerUpdatesEnabled;
const customerUpdateSetting_model_1 = require("../db/models/customerUpdateSetting.model");
const WHATSAPP_AUTO_UPDATE_KEY = 'whatsapp_customer_auto_updates';
function areWhatsAppCustomerUpdatesEnabled() {
    return __awaiter(this, void 0, void 0, function* () {
        const setting = yield customerUpdateSetting_model_1.CustomerUpdateSetting.findOne({ key: WHATSAPP_AUTO_UPDATE_KEY }).lean();
        return (setting === null || setting === void 0 ? void 0 : setting.enabled) === true;
    });
}
function setWhatsAppCustomerUpdatesEnabled(enabled) {
    return __awaiter(this, void 0, void 0, function* () {
        const setting = yield customerUpdateSetting_model_1.CustomerUpdateSetting.findOneAndUpdate({ key: WHATSAPP_AUTO_UPDATE_KEY }, { $set: { enabled } }, { new: true, upsert: true, setDefaultsOnInsert: true }).lean();
        return (setting === null || setting === void 0 ? void 0 : setting.enabled) === true;
    });
}
