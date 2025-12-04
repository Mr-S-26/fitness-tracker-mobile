import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { router, Link } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    
    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      Alert.alert('Login Failed', authError.message);
      return;
    }

    // 2. Check User Profile for Onboarding Status
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_fitness_profiles')
        .select('onboarding_completed')
        .eq('user_id', authData.user.id)
        .single();

      setLoading(false);

      // 3. Conditional Redirect
      if (profile && profile.onboarding_completed) {
        // User has a program -> Go to Dashboard
        router.replace('/(tabs)/dashboard');
      } else {
        // New user or incomplete setup -> Go to Onboarding
        router.replace('/onboarding/step1_bio');
      }

    } catch (e) {
      // If error (e.g. no profile row exists yet), assume they are new
      setLoading(false);
      router.replace('/onboarding/step1_bio');
    }
  };

  return (
    <View className="flex-1 justify-center p-6 bg-white">
      <Text className="text-3xl font-bold text-center mb-8">Welcome Back</Text>
      
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        className="bg-gray-100 p-4 rounded-xl mb-4"
      />
      
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="bg-gray-100 p-4 rounded-xl mb-6"
      />

      <TouchableOpacity 
        onPress={handleLogin}
        disabled={loading}
        className={`p-4 rounded-xl ${loading ? 'bg-purple-400' : 'bg-purple-600'}`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-bold">Log In</Text>
        )}
      </TouchableOpacity>

      <Link href="/(auth)/signup" asChild>
        <TouchableOpacity className="mt-4">
          <Text className="text-center text-gray-500">Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}