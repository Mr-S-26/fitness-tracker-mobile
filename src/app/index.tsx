import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase/client';

export default function Index() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // 1. Get Session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // No user -> Go to Login
        setLoading(false);
        router.replace('/(auth)/login');
        return;
      }

      // 2. Check Profile Status
      const { data: profile } = await supabase
        .from('user_fitness_profiles')
        .select('onboarding_completed')
        .eq('user_id', session.user.id)
        .single();

      setLoading(false);

      // 3. Redirect Logic
      if (profile?.onboarding_completed) {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/onboarding/step1_bio');
      }

    } catch (e) {
      // Fallback for any errors -> Login
      setLoading(false);
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#7c3aed" />
    </View>
  );
}