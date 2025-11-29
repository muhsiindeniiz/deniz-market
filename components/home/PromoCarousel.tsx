import { useState, useRef, useEffect } from 'react';
import { View, Image, Dimensions, FlatList, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { COLORS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { Promo } from '@/lib/types';

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width - 32;

export default function PromoCarousel() {
    const router = useRouter();
    const [promos, setPromos] = useState<Promo[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadPromos();
    }, []);

    const loadPromos = async () => {
        try {
            const { data, error } = await supabase
                .from('promos')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            if (data) setPromos(data);
        } catch (error) {
            console.error('Error loading promos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePromoPress = (promo: Promo) => {
        if (!promo.link_type || !promo.link_id) return;

        switch (promo.link_type) {
            case 'category':
                router.push(`/category/${promo.link_id}`);
                break;
            case 'product':
                router.push(`/product/${promo.link_id}`);
                break;
            case 'store':
                router.push(`/store/${promo.link_id}`);
                break;
            default:
                break;
        }
    };

    const onScroll = (event: any) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / CAROUSEL_WIDTH);
        setCurrentIndex(index);
    };

    const renderItem = ({ item }: { item: Promo }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            className="mx-4 rounded-3xl overflow-hidden"
            style={{ width: CAROUSEL_WIDTH }}
            onPress={() => handlePromoPress(item)}
        >
            <LinearGradient
                colors={[item.gradient_start, item.gradient_end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View className="flex-row p-6" style={{ height: 180 }}>
                    <View className="flex-1 justify-center">
                        <Text className="text-white text-2xl font-bold mb-2">
                            {item.title}
                        </Text>
                        <Text className="text-white text-lg mb-1">
                            {item.subtitle}
                        </Text>
                        {item.description && (
                            <Text className="text-white text-sm opacity-90">
                                {item.description}
                            </Text>
                        )}
                        <TouchableOpacity
                            className="mt-4 self-start px-6 py-2 bg-white rounded-full"
                            onPress={() => handlePromoPress(item)}
                        >
                            <Text
                                style={{ color: item.gradient_start }}
                                className="font-semibold"
                            >
                                Hemen Al
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Image
                        source={{ uri: item.image_url }}
                        className="w-32 h-32 rounded-2xl"
                        resizeMode="cover"
                    />
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View className="mt-4 items-center justify-center" style={{ height: 180 }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (promos.length === 0) {
        return null;
    }

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

            {promos.length > 1 && (
                <View className="flex-row justify-center mt-3">
                    {promos.map((_, index) => (
                        <View
                            key={index}
                            className="h-2 rounded-full mx-1"
                            style={{
                                width: currentIndex === index ? 24 : 8,
                                backgroundColor:
                                    currentIndex === index
                                        ? COLORS.primary
                                        : COLORS.gray + '40',
                            }}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}