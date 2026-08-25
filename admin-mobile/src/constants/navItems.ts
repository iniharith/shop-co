/**
 * Ported from backend/admin/src/constants/navItems.ts
 * Drives the "More" hub screen + which hidden tabs a role can open.
 */
import {
  Users2, ShoppingBag, ImageIcon, Printer, Truck, ListTodo, LayoutDashboard,
  MessageSquare, PackageCheck, History, Server, UserCircle, PenTool,
  BarChart3, FolderKanban, CalendarRange, Wrench, Gauge, ListChecks, Search, Shirt,
} from 'lucide-react-native';

export interface HubItem {
  title: string;
  route: string;
  icon: any;
}

export const HubItems: HubItem[] = [
  { title: 'Projects', route: '/projects', icon: FolderKanban },
  { title: 'Users', route: '/users', icon: Users2 },
  { title: 'Search', route: '/search', icon: Search },
  { title: 'Reports', route: '/reports', icon: BarChart3 },
  { title: 'Schedule', route: '/schedule', icon: CalendarRange },
  { title: 'Queue Analytics', route: '/queue-analytics', icon: ListChecks },
  { title: 'Sublimation', route: '/sublimation', icon: Shirt },
  { title: 'Tools', route: '/tools', icon: Wrench },
  { title: 'Monitoring', route: '/monitoring', icon: Gauge },
  { title: 'AWS Media', route: '/aws-media', icon: ImageIcon },
  { title: 'Bot Logs', route: '/bot-logs', icon: MessageSquare },
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
    allowedTitles = ['Orders', 'Tracking', 'Chat', 'Production', 'Sublimation', 'Packaging', 'History'];
  } else if (role === 'packaging') {
    allowedTitles = ['Orders', 'Tracking', 'Chat', 'Packaging', 'History'];
  } else if (role === 'designer') {
    allowedTitles = ['Projects', 'Artworks', 'Print Drafts', 'Tasks', 'Chat'];
  } else if (role === 'awapparel') {
    allowedTitles = ['Sublimation'];
  } else if (role !== 'sysadmin' && role !== 'admin' && role !== 'boss') {
    // Only sysadmin, admin, and boss can access administrative tools.
    allowedTitles = allowedTitles.filter(
      (t) => !['Server Status', 'Tools', 'Monitoring', 'Reports', 'Schedule', 'Queue Analytics', 'AWS Media', 'Bot Logs', 'Users'].includes(t),
    );
  }

  return HubItems.filter((i) => allowedTitles.includes(i.title));
};

export const mobileNavGroups = (role?: string) => {
  const groups = [
    { title: 'Overview', items: [{ title: 'Dashboard', route: '/', icon: LayoutDashboard }] },
    { title: 'Operations', items: [
      { title: 'Orders', route: '/orders', icon: ShoppingBag },
      { title: 'Artworks', route: '/artworks', icon: ImageIcon },
      { title: 'Print Drafts', route: '/print-drafts', icon: Printer },
      { title: 'Tracking', route: '/tracking', icon: Truck },
      { title: 'Tasks', route: '/tasks', icon: ListTodo },
      { title: 'Projects', route: '/projects', icon: FolderKanban },
      { title: 'Sublimation', route: '/sublimation', icon: Shirt },
      { title: 'Schedule', route: '/schedule', icon: CalendarRange },
      { title: 'Chat', route: '/chat', icon: MessageSquare },
      { title: 'Production', route: '/production', icon: PenTool },
      { title: 'Packaging', route: '/packaging', icon: PackageCheck },
      { title: 'History', route: '/history', icon: History },
    ] },
    { title: 'Administration', items: [
      { title: 'Users', route: '/users', icon: Users2 },
      { title: 'Search', route: '/search', icon: Search },
      { title: 'Reports', route: '/reports', icon: BarChart3 },
      { title: 'Queue Analytics', route: '/queue-analytics', icon: ListChecks },
      { title: 'Tools', route: '/tools', icon: Wrench },
      { title: 'Monitoring', route: '/monitoring', icon: Gauge },
      { title: 'Server Status', route: '/server-status', icon: Server },
    ] },
    { title: 'Account', items: [{ title: 'Profile', route: '/profile', icon: UserCircle }] },
  ];

  const opsAllowed = (() => {
    if (role === 'production') return ['Orders', 'Tracking', 'Chat', 'Production', 'Packaging', 'History', 'Sublimation'];
    if (role === 'packaging') return ['Orders', 'Tracking', 'Chat', 'Packaging', 'History'];
    if (role === 'designer') return ['Artworks', 'Print Drafts', 'Tasks', 'Chat', 'Projects'];
    if (role === 'awapparel') return ['Sublimation'];
    return null;
  })();
  if (opsAllowed) groups[1].items = groups[1].items.filter((item) => opsAllowed.includes(item.title));
  if (!['sysadmin', 'admin', 'boss'].includes(role || '')) {
    groups[2].items = groups[2].items.filter((item) => item.title !== 'Server Status' && item.title !== 'Monitoring');
  }

  return groups.filter((group) => group.items.length > 0);
};
