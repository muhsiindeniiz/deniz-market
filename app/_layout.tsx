import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/store/authStore';
import Toast from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { checkAuth, isLoading } = useAuthStore();
  const { visible, message, type, duration, hideToast } = useToast();

  useEffect(() => {
    const initialize = async () => {
      GoogleSignin.configure({
        iosClientId: "491979314052-k2kna9glv0phkhbjf59tiaikfmugd2nu.apps.googleusercontent.com",
        webClientId: "491979314052-0usbel7amqladm9c0nl6549b70fb48u6.apps.googleusercontent.com",
        offlineAccess: true,
      });

      await checkAuth();
      await SplashScreen.hideAsync();
    };

    initialize();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="splash" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="search" options={{ presentation: 'modal' }} />
          <Stack.Screen name="product/[id]" />
          <Stack.Screen name="category/[id]" />
          <Stack.Screen name="order-confirmation" />
          <Stack.Screen name="order-tracking/[id]" />
          <Stack.Screen name="addresses" />
          <Stack.Screen name="add-address" />
          <Stack.Screen name="edit-address/[id]" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="edit-email" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="help" />
          <Stack.Screen name="contact" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="privacy" />
          <Stack.Screen name="reviews/[productId]" />
        </Stack>
        <StatusBar style="auto" />
        {visible && (
          <Toast
            message={message}
            type={type}
            duration={duration}
            onHide={hideToast}
          />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}