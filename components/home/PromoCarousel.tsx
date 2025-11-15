import { useState, useRef } from 'react';
import { View, Image, Dimensions, FlatList, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/lib/constants';

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width - 32;

const promos = [
    {
        id: '1',
        title: 'Taze Meyveler',
        subtitle: '%50\'ye Varan İndirim',
        description: '3 Saat İçinde Biter!',
        image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800',
        colors: ['#FFC107', '#FF9800'],
    },
    {
        id: '2',
        title: 'Organik Sebzeler',
        subtitle: 'Yeni Geldi!',
        description: 'Çiftlikten sofraya',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
        colors: ['#00AA55', '#53D62B'],
    },
    {
        id: '3',
        title: 'Günlük İndirimler',
        subtitle: 'Her gün yeni fırsatlar',
        description: 'Kaçırmayın!',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
        colors: ['#1990FF', '#00BCD4'],
    },
];

export default function PromoCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const onScroll = (event: any) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / CAROUSEL_WIDTH);
        setCurrentIndex(index);
    };

    const renderItem = ({ item }: { item: typeof promos[0] }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            className="mx-4 rounded-3xl overflow-hidden"
            style={{ width: CAROUSEL_WIDTH }}
        >
            <LinearGradient colors={item.colors} className="flex-1">
                <View className="flex-row p-6" style={{ height: 180 }}>
                    <View className="flex-1 justify-center">
                        <Text className="text-white text-2xl font-bold mb-2">{item.title}</Text>
                        <Text className="text-white text-lg mb-1">{item.subtitle}</Text>
                        <Text className="text-white text-sm opacity-90">{item.description}</Text>
                        <TouchableOpacity
                            className="mt-4 self-start px-6 py-2 bg-white rounded-full"
                        >
                            <Text style={{ color: item.colors[0] }} className="font-semibold">
                                Hemen Al
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Image
                        source={{ uri: item.image }}
                        className="w-32 h-32 rounded-2xl"
                        resizeMode="cover"
                    />
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View className="mt-4">
            <FlatList
                ref={flatListRef}
                data={promos}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={CAROUSEL_WIDTH + 32}
                decelerationRate="fast"
                onScroll={onScroll}
                scrollEventThrottle={16}
            />

            <View className="flex-row justify-center mt-3">
                {promos.map((_, index) => (
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
        </View>
    );
}