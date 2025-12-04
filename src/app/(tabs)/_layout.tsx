import { Tabs } from 'expo-router';
import { Chrome as Home, Dumbbell, User, MessageSquare } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#7c3aed', headerShown: false }}>
      <Tabs.Screen 
        name="dashboard" 
        options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="workout" 
        options={{ title: 'Workout', tabBarIcon: ({ color }) => <Dumbbell size={24} color={color} /> }} 
      />
      
      {/* ✅ ADD THIS TAB */}
      <Tabs.Screen 
        name="coach" 
        options={{ title: 'Coach', tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} /> }} 
      />

      <Tabs.Screen 
        name="profile" 
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <User size={24} color={color} /> }} 
      />
    </Tabs>
  );
}