import { useState } from 'react';
import { View, Text, Image, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { COLORS } from '@/lib/constants';

const { width, height } = Dimensions.get('window');

const onboardingData = [
    {
        id: '1',
        title: 'Deniz Market\'e Hoş Geldiniz',
        description: 'Çiftlikten sofraya taze meyve, sebze ve market ürünleri hızlı ve taze teslimat ile.',
        image: require('@/assets/images/onboarding1.png'),
    },
    {
        id: '2',
        title: 'Doğrudan Yerel Çiftçilerden',
        description: 'En iyi ürünleri almanızı sağlamak için yerel çiftçilerle yakın çalışıyoruz.',
        image: require('@/assets/images/onboarding2.png'),
    },
    {
        id: '3',
        title: 'Aynı Gün Teslimat',
        description: 'Günlük indirimlerin, flash satışların ve her alışverişte daha fazla tasarruf etmenizi sağlayan özel tekliflerin kilidini açın.',
        image: require('@/assets/images/onboarding3.png'),
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentItem = onboardingData[currentIndex];

    const handleNext = () => {
        if (currentIndex < onboardingData.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            handleGetStarted();
        }
    };

    const handleSkip = async () => {
        await handleGetStarted();
    };

    const handleGetStarted = async () => {
        try {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Error saving onboarding status:', error);
            router.replace('/(auth)/login');
        }
    };

    return (
        <View style={styles.container}>
            {/* Arkaplan Resmi */}
            <Animated.View
                key={currentItem.id}
                entering={FadeIn.duration(500)}
                exiting={FadeOut.duration(300)}
                style={StyleSheet.absoluteFill}
            >
                <Image
                    source={currentItem.image}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                />
            </Animated.View>

            {/* Üst Gradient Overlay */}
            <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)', 'transparent']}
                locations={[0, 0.5, 1]}
                style={styles.topGradient}
            />

            {/* Alt Gradient Overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
                locations={[0, 0.5, 1]}
                style={styles.bottomGradient}
            />

            {/* Skip Butonu */}
            {currentIndex < onboardingData.length - 1 && (
                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkip}
                    activeOpacity={0.7}
                >
                    <Text style={styles.skipText}>Atla</Text>
                </TouchableOpacity>
            )}

            {/* Üst İçerik - Title & Description */}
            <View style={styles.topContent}>
                <Animated.View
                    key={`text-${currentItem.id}`}
                    entering={FadeIn.duration(600).delay(200)}
                    style={styles.textContainer}
                >
                    <Text style={styles.title}>{currentItem.title}</Text>
                    <Text style={styles.description}>{currentItem.description}</Text>
                </Animated.View>
            </View>

            {/* Alt İçerik - Dots & Button */}
            <View style={styles.bottomContent}>
                {/* Pagination Dots */}
                <View style={styles.paginationContainer}>
                    {onboardingData.map((_, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => setCurrentIndex(index)}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.dot,
                                    {
                                        width: currentIndex === index ? 28 : 10,
                                        backgroundColor: currentIndex === index
                                            ? COLORS.primary
                                            : 'rgba(255,255,255,0.5)',
                                    },
                                ]}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Buton */}
                <TouchableOpacity
                    onPress={handleNext}
                    style={styles.button}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primary + 'DD']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                    >
                        <Text style={styles.buttonText}>
                            {currentIndex === onboardingData.length - 1 ? 'Hemen Başla!' : 'Devam Et'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    backgroundImage: {
        width: width,
        height: height,
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.5,
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: height * 0.35,
    },
    skipButton: {
        position: 'absolute',
        top: 60,
        right: 24,
        zIndex: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    skipText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    topContent: {
        position: 'absolute',
        top: height * 0.18,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 26,
        paddingHorizontal: 12,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    bottomContent: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    dot: {
        height: 10,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    button: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    buttonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});