/**
 * Coded by Harith
 * Kampungcetak ®
 */
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
        title: 'Projects',
        url: '/admin/projects',
        icon: 'kanban',
        shortcut: ['p', 'j'],
        isActive: false,
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
        title: 'Print Drafts',
        url: '/admin/print-drafts',
        icon: 'printer',
        shortcut: ['p', 'd'],
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
    {
        title: 'Tools',
        url: '/admin/tools',
        icon: 'wrench',
        shortcut: ['t', 'o'],
        isActive: false,
        items: [
            {
                title: 'Tools Overview',
                url: '/admin/tools',
            },
            {
                title: 'Reports',
                url: '/admin/reports',
            },
            {
                title: 'Image Upscale',
                url: '/admin/tools/upscale',
            },
            {
                title: 'Server Status',
                url: '/admin/server-status',
            },
            {
                title: 'AWS Media Server',
                url: '/admin/aws-media',
            },
            {
                title: 'WhatsApp AI Logs',
                url: '/admin/whatsapp-logs',
            }
        ]
    }
];

export const roleByNavItems = (role: string) => {
    let allowedTitles = AdminNavItems.map(item => item.title); // Default: all allowed
    
    if (role === "production") {
        allowedTitles = ['Tracking', 'Chat', 'Production', 'Packaging', 'History'];
    } else if (role === "packaging") {
        allowedTitles = ['Tracking', 'Chat', 'Packaging', 'History'];
    } else if (role === "designer") {
        allowedTitles = ['Projects', 'Artworks', 'Print Drafts', 'Tasks', 'Chat'];
    } else if (role !== "sysadmin" && role !== "admin" && role !== "boss") {
        // Only sysadmin, admin, and boss can access the administrative tools.
        allowedTitles = allowedTitles.filter(title => title !== 'Server Status' && title !== 'Tools');
    }

    return AdminNavItems
        .filter(item => allowedTitles.includes(item.title))
        .map(item => item.title === 'Tools' && role !== 'sysadmin'
            ? { ...item, items: item.items?.filter(child => child.url !== '/admin/whatsapp-logs') }
            : item
        );
};
