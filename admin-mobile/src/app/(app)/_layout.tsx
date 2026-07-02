import { Drawer } from 'expo-router/drawer';
import { LayoutDashboard, CheckSquare, Package, Image as ImageIcon, Box } from 'lucide-react-native';

export default function AppLayout() {
  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a', elevation: 0, shadowOpacity: 0 },
        headerTintColor: '#ffffff',
        drawerStyle: { backgroundColor: '#0f172a', width: 280 },
        drawerActiveTintColor: '#0f172a',
        drawerActiveBackgroundColor: 'hsl(45, 93%, 47%)',
        drawerInactiveTintColor: '#94a3b8',
        drawerLabelStyle: { fontSize: 16, fontWeight: '600', marginLeft: -10 },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Dashboard',
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="tasks"
        options={{
          drawerLabel: 'Tasks',
          title: 'Tasks Kanban',
          drawerIcon: ({ color, size }) => <CheckSquare size={size} color={color} />,
        }}
      />
    </Drawer>
  );
}
