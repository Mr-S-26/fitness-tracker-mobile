import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Check, ChevronRight, Minus, Plus, Save } from 'lucide-react-native';
import { supabase } from '@/lib/supabase/client';
import { router } from 'expo-router';

// Helper Component: The Number Stepper (Replaces HTML Input)
const NumberStepper = ({ value, onChange, step = 2.5, suffix = '' }: any) => (
  <View className="flex-row items-center bg-gray-100 rounded-xl px-2 h-12">
    <TouchableOpacity onPress={() => onChange(Math.max(0, value - step))} className="p-3">
      <Minus size={20} color="#6b7280" />
    </TouchableOpacity>
    
    <Text className="w-16 text-center font-bold text-lg text-gray-900">
      {value}{suffix}
    </Text>
    
    <TouchableOpacity onPress={() => onChange(value + step)} className="p-3">
      <Plus size={20} color="#6b7280" />
    </TouchableOpacity>
  </View>
);

export default function ExerciseLogger({ sessionId, exercises }: any) {
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [localExercises, setLocalExercises] = useState(exercises);
  
  const activeExercise = localExercises[activeExerciseIndex];

  const handleCompleteSet = async (setIndex: number, actualReps: number, weight: number) => {
    // 1. Optimistic UI Update
    const updated = [...localExercises];
    const set = updated[activeExerciseIndex].sets[setIndex];
    set.completed = !set.completed; // Toggle state
    set.actual_reps = actualReps;
    set.weight = weight;
    setLocalExercises(updated);

    // 2. Save to Supabase (Background)
    if (set.completed) {
      await supabase.from('workout_logs').insert({
        session_id: sessionId,
        exercise_name: activeExercise.exercise_name,
        set_number: set.set_number,
        weight_kg: weight,
        reps: actualReps,
        completed: true
      });
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Exercise Header */}
      <View className="p-6 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">{activeExercise.exercise_name}</Text>
        <Text className="text-purple-600 font-medium">
          Exercise {activeExerciseIndex + 1} of {localExercises.length}
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {activeExercise.sets.map((set: any, index: number) => (
          <SetRow 
            key={index} 
            set={set} 
            index={index}
            onComplete={handleCompleteSet} 
          />
        ))}
      </ScrollView>

      {/* Navigation Footer */}
      <View className="p-4 border-t border-gray-100 bg-white safe-area-pb">
        {activeExerciseIndex < localExercises.length - 1 ? (
          <TouchableOpacity 
            onPress={() => setActiveExerciseIndex(i => i + 1)}
            className="bg-black flex-row justify-center items-center py-4 rounded-2xl"
          >
            <Text className="text-white font-bold text-lg mr-2">Next Exercise</Text>
            <ChevronRight color="white" size={20} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => router.push('/workout/summary')}
            className="bg-green-600 flex-row justify-center items-center py-4 rounded-2xl"
          >
            <Text className="text-white font-bold text-lg mr-2">Finish Workout</Text>
            <Save color="white" size={20} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Sub-component for a single set row
function SetRow({ set, index, onComplete }: any) {
  const [weight, setWeight] = useState(set.weight || 20);
  const [reps, setReps] = useState(set.target_reps || 10);

  return (
    <View className={`mb-4 p-4 rounded-2xl border ${set.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="font-bold text-gray-500">SET {index + 1}</Text>
        {set.completed && <Check size={20} color="green" />}
      </View>

      <View className="flex-row justify-between items-center gap-2">
        {/* Weight Stepper */}
        <View className="flex-1">
          <Text className="text-xs text-gray-400 mb-1 text-center">KG</Text>
          <NumberStepper value={weight} onChange={setWeight} step={2.5} />
        </View>

        {/* Reps Stepper */}
        <View className="flex-1">
          <Text className="text-xs text-gray-400 mb-1 text-center">REPS</Text>
          <NumberStepper value={reps} onChange={setReps} step={1} />
        </View>

        {/* Check Button */}
        <TouchableOpacity 
          onPress={() => onComplete(index, reps, weight)}
          className={`h-12 w-12 rounded-xl items-center justify-center ml-2 ${
            set.completed ? 'bg-green-500' : 'bg-gray-200'
          }`}
        >
          <Check size={24} color={set.completed ? 'white' : '#9ca3af'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}