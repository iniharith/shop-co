import { Tabs } from 'expo-router';
import { LayoutDashboard, CheckSquare, ShoppingBag, Image as ImageIcon } from 'lucide-react-native';
import FloatingTabBar from '../../components/FloatingTabBar';
import { ThemeProvider } from '../../context/ThemeContext';
import { BlurRoot } from '../../components/FrostedView';

export default function AppLayout() {
  return (
    <ThemeProvider>
      <BlurRoot>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
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
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
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
            tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
          }}
        />
      </Tabs>
      </BlurRoot>
    </ThemeProvider>
  );
}
