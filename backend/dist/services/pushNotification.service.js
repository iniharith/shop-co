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
exports.sendPushNotification = void 0;
const expo_server_sdk_1 = require("expo-server-sdk");
const user_model_1 = __importDefault(require("../infrastructure/db/models/user.model"));
const expo = new expo_server_sdk_1.Expo();
const sendPushNotification = (userId, title, body, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findById(userId);
        if (!user || !user.expoPushToken)
            return false;
        if (!expo_server_sdk_1.Expo.isExpoPushToken(user.expoPushToken)) {
            console.error(`Push token ${user.expoPushToken} is not a valid Expo push token`);
            return false;
        }
        const messages = [{
                to: user.expoPushToken,
                sound: 'default',
                title,
                body,
                data: data || {},
            }];
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];
        for (let chunk of chunks) {
            try {
                let ticketChunk = yield expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            }
            catch (error) {
                console.error('Error sending push chunk', error);
            }
        }
        return true;
    }
    catch (e) {
        console.error('Error in sendPushNotification', e);
        return false;
    }
});
exports.sendPushNotification = sendPushNotification;
