import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Check, ChevronRight, Minus, Plus, Save, Clock, Info, X, Flame, Snowflake, Activity, ChevronLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase/client';
import { router } from 'expo-router';

// ==========================================
// TYPES & HELPERS
// ==========================================
type WorkoutPhase = 'warmup' | 'exercise' | 'cooldown';

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

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function ExerciseLogger({ sessionId, exercises, sessionWarmup, sessionCooldown }: any) {
  const [localExercises, setLocalExercises] = useState(exercises);
  const [currentPhase, setCurrentPhase] = useState<WorkoutPhase>('warmup'); // Start with Warmup
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [showGuide, setShowGuide] = useState(false);

  // Safety check
  if (!localExercises || localExercises.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>No exercises to display.</Text>
      </View>
    );
  }

  const activeExercise = localExercises[activeExerciseIndex];

  // --- NAVIGATION LOGIC ---
  const handleNext = () => {
    if (currentPhase === 'warmup') {
      setCurrentPhase('exercise');
      setActiveExerciseIndex(0);
    } else if (currentPhase === 'exercise') {
      if (activeExerciseIndex < localExercises.length - 1) {
        setActiveExerciseIndex(i => i + 1);
      } else {
        setCurrentPhase('cooldown');
      }
    } else if (currentPhase === 'cooldown') {
      router.push('/(tabs)/dashboard');
    }
  };

  const handleBack = () => {
    if (currentPhase === 'cooldown') {
      setCurrentPhase('exercise');
      setActiveExerciseIndex(localExercises.length - 1);
    } else if (currentPhase === 'exercise') {
      if (activeExerciseIndex > 0) {
        setActiveExerciseIndex(i => i - 1);
      } else {
        setCurrentPhase('warmup');
      }
    }
  };

  const handleCompleteSet = async (setIndex: number, actualReps: number, weight: number) => {
    const updated = [...localExercises];
    const set = updated[activeExerciseIndex].sets[setIndex];
    
    const newCompletedStatus = !set.completed;
    set.completed = newCompletedStatus;
    set.actual_reps = actualReps;
    set.weight = weight;
    
    setLocalExercises(updated);

    try {
      await supabase.from('set_logs')
        .update({ 
          weight_kg: weight, 
          actual_reps: actualReps, 
          completed_at: newCompletedStatus ? new Date().toISOString() : null 
        })
        .eq('id', set.log_id);
    } catch (err) {
      console.error("Failed to save set:", err);
    }
  };

  // --- RENDERERS ---

  // 1. WARM UP SCREEN
  if (currentPhase === 'warmup') {
    return (
      <View className="flex-1 bg-orange-50 p-6 justify-center">
        <View className="bg-white p-8 rounded-3xl shadow-sm items-center">
          <View className="bg-orange-100 p-4 rounded-full mb-6">
            <Flame size={48} color="#ea580c" fill="#ea580c" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Warm Up</Text>
          <Text className="text-center text-gray-500 mb-8 leading-6">
            {sessionWarmup || "Get your blood flowing with 5-10 mins of light cardio and dynamic stretching."}
          </Text>
          
          <TouchableOpacity 
            onPress={handleNext}
            className="bg-orange-600 w-full py-4 rounded-2xl items-center flex-row justify-center"
          >
            <Text className="text-white font-bold text-lg mr-2">Start Workout</Text>
            <ChevronRight color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3. COOL DOWN SCREEN
  if (currentPhase === 'cooldown') {
    return (
      <View className="flex-1 bg-indigo-50 p-6 justify-center">
        <View className="bg-white p-8 rounded-3xl shadow-sm items-center">
          <View className="bg-indigo-100 p-4 rounded-full mb-6">
            <Snowflake size={48} color="#4f46e5" fill="#4f46e5" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Cool Down</Text>
          <Text className="text-center text-gray-500 mb-8 leading-6">
            {sessionCooldown || "Great job! Take 5-10 mins to stretch major muscle groups and lower your heart rate."}
          </Text>
          
          <View className="w-full gap-4">
            <TouchableOpacity 
              onPress={handleNext}
              className="bg-green-600 w-full py-4 rounded-2xl items-center flex-row justify-center"
            >
              <Text className="text-white font-bold text-lg mr-2">Finish & Save</Text>
              <Save color="white" size={20} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleBack}
              className="bg-white border border-gray-200 w-full py-4 rounded-2xl items-center"
            >
              <Text className="text-gray-500 font-bold">Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // 2. EXERCISE LOGGING SCREEN
  return (
    <View className="flex-1 bg-white">
      
      {/* Header */}
      <View className="p-6 border-b border-gray-100 flex-row justify-between items-start">
        <View className="flex-1 mr-4">
          <Text className="text-2xl font-bold text-gray-900">{activeExercise.exercise_name}</Text>
          <Text className="text-purple-600 font-medium">
            Exercise {activeExerciseIndex + 1} of {localExercises.length}
          </Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => setShowGuide(true)}
          className="bg-blue-50 p-3 rounded-full border border-blue-100"
        >
          <Activity size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Sets List */}
      <ScrollView className="flex-1 p-4">
        {activeExercise.sets.map((set: any, index: number) => (
          <SetRow 
            key={`${activeExerciseIndex}-${index}`} 
            set={set} 
            index={index}
            onComplete={handleCompleteSet} 
          />
        ))}
      </ScrollView>

      {/* Footer Nav */}
      <View className="p-4 border-t border-gray-100 bg-white flex-row gap-4">
        <TouchableOpacity 
          onPress={handleBack}
          className="bg-gray-100 h-14 w-14 rounded-2xl items-center justify-center"
        >
          <ChevronLeft color="#374151" size={24} />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleNext}
          className="flex-1 bg-black h-14 rounded-2xl flex-row items-center justify-center"
        >
          <Text className="text-white font-bold text-lg mr-2">
            {activeExerciseIndex < localExercises.length - 1 ? "Next Exercise" : "Finish & Cool Down"}
          </Text>
          <ChevronRight color="white" size={20} />
        </TouchableOpacity>
      </View>

      {/* FORM GUIDE MODAL (Only Form Guide now) */}
      <Modal animationType="fade" transparent={true} visible={showGuide} onRequestClose={() => setShowGuide(false)}>
        <View className="flex-1 justify-center bg-black/60 p-6">
          <View className="bg-white rounded-3xl p-6">
            
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Activity size={24} color="#2563eb" className="mr-2" />
                <Text className="text-xl font-bold text-gray-900">Form Guide</Text>
              </View>
              <TouchableOpacity onPress={() => setShowGuide(false)} className="bg-gray-100 p-2 rounded-full">
                <X size={20} color="black" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 text-lg leading-7">
              {activeExercise.form_guide || "Maintain controlled movement. Focus on the mind-muscle connection. Keep core tight."}
            </Text>

            <TouchableOpacity 
              onPress={() => setShowGuide(false)}
              className="mt-6 bg-blue-600 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-bold">Got it</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}

// ... SetRow component remains exactly the same as before ...
function SetRow({ set, index, onComplete }: any) {
  const [weight, setWeight] = useState(set.weight || 0); 
  const [reps, setReps] = useState(set.target_reps || 10);

  return (
    <View className={`mb-4 p-4 rounded-2xl border ${set.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <Text className="font-bold text-gray-500">SET {index + 1}</Text>
          {set.rest_seconds && (
            <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-md">
              <Clock size={12} color="#6b7280" />
              <Text className="text-xs text-gray-500 ml-1">{set.rest_seconds}s</Text>
            </View>
          )}
        </View>
        {set.completed && <Check size={20} color="green" />}
      </View>

      <View className="flex-row justify-between items-center gap-2">
        <View className="flex-1">
          <Text className="text-xs text-gray-400 mb-1 text-center">KG</Text>
          <NumberStepper value={weight} onChange={setWeight} step={2.5} />
        </View>

        <View className="flex-1">
          <Text className="text-xs text-gray-400 mb-1 text-center">REPS</Text>
          <NumberStepper value={reps} onChange={setReps} step={1} />
        </View>

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