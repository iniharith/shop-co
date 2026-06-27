import { NavItem } from "@/types";

export const AdminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/admin/dashboard',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: [] // Empty array as there are no child items for Dashboard
    },


    {
        title: 'Users',
        url: '/admin/superAdmin/users',
        icon: 'user2',
        shortcut: ['u', 'u'],
        isActive: false,

    },
    {
        title: 'Orders',
        url: '/admin/orders',
        icon: 'box',
        shortcut: ['o', 'o'],
        isActive: false,
    },
    {
        title: 'Artworks',
        url: '/admin/artworks',
        icon: 'object',
        shortcut: ['a', 'a'],
        isActive: false,
    },
    {
        title: 'Tracking',
        url: '/admin/tracking',
        icon: 'supplier',
        shortcut: ['t', 't'],
        isActive: false,
    },
    {
        title: 'Tasks',
        url: '/admin/tasks',
        icon: 'listTodo',
        shortcut: ['k', 'k'],
        isActive: false,
    },
    {
        title: 'Chat',
        url: '/admin/chat',
        icon: 'message',
        shortcut: ['c', 'c'],
        isActive: false,
    },
    {
        title: 'Production',
        url: '/admin/production',
        icon: 'printer',
        shortcut: ['p', 'p'],
        isActive: false,
    },
    {
        title: 'Packaging',
        url: '/admin/packaging',
        icon: 'packageBox',
        shortcut: ['k', 'p'],
        isActive: false,
    },
    {
        title: 'History',
        url: '/admin/history',
        icon: 'history',
        shortcut: ['h', 'h'],
        isActive: false,
    },
];

export const roleByNavItems = (role: string) => {
    let allowedTitles = AdminNavItems.map(item => item.title); // Default: all allowed
    
    if (role === "production") {
        allowedTitles = ['Tracking', 'Chat', 'Production', 'History'];
    } else if (role === "packaging") {
        allowedTitles = ['Tracking', 'Chat', 'Packaging', 'History'];
    } else if (role === "designer") {
        allowedTitles = ['Artworks', 'Tasks', 'Chat'];
    }

    return AdminNavItems.filter(item => allowedTitles.includes(item.title));
};
