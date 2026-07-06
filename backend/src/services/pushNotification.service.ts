import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import User from '../infrastructure/db/models/user.model';

const expo = new Expo();

export const sendPushNotification = async (userId: string, title: string, body: string, data?: any) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.expoPushToken) return false;

        if (!Expo.isExpoPushToken(user.expoPushToken)) {
            console.error(`Push token ${user.expoPushToken} is not a valid Expo push token`);
            return false;
        }

        const messages: ExpoPushMessage[] = [{
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
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending push chunk', error);
            }
        }
        return true;
    } catch (e) {
        console.error('Error in sendPushNotification', e);
        return false;
    }
};
