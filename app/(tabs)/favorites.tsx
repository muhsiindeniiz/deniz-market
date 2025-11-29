// app/(tabs)/favorites.tsx
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Animated } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Product } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import ProductCard from '@/components/home/ProductCard';
import { useEffect, useRef } from 'react';

// Skeleton Component
const SkeletonBox = ({ width, height, style, borderRadius = 8 }: {
    width: number | string;
    height: number;
    style?: any;
    borderRadius?: number;
}) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    backgroundColor: '#E0E0E0',
                    borderRadius,
                    opacity,
                },
                style,
            ]}
        />
    );
};

// Product Card Skeleton
const ProductCardSkeleton = () => {
    return (
        <View className="bg-white rounded-2xl overflow-hidden" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        }}>
            {/* Image Skeleton */}
            <SkeletonBox width="100%" height={140} borderRadius={0} />

            {/* Content */}
            <View className="p-3">
                {/* Title */}
                <SkeletonBox width="90%" height={16} style={{ marginBottom: 8 }} />
                <SkeletonBox width="60%" height={14} style={{ marginBottom: 12 }} />

                {/* Price Row */}
                <View className="flex-row items-center justify-between">
                    <SkeletonBox width={70} height={20} />
                    <SkeletonBox width={36} height={36} borderRadius={18} />
                </View>
            </View>
        </View>
    );
};

// Favorites Skeleton Grid
const FavoritesSkeleton = () => {
    return (
        <View className="px-4 pt-4 pb-6">
            {/* Info Banner Skeleton */}
            <View className="mb-4">
                <SkeletonBox width="100%" height={56} borderRadius={16} />
            </View>

            {/* Products Grid Skeleton */}
            <View className="flex-row flex-wrap -mx-2">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                    <View key={item} className="w-1/2 px-2 mb-4">
                        <ProductCardSkeleton />
                    </View>
                ))}
            </View>
        </View>
    );
};

