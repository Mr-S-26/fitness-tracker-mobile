import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is open
// src/lib/notifications/push-service.ts

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Keep this for older versions (optional)
    shouldPlaySound: true,
    shouldSetBadge: false,
    
    // ✅ ADD THESE TWO LINES TO FIX THE ERROR
    shouldShowBanner: true, 
    shouldShowList: true,
  }),
});

export async function registerPushNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return null;
  }

  // Get the Expo Push Token
  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    // We return the token data to be saved in your database
    return tokenData; 
  } catch (e) {
    console.error("Error getting push token:", e);
    return null;
  }
}