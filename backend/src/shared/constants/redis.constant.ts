/**
 * Coded by Harith
 * Kampungcetak ®
 */
export const REDIS_KEYS = {
    PRODUCTS: "products",
    CATEGORIES: "categories",
    USERS: "users",
    ORDERS: "orders",
    CART: "cart",
    ADDRESS: "address",
    SOCKET: "socket",
}


export enum REDIS_CHANNELS {
    NOTIFICATION = "notification",
    ORDER_PLACED = "order_placed",
    CHAT_MESSAGE = "chat_message",
    TASK_UPDATED = "task_updated",
}
