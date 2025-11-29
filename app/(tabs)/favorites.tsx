// app/(tabs)/favorites.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Product } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import ProductCard from '@/components/home/ProductCard';

export default function FavoritesScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            loadFavorites();
        } else {
            setLoading(false);
        }
    }, [user, isAuthenticated]);

    const loadFavorites = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    product_id,
                    products (
                        *,
                        category:categories(*),
                        store:stores(*)
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;

            if (data) {
                const products = data
                    .map(item => item.products)
                    .filter(Boolean) as Product[];
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

    // Empty state
    if (!loading && favorites.length === 0) {
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
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
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
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
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