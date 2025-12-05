import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { router, Link } from 'expo-router';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // 1. Basic Validation
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    
    // 2. Call Supabase Auth
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
    });

    if (error) {
      console.error("Signup Error:", error.message);
      Alert.alert('Signup Failed', error.message);
      setLoading(false);
      return;
    }

    // 3. ✅ NEW STEP: Create the Profile Row in the Database
    // We only do this if we have a user ID (which we do, because Confirm Email is OFF)
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_fitness_profiles')
        .insert([
          { user_id: data.user.id } // Create a largely empty row linked to this user
        ]);

      if (profileError) {
        console.error("Error creating profile:", profileError);
        Alert.alert('Database Error', 'User created but profile failed to save.');
        setLoading(false);
        return;
      }
    }

    setLoading(false);

    // 4. Success! Redirect
    Alert.alert('Success', 'Account created! Logging you in...');
    router.replace('/(auth)/login');
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