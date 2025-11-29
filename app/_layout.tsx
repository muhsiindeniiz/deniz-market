import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/store/authStore';
import Toast from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import '../global.css';

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function RootLayout() {
  const { checkAuth } = useAuthStore();
  const { visible, message, type, duration, hideToast } = useToast();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.warn('Initialization error:', error);
      } finally {
        setAppIsReady(true);
      }
    };

    initialize();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1}} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
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