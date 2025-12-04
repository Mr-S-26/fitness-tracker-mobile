import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ruler, Weight, User } from 'lucide-react-native';

export default function BioStep() {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const handleNext = () => {
    if (!age || !weight || !height) {
      Alert.alert('Missing Info', 'Please fill in all fields to continue.');
      return;
    }
    
    // Pass data to next screen via URL params (simple) or Context (advanced)
    // For simplicity in this tutorial, we will pass via params
    router.push({
      pathname: '/onboarding/step2_goals',
      params: { age, weight, height, gender }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-6 justify-between">
      <View>
        <Text className="text-3xl font-bold text-gray-900 mb-2">Let's get to know you.</Text>
        <Text className="text-gray-500 mb-8">We need this to calculate your calorie needs.</Text>

        {/* Gender Selection */}
        <View className="flex-row gap-4 mb-6">
          {['male', 'female'].map((g) => (
            <TouchableOpacity 
              key={g}
              onPress={() => setGender(g as any)}
              className={`flex-1 py-4 rounded-2xl border-2 items-center ${
                gender === g ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-white'
              }`}
            >
              <Text className={`font-bold capitalize ${gender === g ? 'text-purple-700' : 'text-gray-500'}`}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inputs */}
        <InputRow icon={User} label="Age" value={age} onChange={setAge} placeholder="25" unit="years" />
        <InputRow icon={Weight} label="Weight" value={weight} onChange={setWeight} placeholder="70" unit="kg" />
        <InputRow icon={Ruler} label="Height" value={height} onChange={setHeight} placeholder="175" unit="cm" />
      </View>

      <TouchableOpacity onPress={handleNext} className="bg-purple-600 py-4 rounded-2xl items-center">
        <Text className="text-white font-bold text-lg">Next Step →</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function InputRow({ icon: Icon, label, value, onChange, placeholder, unit }: any) {
  return (
    <View className="mb-4">
      <Text className="text-gray-700 font-bold mb-2">{label}</Text>
      <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
        <Icon size={20} color="#6b7280" />
        <TextInput 
          className="flex-1 ml-3 text-lg font-semibold text-gray-900"
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          keyboardType="numeric"
        />
        <Text className="text-gray-400 font-medium">{unit}</Text>
      </View>
    </View>
  );
}