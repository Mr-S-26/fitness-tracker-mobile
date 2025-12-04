import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Clock, MapPin, Timer } from 'lucide-react-native'; // Added Timer icon
import DateTimePicker from '@react-native-community/datetimepicker';

export default function LogisticsStep() {
  const params = useLocalSearchParams();
  
  // State
  const [location, setLocation] = useState<'gym' | 'home'>('gym');
  const [days, setDays] = useState([1, 3, 5]); // Default Mon, Wed, Fri
  const [duration, setDuration] = useState(60); // Default 60 mins
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [equipment, setEquipment] = useState<string[]>([]);

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const gymEquipment = ['Barbell', 'Dumbbells', 'Cable Machine', 'Leg Press', 'Pullup Bar'];
  const homeEquipment = ['Dumbbells', 'Resistance Bands', 'Pullup Bar', 'Bench', 'None (Bodyweight)'];
  const durations = [30, 45, 60, 90, 120];

  const toggleDay = (index: number) => {
    if (days.includes(index)) setDays(days.filter(d => d !== index));
    else setDays([...days, index]);
  };

  const toggleEquipment = (item: string) => {
    if (equipment.includes(item)) setEquipment(equipment.filter(e => e !== item));
    else setEquipment([...equipment, item]);
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentDate);
  };

  const handleNext = () => {
    const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    router.push({
      pathname: '/onboarding/step5_safety',
      params: { 
        ...params,
        training_location: location,
        available_days: JSON.stringify(days),
        session_duration: duration, // ✅ Passed to next step
        preferred_time: timeString,
        equipment: JSON.stringify(equipment)
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-bold text-gray-900 mb-2">Setup & Schedule</Text>
        <Text className="text-gray-500 mb-8">Where and when will you train?</Text>

        {/* 1. Location */}
        <View className="flex-row gap-4 mb-8">
          <LocationCard 
            label="Commercial Gym" 
            selected={location === 'gym'} 
            onPress={() => { setLocation('gym'); setEquipment([]); }}
          />
          <LocationCard 
            label="Home Workout" 
            selected={location === 'home'} 
            onPress={() => { setLocation('home'); setEquipment([]); }}
          />
        </View>

        {/* 2. Equipment */}
        <Text className="font-bold text-gray-900 mb-3">Available Equipment</Text>
        <View className="flex-row flex-wrap gap-2 mb-8">
          {(location === 'gym' ? gymEquipment : homeEquipment).map(item => (
            <TouchableOpacity
              key={item}
              onPress={() => toggleEquipment(item)}
              className={`px-3 py-2 rounded-lg border ${
                equipment.includes(item) ? 'bg-purple-100 border-purple-500' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text className={equipment.includes(item) ? 'text-purple-700 font-bold' : 'text-gray-600'}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 3. Schedule */}
        <Text className="font-bold text-gray-900 mb-3">Weekly Schedule</Text>
        <View className="flex-row justify-between mb-8">
          {weekDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => toggleDay(index)}
              className={`h-10 w-10 items-center justify-center rounded-full ${
                days.includes(index) ? 'bg-purple-600' : 'bg-gray-100'
              }`}
            >
              <Text className={days.includes(index) ? 'text-white font-bold' : 'text-gray-500'}>{day}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. Session Duration (NEW) */}
        <Text className="font-bold text-gray-900 mb-3">Session Duration (Minutes)</Text>
        <View className="flex-row justify-between mb-8 bg-gray-50 p-1 rounded-xl border border-gray-100">
          {durations.map((min) => (
            <TouchableOpacity
              key={min}
              onPress={() => setDuration(min)}
              className={`flex-1 py-3 rounded-lg items-center ${
                duration === min ? 'bg-white shadow-sm border border-gray-100' : ''
              }`}
            >
              <Text className={`font-bold ${duration === min ? 'text-purple-700' : 'text-gray-500'}`}>
                {min}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 5. Time Picker */}
        <Text className="font-bold text-gray-900 mb-3">Preferred Workout Time</Text>
        <TouchableOpacity 
          onPress={() => setShowTimePicker(true)}
          activeOpacity={0.7}
          className="flex-row items-center bg-gray-50 p-4 rounded-xl border border-gray-200 active:bg-gray-100"
        >
          <Clock size={20} color="#7c3aed" />
          <Text className="ml-3 text-lg font-bold text-gray-900">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={time}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onTimeChange}
          />
        )}

      </ScrollView>

      <TouchableOpacity onPress={handleNext} className="bg-purple-600 py-4 rounded-2xl items-center mt-4">
        <Text className="text-white font-bold text-lg">Next Step →</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function LocationCard({ label, selected, onPress }: any) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`flex-1 p-4 rounded-xl border-2 items-center ${
        selected ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-white'
      }`}
    >
      <MapPin size={24} color={selected ? '#7c3aed' : '#9ca3af'} />
      <Text className={`mt-2 font-bold ${selected ? 'text-purple-700' : 'text-gray-500'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}