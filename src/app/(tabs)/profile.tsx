import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase/client';
import { router } from 'expo-router';
import { Settings, User, Dumbbell, Utensils, Calendar, ChevronRight, LogOut, Edit2, Save, X, Minus, Plus, Ruler, Scale } from 'lucide-react-native';

// Options for dropdowns/toggles
const GOAL_OPTIONS = ['muscle_gain', 'strength', 'fat_loss', 'general_fitness', 'athletic_performance'];
const COMMON_EQUIPMENT = [
  'Bodyweight', 'Dumbbell', 'Barbell', 'Cable', 'Machine', 
  'Smith Machine', 'Kettlebell', 'Band', 'Pull Up Bar'
];

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Data State
  const [userEmail, setUserEmail] = useState<string>('');
  const [profile, setProfile] = useState<any>(null);
  const [nutrition, setNutrition] = useState<any>(null);

  // Edit Form State
  const [formData, setFormData] = useState({
    primary_goal: '',
    days_per_week: 3,
    session_duration: 60,
    weight_kg: 70,
    height_cm: 170,
    equipment: [] as string[],
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || 'No Email');

      const { data: profileData, error: profileError } = await supabase
        .from('user_fitness_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) console.warn("Profile fetch error:", profileError);
      
      if (profileData) {
        setProfile(profileData);
        // Initialize form data with DB values or defaults
        setFormData({
          primary_goal: profileData.primary_goal || 'muscle_gain',
          days_per_week: profileData.days_per_week || 3,
          session_duration: profileData.session_duration || 60,
          weight_kg: profileData.weight_kg || 70,
          height_cm: profileData.height_cm || 170,
          equipment: Array.isArray(profileData.equipment) ? profileData.equipment : [],
        });
      }

      const { data: nutritionData } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .single();

      setNutrition(nutritionData);

    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // 1. Update Database
      const { error } = await supabase
        .from('user_fitness_profiles')
        .update({
          primary_goal: formData.primary_goal,
          days_per_week: formData.days_per_week,
          session_duration: formData.session_duration,
          weight_kg: formData.weight_kg,
          height_cm: formData.height_cm,
          equipment: formData.equipment,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // 2. Update Local State
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
      Alert.alert("Success", "Profile updated. Note: You may need to regenerate your program for these changes to take full effect.");

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    // 1. Web Logic (Browser Confirm Dialog)
    if (Platform.OS === 'web') {
      const confirmed = window.confirm("Are you sure you want to log out?");
      if (confirmed) {
        await supabase.auth.signOut();
        router.replace('/(auth)/login');
      }
      return;
    }

    // 2. Mobile Logic (Native Alert)
    Alert.alert("Sign Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Sign Out", 
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  // Helper to cycle through goals
  const cycleGoal = () => {
    const currentIndex = GOAL_OPTIONS.indexOf(formData.primary_goal);
    const nextIndex = (currentIndex + 1) % GOAL_OPTIONS.length;
    setFormData({ ...formData, primary_goal: GOAL_OPTIONS[nextIndex] });
  };

  // Helper to toggle equipment in list
  const toggleEquipment = (item: string) => {
    const normalize = (s: string) => s.toLowerCase();
    const target = normalize(item);
    
    setFormData(prev => {
      const currentList = prev.equipment || [];
      const exists = currentList.some(e => normalize(e) === target);
      
      let newList;
      if (exists) {
        newList = currentList.filter(e => normalize(e) !== target);
      } else {
        newList = [...currentList, item]; // Add strict casing for display niceness
      }
      return { ...prev, equipment: newList };
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#7c3aed" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
  className="flex-1 p-4" 
  contentContainerStyle={{ paddingBottom: 100 }} // <--- THIS FIXES THE ISSUE
  showsVerticalScrollIndicator={false}
>
        
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-3xl font-bold text-gray-900">Profile</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            {isEditing ? <X color="#ef4444" size={24} /> : <Edit2 color="#374151" size={24} />}
          </TouchableOpacity>
        </View>

        {/* User Card */}
        <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm flex-row items-center space-x-4">
          <View className="h-16 w-16 bg-purple-100 rounded-full items-center justify-center">
            <User color="#7c3aed" size={32} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">{userEmail}</Text>
            
            {isEditing ? (
              <TouchableOpacity onPress={cycleGoal} className="bg-gray-100 px-3 py-1 rounded-lg mt-1 self-start">
                <Text className="text-purple-600 font-bold capitalize">
                  {formData.primary_goal.replace('_', ' ')} (Tap to Change)
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-gray-500 capitalize">
                {profile?.experience_level} • {profile?.primary_goal?.replace('_', ' ')}
              </Text>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between mb-4">
          
          {/* Schedule Card */}
          <View className="bg-white p-4 rounded-2xl w-[100%] shadow-sm mb-4">
            <View className="flex-row items-center mb-3">
              <Calendar color="#7c3aed" size={24} className="mr-2" />
              <Text className="text-gray-500 font-bold">Training Schedule</Text>
            </View>

            {isEditing ? (
              <View className="flex-row justify-between items-center gap-4">
                {/* Days Editor */}
                <View className="items-center">
                  <Text className="text-gray-400 text-xs mb-1">Days / Week</Text>
                  <View className="flex-row items-center bg-gray-50 rounded-lg">
                    <TouchableOpacity onPress={() => setFormData(p => ({...p, days_per_week: Math.max(1, p.days_per_week - 1)}))} className="p-3">
                      <Minus size={16} color="black" />
                    </TouchableOpacity>
                    <Text className="font-bold text-lg w-6 text-center">{formData.days_per_week}</Text>
                    <TouchableOpacity onPress={() => setFormData(p => ({...p, days_per_week: Math.min(7, p.days_per_week + 1)}))} className="p-3">
                      <Plus size={16} color="black" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Duration Editor */}
                <View className="items-center">
                  <Text className="text-gray-400 text-xs mb-1">Minutes / Session</Text>
                  <View className="flex-row items-center bg-gray-50 rounded-lg">
                    <TouchableOpacity onPress={() => setFormData(p => ({...p, session_duration: Math.max(15, p.session_duration - 15)}))} className="p-3">
                      <Minus size={16} color="black" />
                    </TouchableOpacity>
                    <Text className="font-bold text-lg w-10 text-center">{formData.session_duration}</Text>
                    <TouchableOpacity onPress={() => setFormData(p => ({...p, session_duration: Math.min(180, p.session_duration + 15)}))} className="p-3">
                      <Plus size={16} color="black" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-2xl font-bold">{profile?.days_per_week || 0}</Text>
                  <Text className="text-gray-400 text-xs">Days/Week</Text>
                </View>
                <View>
                  <Text className="text-2xl font-bold">{profile?.session_duration || 0}</Text>
                  <Text className="text-gray-400 text-xs">Minutes</Text>
                </View>
              </View>
            )}
          </View>

          {/* Body Stats Card (NEW) */}
          <View className="bg-white p-4 rounded-2xl w-[100%] shadow-sm mb-4">
            <View className="flex-row items-center mb-3">
              <Scale color="#f59e0b" size={24} className="mr-2" />
              <Text className="text-gray-500 font-bold">Body Metrics</Text>
            </View>
            
            {isEditing ? (
              <View className="flex-row justify-between gap-4">
                 {/* Height Editor */}
                 <View className="flex-1">
                  <Text className="text-gray-400 text-xs mb-1">Height (cm)</Text>
                  <View className="flex-row items-center bg-gray-50 rounded-lg h-12 px-2">
                    <Ruler size={16} color="#9ca3af" />
                    <TextInput 
                      value={formData.height_cm.toString()}
                      onChangeText={(t) => setFormData({...formData, height_cm: parseInt(t) || 0})}
                      keyboardType="numeric"
                      className="flex-1 text-center font-bold text-lg text-gray-900"
                    />
                  </View>
                </View>

                 {/* Weight Editor */}
                 <View className="flex-1">
                  <Text className="text-gray-400 text-xs mb-1">Weight (kg)</Text>
                  <View className="flex-row items-center bg-gray-50 rounded-lg h-12 px-2">
                    <Scale size={16} color="#9ca3af" />
                    <TextInput 
                      value={formData.weight_kg.toString()}
                      onChangeText={(t) => setFormData({...formData, weight_kg: parseInt(t) || 0})}
                      keyboardType="numeric"
                      className="flex-1 text-center font-bold text-lg text-gray-900"
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View className="flex-row justify-between">
                 <View>
                  <Text className="text-2xl font-bold">{profile?.height_cm || '-'}</Text>
                  <Text className="text-gray-400 text-xs">Height (cm)</Text>
                </View>
                <View>
                  <Text className="text-2xl font-bold">{profile?.weight_kg || '-'}</Text>
                  <Text className="text-gray-400 text-xs">Weight (kg)</Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Nutrition Card (Read Only) */}
          <View className="bg-white p-4 rounded-2xl w-[100%] shadow-sm mb-4 flex-row justify-between items-center">
            <View>
              <View className="flex-row items-center mb-1">
                <Utensils color="#10b981" size={20} className="mr-2" />
                <Text className="text-gray-500 font-bold">Nutrition Targets</Text>
              </View>
              <Text className="text-gray-400 text-xs w-48">Calculated based on your goals and weight.</Text>
            </View>
            <View className="items-end">
              <Text className="text-xl font-bold text-green-600">{nutrition?.calories || 0}</Text>
              <Text className="text-xs text-gray-400">kcal</Text>
            </View>
          </View>
        </View>

        {/* Equipment Section */}
        <View className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden">
          <View className="p-4 border-b border-gray-100">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Dumbbell color="#4b5563" size={20} className="mr-2" />
                <Text className="font-bold text-gray-800">Available Equipment</Text>
              </View>
              {isEditing && <Text className="text-xs text-purple-600">Tap to toggle</Text>}
            </View>

            <View className="flex-row flex-wrap gap-2 mt-2">
              {isEditing ? (
                // EDIT MODE: Show all common options to toggle
                COMMON_EQUIPMENT.map((item, index) => {
                  const isActive = formData.equipment.some(e => e.toLowerCase() === item.toLowerCase());
                  return (
                    <TouchableOpacity 
                      key={index} 
                      onPress={() => toggleEquipment(item)}
                      className={`px-3 py-2 rounded-full border ${isActive ? 'bg-purple-100 border-purple-200' : 'bg-white border-gray-200'}`}
                    >
                      <Text className={`text-xs font-bold ${isActive ? 'text-purple-700' : 'text-gray-400'}`}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                // VIEW MODE: Show only selected
                profile?.equipment?.length > 0 ? (
                  profile.equipment.map((item: string, index: number) => (
                    <View key={index} className="bg-gray-100 px-3 py-1 rounded-full">
                      <Text className="text-xs text-gray-600 capitalize">{item.replace('_', ' ')}</Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-gray-400 text-sm">No equipment listed</Text>
                )
              )}
            </View>
          </View>
        </View>

        {/* Save Button (Only visible when editing) */}
        {isEditing && (
          <TouchableOpacity 
            onPress={handleSave}
            disabled={saving}
            className={`p-4 rounded-2xl mb-4 flex-row items-center justify-center ${saving ? 'bg-purple-300' : 'bg-purple-600'}`}
          >
            {saving ? <ActivityIndicator color="white" /> : <Save color="white" size={20} className="mr-2" />}
            <Text className="text-white font-bold text-lg">Save Changes</Text>
          </TouchableOpacity>
        )}

        {/* Logout */}
        <View className="mb-10">
          <TouchableOpacity 
            onPress={handleLogout}
            className="bg-white p-4 rounded-2xl shadow-sm flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <LogOut color="#ef4444" size={20} className="mr-3" />
              <Text className="text-red-500 font-bold text-lg">Log Out</Text>
            </View>
            <ChevronRight color="#d1d5db" size={20} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}