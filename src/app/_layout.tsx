import { Tabs } from 'expo-router';
import { Chrome as Home, Dumbbell, User, Calendar } from 'lucide-react-native';
import "./global.css";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#7c3aed',
      headerShown: false,
      tabBarStyle: {
        borderTopWidth: 0,
        elevation: 0,
        height: 60,
        paddingBottom: 10,
      }
    }}>
      <Tabs.Screen 
        name="dashboard" 
        options={{ 
          title: 'Home', 
          tabBarIcon: ({ color }) => <Home size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="workout" 
        options={{ 
          title: 'Workout', 
          tabBarIcon: ({ color }) => <Dumbbell size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile', 
          tabBarIcon: ({ color }) => <User size={24} color={color} /> 
        }} 
      />
    </Tabs>
  );
}