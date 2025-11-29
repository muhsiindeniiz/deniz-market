import { useEffect, useState, useCallback, useRef } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
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
  const { initialize, isInitialized, isLoading, isAuthenticated } = useAuthStore();
  const { visible, message, type, duration, hideToast } = useToast();
  const [appIsReady, setAppIsReady] = useState(false);

  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const hasNavigated = useRef(false);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initialize();
      } catch (error) {
        console.warn('Initialization error:', error);
      } finally {
        setAppIsReady(true);
      }
    };

    initializeApp();
  }, []);

  // Protected route logic
  useEffect(() => {
    // Navigation hazır değilse bekle
    if (!navigationState?.key) return;
    if (!isInitialized || isLoading || !appIsReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const inProtectedRoute = segments[0] === '(tabs)';

    // Zaten doğru yerdeyse navigate etme
    if (isAuthenticated && inProtectedRoute) return;
    if (!isAuthenticated && (inOnboarding || inAuthGroup)) return;

    // Sadece bir kez navigate et
    if (hasNavigated.current) return;

    if (!isAuthenticated && inProtectedRoute) {
      hasNavigated.current = true;
      router.replace('/(onboarding)');
    } else if (isAuthenticated && (inAuthGroup || inOnboarding)) {
      hasNavigated.current = true;
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, isInitialized, segments, navigationState?.key, appIsReady]);

  // Auth state değiştiğinde flag'i resetle
  useEffect(() => {
    hasNavigated.current = false;
  }, [isAuthenticated]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && isInitialized && !isLoading) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, isInitialized, isLoading]);

  if (!appIsReady || !isInitialized || isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
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