export default function FavoritesScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            if (isAuthenticated && user?.id) {
                loadFavorites();
            } else {
                setLoading(false);
                setFavorites([]);
            }
        }, [user?.id, isAuthenticated])
    );

    const loadFavorites = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    id,
                    product_id,
                    created_at,
                    product:products (
                        *,
                        category:categories (*),
                        store:stores (*)
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading favorites:', error);
                throw error;
            }

            if (data) {
                const products: Product[] = [];

                for (const item of data) {
                    const productData = Array.isArray(item.product) ? item.product[0] : item.product;

                    if (!productData) continue;

                    const categoryData = Array.isArray(productData.category)
                        ? productData.category[0]
                        : productData.category;

                    const storeData = Array.isArray(productData.store)
                        ? productData.store[0]
                        : productData.store;

                    const formattedProduct: Product = {
                        id: productData.id,
                        name: productData.name,
                        description: productData.description,
                        price: productData.price,
                        discount_price: productData.discount_price,
                        category_id: productData.category_id,
                        store_id: productData.store_id,
                        images: productData.images || [],
                        stock: productData.stock,
                        unit: productData.unit,
                        weight: productData.weight,
                        rating: productData.rating,
                        review_count: productData.review_count,
                        is_featured: productData.is_featured,
                        is_on_sale: productData.is_on_sale,
                        created_at: productData.created_at,
                        updated_at: productData.updated_at,
                        category: categoryData ? {
                            id: categoryData.id,
                            name: categoryData.name,
                            icon: categoryData.icon,
                            color: categoryData.color,
                            item_count: categoryData.item_count,
                            image_url: categoryData.image_url,
                            created_at: categoryData.created_at,
                            updated_at: categoryData.updated_at,
                        } : undefined,
                        store: storeData ? {
                            id: storeData.id,
                            name: storeData.name,
                            description: storeData.description,
                            logo: storeData.logo,
                            banner_image: storeData.banner_image,
                            address: storeData.address,
                            phone: storeData.phone,
                            email: storeData.email,
                            rating: storeData.rating,
                            review_count: storeData.review_count,
                            is_active: storeData.is_active,
                            created_at: storeData.created_at,
                            updated_at: storeData.updated_at,
                        } : undefined,
                    };

                    products.push(formattedProduct);
                }

                setFavorites(products);
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadFavorites();
        setRefreshing(false);
    };

    // Not authenticated state
    if (!isAuthenticated) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
                <View className="bg-white px-4 py-4 border-b border-gray-200">
                    <Text className="text-2xl font-bold" style={{ color: COLORS.dark }}>
                        Favorilerim
                    </Text>
                </View>

                <View className="flex-1 items-center justify-center px-8">
                    <View
                        className="w-32 h-32 rounded-full items-center justify-center mb-6"
                        style={{ backgroundColor: COLORS.primary + '20' }}
                    >
                        <Ionicons name="heart-outline" size={64} color={COLORS.primary} />
                    </View>
                    <Text className="text-2xl font-bold mb-2 text-center" style={{ color: COLORS.dark }}>
                        Giriş Yapın
                    </Text>
                    <Text className="text-base text-center mb-6" style={{ color: COLORS.gray }}>
                        Favori ürünlerinizi görmek için giriş yapmanız gerekiyor.
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/login')}
                        className="rounded-xl px-8 py-4"
                        style={{ backgroundColor: COLORS.primary }}
                        activeOpacity={0.8}
                    >
                        <Text className="text-white text-base font-semibold">Giriş Yap</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Loading state with Skeleton
    if (loading) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
                <View className="bg-white px-4 py-4 border-b border-gray-200">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-2xl font-bold" style={{ color: COLORS.dark }}>
                                Favorilerim
                            </Text>
                            <SkeletonBox width={60} height={14} style={{ marginTop: 4 }} />
                        </View>
                        <SkeletonBox width={40} height={40} borderRadius={20} />
                    </View>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <FavoritesSkeleton />
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Empty state
    if (favorites.length === 0) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
                <View className="bg-white px-4 py-4 border-b border-gray-200">
                    <Text className="text-2xl font-bold" style={{ color: COLORS.dark }}>
                        Favorilerim
                    </Text>
                </View>

                <ScrollView
                    contentContainerStyle={{ flex: 1 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                            colors={[COLORS.primary]}
                        />
                    }
                >
                    <View className="flex-1 items-center justify-center px-8">
                        <View
                            className="w-32 h-32 rounded-full items-center justify-center mb-6"
                            style={{ backgroundColor: COLORS.primary + '20' }}
                        >
                            <Ionicons name="heart-outline" size={64} color={COLORS.primary} />
                        </View>
                        <Text className="text-2xl font-bold mb-2 text-center" style={{ color: COLORS.dark }}>
                            Henüz Favori Yok
                        </Text>
                        <Text className="text-base text-center mb-6" style={{ color: COLORS.gray }}>
                            Beğendiğiniz ürünleri favorilerinize ekleyerek hızlıca erişebilirsiniz.
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)')}
                            className="rounded-xl px-8 py-4"
                            style={{ backgroundColor: COLORS.primary }}
                            activeOpacity={0.8}
                        >
                            <Text className="text-white text-base font-semibold">Alışverişe Başla</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-2xl font-bold" style={{ color: COLORS.dark }}>
                            Favorilerim
                        </Text>
                        <Text className="text-sm mt-1" style={{ color: COLORS.gray }}>
                            {favorites.length} ürün
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push('/search')}
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: COLORS.background }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="search" size={24} color={COLORS.dark} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
            >
                {/* Info Banner */}
                <View className="mx-4 mt-4 bg-blue-50 rounded-2xl p-4 border border-blue-200">
                    <View className="flex-row items-center">
                        <Ionicons name="information-circle" size={24} color={COLORS.primary} />
                        <Text className="flex-1 ml-3 text-sm" style={{ color: COLORS.dark }}>
                            Favori ürünleriniz tekrar tekrar satın almanızı kolaylaştırır!
                        </Text>
                    </View>
                </View>

                {/* Products Grid */}
                <View className="px-4 pt-4 pb-6">
                    <View className="flex-row flex-wrap -mx-2">
                        {favorites.map((product) => (
                            <View key={product.id} className="w-1/2 px-2 mb-4">
                                <ProductCard product={product} />
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}