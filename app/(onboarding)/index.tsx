import { useState, useRef } from 'react';
import { View, Text, Image, FlatList, Dimensions, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/lib/constants';

const { width, height } = Dimensions.get('window');

const onboardingData = [
    {
        id: '1',
        title: 'Deniz Market\'e Hoş Geldiniz',
        description: 'Çiftlikten sofraya taze meyve, sebze ve market ürünleri hızlı ve taze teslimat ile.',
        image: require('@/assets/images/onboarding1.jpg'),
        backgroundColor: ['#E3F2FD', '#F3E5F5'],
    },
    {
        id: '2',
        title: 'Doğrudan Yerel Çiftçilerden',
        description: 'En iyi ürünleri almanızı sağlamak için yerel çiftçilerle yakın çalışıyoruz.',
        image: require('@/assets/images/onboarding2.jpg'),
        backgroundColor: ['#F3E5F5', '#FFF3E0'],
    },
    {
        id: '3',
        title: 'Aynı Gün Teslimat',
        description: 'Günlük indirimlerin, flash satışların ve her alışverişte daha fazla tasarruf etmenizi sağlayan özel tekliflerin kilidini açın.',
        image: require('@/assets/images/onboarding1.jpg'),
        backgroundColor: ['#FFF3E0', '#E8F5E9'],
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / width);
        setCurrentIndex(index);
    };

    const handleNext = () => {
        if (currentIndex < onboardingData.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            handleGetStarted();
        }
    };

    const handleGetStarted = async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        router.replace('/(tabs)');
    };

    const renderItem = ({ item }: { item: typeof onboardingData[0] }) => (
        <LinearGradient
            colors={item.backgroundColor}
            className="items-center justify-center"
            style={{ width, height }}
        >
            <View className="flex-1 items-center justify-center px-8">
                <Image
                    source={item.image}
                    className="w-full h-96"
                    resizeMode="contain"
                />
                <Text className="text-3xl font-bold text-center mt-8 mb-4" style={{ color: COLORS.dark }}>
                    {item.title}
                </Text>
                <Text className="text-base text-center" style={{ color: COLORS.gray }}>
                    {item.description}
                </Text>
            </View>
        </LinearGradient>
    );

    return (
        <View className="flex-1">
            <FlatList
                ref={flatListRef}
                data={onboardingData}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            />

            <View className="absolute bottom-20 left-0 right-0 items-center">
                <View className="flex-row mb-8">
                    {onboardingData.map((_, index) => (
                        <View
                            key={index}
                            className="h-2 rounded-full mx-1"
                            style={{
                                width: currentIndex === index ? 24 : 8,
                                backgroundColor: currentIndex === index ? COLORS.primary : COLORS.gray + '40',
                            }}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    onPress={handleNext}
                    className="rounded-2xl px-16 py-4 mx-8"
                    style={{ backgroundColor: COLORS.primary }}
                >
                    <Text className="text-white text-lg font-semibold">
                        {currentIndex === onboardingData.length - 1 ? 'Hemen Başla!' : 'İleri'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}