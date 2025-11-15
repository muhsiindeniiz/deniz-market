import { useEffect } from 'react';
import { View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen() {
    const router = useRouter();

    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

                setTimeout(() => {
                    if (hasSeenOnboarding) {
                        router.replace('/(tabs)');
                    } else {
                        router.replace('/(onboarding)');
                    }
                }, 2000);
            } catch (error) {
                console.error('Error checking onboarding:', error);
                router.replace('/(onboarding)');
            }
        };

        checkOnboarding();
    }, []);

    return (
        <LinearGradient
            colors={['#E8F5E9', '#FFFDE7']}
            className="flex-1 items-center justify-center"
        >
            <Image
                source={require('@/assets/images/logo.png')}
                className="w-48 h-48"
                resizeMode="contain"
            />
        </LinearGradient>
    );
}