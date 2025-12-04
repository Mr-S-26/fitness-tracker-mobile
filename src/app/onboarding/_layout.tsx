// src/app/onboarding/_layout.tsx (Verify this content)
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="step1_bio" />
      <Stack.Screen name="step2_goals" />
      <Stack.Screen name="step3_strategy" />
      <Stack.Screen name="step4_logistics" />
      <Stack.Screen name="step5_safety" />
      <Stack.Screen name="generating" options={{ animation: 'fade', gestureEnabled: false }} />
    </Stack>
  );
}