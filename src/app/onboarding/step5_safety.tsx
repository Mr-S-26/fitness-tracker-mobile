import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ShieldAlert, CheckCircle } from 'lucide-react-native';

export default function SafetyStep() {
  const params = useLocalSearchParams();
  const [injuries, setInjuries] = useState<string[]>([]);

  const bodyParts = [
    'Shoulders', 'Lower Back', 'Knees', 'Wrists', 
    'Elbows', 'Neck', 'Hips', 'Ankles'
  ];

  const toggleInjury = (part: string) => {
    if (injuries.includes(part)) setInjuries(prev => prev.filter(i => i !== part));
    else setInjuries(prev => [...prev, part]);
  };

  const handleFinish = () => {
    // Format injuries for the database
    const injuryObjects = injuries.map(part => ({
      body_part: part,
      severity: 'moderate',
      description: 'Reported during onboarding',
      occurred_at: new Date().toISOString()
    }));

    router.push({
      pathname: '/onboarding/generating',
      params: { 
        ...params,
        current_injuries: JSON.stringify(injuryObjects) 
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-6">
      <ScrollView>
        <View className="items-center mb-8">
          <View className="bg-red-100 p-4 rounded-full mb-4">
            <ShieldAlert size={40} color="#dc2626" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 text-center">Safety First</Text>
          <Text className="text-gray-500 text-center mt-2">
            Do you have any current injuries? The AI will adapt your plan to avoid these areas.
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3 justify-center mb-8">
          {bodyParts.map((part) => (
            <TouchableOpacity
              key={part}
              onPress={() => toggleInjury(part)}
              className={`px-6 py-4 rounded-2xl border-2 ${
                injuries.includes(part) 
                  ? 'bg-red-50 border-red-500' 
                  : 'bg-white border-gray-100'
              }`}
            >
              <Text className={`font-bold ${injuries.includes(part) ? 'text-red-700' : 'text-gray-600'}`}>
                {part}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {injuries.length === 0 && (
          <View className="bg-green-50 p-4 rounded-xl flex-row items-center justify-center mb-6">
            <CheckCircle size={20} color="green" />
            <Text className="text-green-700 font-bold ml-2">I am injury free!</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        onPress={handleFinish} 
        className="bg-purple-600 py-4 rounded-2xl items-center shadow-lg shadow-purple-200"
      >
        <Text className="text-white font-bold text-lg">
          Generate My Program 🚀
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}