import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { router, Link } from 'expo-router';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // 1. Basic Validation (Check inputs BEFORE calling Supabase)
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    
    // 2. Call Supabase
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
    });

    setLoading(false);

    // 3. Handle Response
    if (error) {
      console.error("Signup Error:", error.message);
      Alert.alert('Signup Failed', error.message);
    } else {
      // Success! Redirect to Login page so the user can sign in properly.
      // This ensures our "Traffic Cop" logic in login.tsx runs to check their onboarding status.
      
      if (data.session) {
        // User created and auto-logged in (if email confirm is OFF)
        Alert.alert('Success', 'Account created! Please log in.');
        router.replace('/(auth)/login');
      } else {
        // User created but needs email verification
        Alert.alert('Check your email', 'Please confirm your email address before logging in.');
        router.replace('/(auth)/login');
      }
    }
  };

  return (
    <View className="flex-1 justify-center p-6 bg-white">
      <Text className="text-3xl font-bold text-center mb-8">Create Account</Text>
      
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="bg-gray-100 p-4 rounded-xl mb-4"
      />
      
      <TextInput
        placeholder="Password (min 6 chars)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="bg-gray-100 p-4 rounded-xl mb-6"
      />

      <TouchableOpacity 
        onPress={handleSignup}
        disabled={loading}
        className={`p-4 rounded-xl ${loading ? 'bg-purple-400' : 'bg-purple-600'}`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-bold">Sign Up</Text>
        )}
      </TouchableOpacity>

      <Link href="/(auth)/login" asChild>
        <TouchableOpacity className="mt-4">
          <Text className="text-center text-gray-500">Already have an account? Log In</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}