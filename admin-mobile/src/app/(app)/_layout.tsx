import { Drawer } from 'expo-router/drawer';

export default function AppLayout() {
  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: 'hsl(0, 0%, 6%)' },
        headerTintColor: 'hsl(0, 0%, 98%)',
        drawerStyle: { backgroundColor: 'hsl(0, 0%, 6%)' },
        drawerActiveTintColor: 'hsl(45, 93%, 47%)',
        drawerInactiveTintColor: 'hsl(0, 0%, 98%)',
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Orders',
          title: 'Orders',
        }}
      />
      <Drawer.Screen
        name="tasks"
        options={{
          drawerLabel: 'Tasks',
          title: 'Tasks',
        }}
      />
    </Drawer>
  );
}
