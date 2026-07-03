import { Tabs } from 'expo-router';
import { LayoutDashboard, CheckSquare, ShoppingBag, Image as ImageIcon, Grid2x2 } from 'lucide-react-native';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0a', elevation: 1, shadowOpacity: 0.1 },
        headerTintColor: '#fafafa',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: { backgroundColor: '#0a0a0a', borderTopWidth: 1, borderTopColor: '#262626', height: 60, paddingBottom: 8, paddingTop: 8 },
        tabBarActiveTintColor: 'hsl(45, 93%, 47%)',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      {/* --- Visible floating tab bar (unchanged pattern) --- */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <CheckSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="artworks"
        options={{
          title: 'Artworks',
          tabBarIcon: ({ color, size }) => <ImageIcon size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <Grid2x2 size={size} color={color} />,
        }}
      />

      {/* --- Hidden routes: reachable via the "More" hub, not shown as tabs --- */}
      <Tabs.Screen name="users" options={{ href: null, title: 'Users' }} />
      <Tabs.Screen name="tracking" options={{ href: null, title: 'Tracking' }} />
      <Tabs.Screen name="print-drafts" options={{ href: null, title: 'Print Drafts' }} />
      <Tabs.Screen name="history" options={{ href: null, title: 'History' }} />
      <Tabs.Screen name="chat" options={{ href: null, title: 'Chat' }} />
      <Tabs.Screen name="production" options={{ href: null, title: 'Production' }} />
      <Tabs.Screen name="packaging" options={{ href: null, title: 'Packaging' }} />
      <Tabs.Screen name="server-status" options={{ href: null, title: 'Server Status' }} />
      <Tabs.Screen name="profile" options={{ href: null, title: 'Profile' }} />
    </Tabs>
  );
}
