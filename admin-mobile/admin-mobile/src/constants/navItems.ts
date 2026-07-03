/**
 * Ported from backend/admin/src/constants/navItems.ts
 * Drives the "More" hub screen + which hidden tabs a role can open.
 */
import {
  Users2, ShoppingBag, ImageIcon, Printer, Truck, ListTodo,
  MessageSquare, PackageCheck, History, Server, UserCircle,
} from 'lucide-react-native';

export interface HubItem {
  title: string;
  route: string;
  icon: any;
}

export const HubItems: HubItem[] = [
  { title: 'Users', route: '/users', icon: Users2 },
  { title: 'Tracking', route: '/tracking', icon: Truck },
  { title: 'Print Drafts', route: '/print-drafts', icon: Printer },
  { title: 'History', route: '/history', icon: History },
  { title: 'Chat', route: '/chat', icon: MessageSquare },
  { title: 'Production', route: '/production', icon: Printer },
  { title: 'Packaging', route: '/packaging', icon: PackageCheck },
  { title: 'Server Status', route: '/server-status', icon: Server },
  { title: 'Profile', route: '/profile', icon: UserCircle },
];

// Mirrors roleByNavItems() from the web admin — keeps mobile permissions in sync.
export const hubItemsForRole = (role?: string): HubItem[] => {
  let allowedTitles = HubItems.map((i) => i.title);

  if (role === 'production') {
    allowedTitles = ['Tracking', 'Chat', 'Production', 'History', 'Profile'];
  } else if (role === 'packaging') {
    allowedTitles = ['Tracking', 'Chat', 'Packaging', 'History', 'Profile'];
  } else if (role === 'designer') {
    allowedTitles = ['Chat', 'Print Drafts', 'Profile'];
  } else if (role !== 'sysadmin' && role !== 'admin' && role !== 'boss') {
    allowedTitles = allowedTitles.filter((t) => t !== 'Users' && t !== 'Server Status');
  }

  return HubItems.filter((i) => allowedTitles.includes(i.title));
};
