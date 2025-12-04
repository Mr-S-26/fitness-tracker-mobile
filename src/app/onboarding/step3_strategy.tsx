import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Dumbbell, User } from 'lucide-react-native';

export default function StrategyStep() {
  const params = useLocalSearchParams();
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [strengthType, setStrengthType] = useState<'bodyweight' | 'weighted'>('bodyweight');
  
  // --- PR States ---
  // Weighted
  const [bench, setBench] = useState('');
  const [squat, setSquat] = useState(''); // Renamed to match calculator
  const [deadlift, setDeadlift] = useState(''); // ✅ Added
  const [overhead, setOverhead] = useState(''); // ✅ Added
  const [weightedPullup, setWeightedPullup] = useState('');

  // Bodyweight
  const [pushups, setPushups] = useState('');
  const [pullups, setPullups] = useState('');
  const [squatReps, setSquatReps] = useState('');
  const [plank, setPlank] = useState('');

  const bodyParts = ['Chest', 'Back', 'Legs', 'Arms', 'Abs', 'Glutes', 'Shoulders'];

  const toggleFocus = (part: string) => {
    if (focusAreas.includes(part)) {
      setFocusAreas(prev => prev.filter(p => p !== part));
    } else {
      if (focusAreas.length < 3) {
        setFocusAreas(prev => [...prev, part]);
      }
    }
  };

  const handleNext = () => {
    router.push({
      pathname: '/onboarding/step4_logistics',
      params: { 
        ...params, 
        focus_areas: JSON.stringify(focusAreas),
        strength_type: strengthType,
        
        // ✅ CORRECT MAPPING FOR CALCULATOR
        bench_press: bench, 
        squat: squat, 
        deadlift: deadlift,
        overhead_press: overhead,
        max_weighted_pullup: weightedPullup,

        // Pass Bodyweight Stats
        max_pushups: pushups,
        max_pullups: pullups,
        max_squat_reps: squatReps,
        max_plank: plank
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Section 1: Focus Areas */}
        <Text className="text-3xl font-bold text-gray-900 mb-2">Priority Areas</Text>
        <Text className="text-gray-500 mb-6">Select up to 3 areas to prioritize.</Text>
        
        <View className="flex-row flex-wrap gap-2 mb-8">
          {bodyParts.map((part) => (
            <TouchableOpacity
              key={part}
              onPress={() => toggleFocus(part)}
              className={`px-4 py-3 rounded-full border ${
                focusAreas.includes(part) 
                  ? 'bg-purple-600 border-purple-600' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`font-bold ${focusAreas.includes(part) ? 'text-white' : 'text-gray-600'}`}>
                {part}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section 2: Strength Baseline */}
        <Text className="text-2xl font-bold text-gray-900 mb-2">Current Strength</Text>
        <Text className="text-gray-500 mb-6">Enter your estimated 1 Rep Max (1RM).</Text>

        {/* Toggle Switch */}
        <View className="flex-row bg-gray-100 p-1 rounded-xl mb-6">
          <TouchableOpacity 
            onPress={() => setStrengthType('bodyweight')}
            className={`flex-1 py-3 rounded-lg items-center flex-row justify-center gap-2 ${
              strengthType === 'bodyweight' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <User size={18} color={strengthType === 'bodyweight' ? '#7c3aed' : '#6b7280'} />
            <Text className="font-bold text-gray-700">Bodyweight</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setStrengthType('weighted')}
            className={`flex-1 py-3 rounded-lg items-center flex-row justify-center gap-2 ${
              strengthType === 'weighted' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Dumbbell size={18} color={strengthType === 'weighted' ? '#7c3aed' : '#6b7280'} />
            <Text className="font-bold text-gray-700">Weights</Text>
          </TouchableOpacity>
        </View>

        {/* Conditional Inputs */}
        {strengthType === 'weighted' ? (
          <View className="space-y-4">
            <Text className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg mb-2">
              ⚠️ If you don't know a number, leave it blank (we'll assume beginner).
            </Text>
            <InputRow label="Bench Press" value={bench} onChange={setBench} unit="kg" />
            <InputRow label="Squat" value={squat} onChange={setSquat} unit="kg" />
            <InputRow label="Deadlift" value={deadlift} onChange={setDeadlift} unit="kg" />
            <InputRow label="Overhead Press" value={overhead} onChange={setOverhead} unit="kg" />
            <InputRow label="Weighted Pull-up" value={weightedPullup} onChange={setWeightedPullup} unit="kg" />
          </View>
        ) : (
          <View className="space-y-4">
             <Text className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mb-2">
              ⚠️ Enter max reps performed in a single set.
            </Text>
            <InputRow label="Pushups" value={pushups} onChange={setPushups} unit="reps" />
            <InputRow label="Pull-ups" value={pullups} onChange={setPullups} unit="reps" />
            <InputRow label="Squats (Air)" value={squatReps} onChange={setSquatReps} unit="reps" />
            <InputRow label="Plank Hold" value={plank} onChange={setPlank} unit="sec" />
          </View>
        )}

      </ScrollView>

      <TouchableOpacity onPress={handleNext} className="bg-purple-600 py-4 rounded-2xl items-center mt-4">
        <Text className="text-white font-bold text-lg">Next Step →</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function InputRow({ label, value, onChange, unit }: any) {
  return (
    <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
      <Text className="font-bold text-gray-700">{label}</Text>
      <View className="flex-row items-center gap-2">
        <TextInput 
          value={value}
          onChangeText={onChange}
          placeholder="0"
          keyboardType="numeric"
          className="text-right font-bold text-lg text-gray-900 w-16"
        />
        <Text className="text-gray-400 font-medium">{unit}</Text>
      </View>
    </View>
  );
}