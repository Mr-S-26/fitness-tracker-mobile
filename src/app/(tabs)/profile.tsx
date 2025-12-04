import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase/client';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-6">Your Profile</Text>
      
      <TouchableOpacity 
        onPress={handleLogout}
        className="bg-red-100 p-4 rounded-xl flex-row items-center justify-center"
      >
        <Text className="text-red-600 font-bold">Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}