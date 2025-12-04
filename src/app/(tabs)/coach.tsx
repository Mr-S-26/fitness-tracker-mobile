import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Bot, User, Trash2 } from 'lucide-react-native';
import { aiCoach, ChatMessage } from '@/lib/ai/fitness-coach-system';

export default function CoachScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hey! I'm your AI Coach. How can I help with your training today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    // 1. Optimistic Update (Show user message immediately)
    const newHistory: ChatMessage[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newHistory);

    // 2. Get AI Response
    const response = await aiCoach.chat(userMsg);

    // 3. Update UI
    setMessages([...newHistory, { role: 'assistant', content: response }]);
    setLoading(false);
    
    // Scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  };

  const handleClear = () => {
    aiCoach.reset();
    setMessages([{ role: 'assistant', content: "Chat cleared. What's next?" }]);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    if (item.role === 'system') return null;
    
    const isUser = item.role === 'user';
    return (
      <View className={`flex-row mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <View className="bg-purple-100 h-8 w-8 rounded-full items-center justify-center mr-2">
            <Bot size={16} color="#7c3aed" />
          </View>
        )}
        
        <View className={`max-w-[80%] p-4 rounded-2xl ${
          isUser ? 'bg-purple-600 rounded-tr-none' : 'bg-gray-100 rounded-tl-none'
        }`}>
          <Text className={isUser ? 'text-white' : 'text-gray-800'}>
            {item.content}
          </Text>
        </View>

        {isUser && (
          <View className="bg-gray-200 h-8 w-8 rounded-full items-center justify-center ml-2">
            <User size={16} color="#4b5563" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">AI Coach</Text>
        <TouchableOpacity onPress={handleClear} className="p-2">
          <Trash2 size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Chat Area */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ padding: 16 }}
        className="flex-1"
      />

      {/* Input Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View className="p-4 border-t border-gray-100 bg-white flex-row items-center">
          <TextInput
            className="flex-1 bg-gray-100 p-4 rounded-xl mr-2 text-gray-800"
            placeholder="Ask about form, diet, or routine..."
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity 
            onPress={handleSend}
            disabled={loading}
            className={`h-12 w-12 rounded-xl items-center justify-center ${
              loading ? 'bg-gray-300' : 'bg-purple-600'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Send size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}