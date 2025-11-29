// app/(tabs)/index.tsx
import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useAddressStore } from '@/store/addressStore';
import { Product, Category } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import ProductCard from '@/components/home/ProductCard';
import CategoryCard from '@/components/home/CategoryCard';
import PromoCarousel from '@/components/home/PromoCarousel';

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const itemCount = useCartStore((state) => state.getItemCount());
    const { selectedAddress, loadAddresses, subscribeToAddresses, unsubscribeFromAddresses } = useAddressStore();

    const [categories, setCategories] = useState<Category[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showUrgencyBanner, setShowUrgencyBanner] = useState(true);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    useEffect(() => {
        loadData();
        if (user?.id) {
            loadAddresses(user.id);
            subscribeToAddresses(user.id);
            loadUnreadNotifications();
        }

        return () => {
            unsubscribeFromAddresses();
        };
    }, [user]);

    const displayAddress = selectedAddress
        ? `${selectedAddress.district}, ${selectedAddress.city}`
        : 'Adres Seçin';

    const loadUnreadNotifications = async () => {
        if (!user?.id) return;

        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (!error && count !== null) {
                setUnreadNotifications(count);
            }
        } catch (error) {
            console.error('Error loading notifications count:', error);
        }
    };

    const loadData = useCallback(async () => {
        try {
            // Kategorileri yükle
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categories')
                .select('*')
                .order('item_count', { ascending: false })
                .limit(8);

            if (categoriesError) throw categoriesError;
            if (categoriesData) setCategories(categoriesData);

            // Öne çıkan ürünleri yükle
            const { data: featuredData, error: featuredError } = await supabase
                .from('products')
                .select('*, category:categories(*), store:stores(*)')
                .eq('is_featured', true)
                .gt('stock', 0)
                .limit(10);

            if (featuredError) throw featuredError;
            if (featuredData) setFeaturedProducts(featuredData);

            // Çok satanları yükle (review_count'a göre sırala)
            const { data: bestSellingData, error: bestSellingError } = await supabase
                .from('products')
                .select('*, category:categories(*), store:stores(*)')
                .gt('stock', 0)
                .order('review_count', { ascending: false })
                .limit(10);

            if (bestSellingError) throw bestSellingError;
            if (bestSellingData) setBestSellingProducts(bestSellingData);

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        if (user?.id) {
            await loadAddresses(user.id);
            await loadUnreadNotifications();
        }
        setRefreshing(false);
    }, [user, loadData, loadAddresses]);

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text className="mt-4" style={{ color: COLORS.gray }}>
                        Yükleniyor...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-3 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.push('/addresses')}
                        className="flex-row items-center flex-1"
                        activeOpacity={0.7}
                    >
                        <View
                            className="w-10 h-10 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: COLORS.primary + '15' }}
                        >
                            <Ionicons name="location" size={22} color={COLORS.primary} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs font-medium" style={{ color: COLORS.gray }}>
                                Teslimat Adresi
                            </Text>
                            <Text
                                className="text-base font-bold mt-0.5"
                                style={{ color: COLORS.dark }}
                                numberOfLines={1}
                            >
                                {displayAddress}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color={COLORS.dark} />
                    </TouchableOpacity>

                    {/* Quick Actions */}
                    <View className="flex-row items-center ml-3">
                        <TouchableOpacity
                            onPress={() => router.push('/notifications')}
                            className="w-10 h-10 rounded-full items-center justify-center mr-2"
                            style={{ backgroundColor: COLORS.background }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="notifications-outline" size={24} color={COLORS.dark} />
                            {unreadNotifications > 0 && (
                                <View
                                    className="absolute -top-0.5 -right-0.5 min-w-5 h-5 rounded-full items-center justify-center px-1"
                                    style={{ backgroundColor: COLORS.danger }}
                                >
                                    <Text className="text-white text-xs font-bold">
                                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/favorites')}
                            className="w-10 h-10 rounded-full items-center justify-center"
                            style={{ backgroundColor: COLORS.background }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="heart-outline" size={24} color={COLORS.dark} />
                        </TouchableOpacity>
                    </View>
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
                {/* Search Bar */}
                <View className="px-4 pt-4 pb-3">
                    <TouchableOpacity
                        onPress={() => router.push('/search')}
                        className="bg-white rounded-2xl px-5 py-4 flex-row items-center"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.08,
                            shadowRadius: 8,
                            elevation: 3,
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="search" size={22} color={COLORS.primary} />
                        <Text className="flex-1 ml-3 text-base" style={{ color: COLORS.gray }}>
                            Ürün ara... (Ekmek, süt, yumurta...)
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Urgency Banner */}
                {showUrgencyBanner && (
                    <View className="mx-4 mb-3">
                        <View
                            className="rounded-2xl p-4 flex-row items-center"
                            style={{
                                backgroundColor: '#FFF3E0',
                                borderWidth: 1,
                                borderColor: '#FFB74D',
                            }}
                        >
                            <View className="flex-1 flex-row items-center">
                                <Ionicons name="time" size={24} color="#F57C00" />
                                <View className="flex-1 ml-3">
                                    <Text className="font-bold text-base" style={{ color: '#E65100' }}>
                                        ⚡ Son 1 Saat!
                                    </Text>
                                    <Text className="text-sm mt-0.5" style={{ color: '#F57C00' }}>
                                        Bugünün fırsatları kaçmadan sipariş verin
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowUrgencyBanner(false)}
                                className="ml-2 p-1"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close-circle" size={24} color="#F57C00" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Promo Carousel - Data from Supabase */}
                <PromoCarousel />

                {/* Categories */}
                <View className="px-4 mt-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                            Kategoriler
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/categories')}
                            activeOpacity={0.7}
                            className="flex-row items-center"
                        >
                            <Text style={{ color: COLORS.primary }} className="font-semibold text-sm mr-1">
                                Hepsini Gör
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    {categories.length > 0 ? (
                        <View className="flex-row flex-wrap justify-between">
                            {categories.slice(0, 8).map((category) => (
                                <View key={category.id} className="w-1/4 mb-4">
                                    <CategoryCard category={category} />
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View className="py-8 items-center">
                            <Text style={{ color: COLORS.gray }}>Kategori bulunamadı</Text>
                        </View>
                    )}
                </View>

                {/* Best Sellers */}
                {bestSellingProducts.length > 0 && (
                    <View className="mt-6">
                        <View className="px-4 flex-row items-center justify-between mb-4">
                            <View>
                                <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                                    🔥 Çok Satanlar
                                </Text>
                                <Text className="text-xs mt-1" style={{ color: COLORS.gray }}>
                                    En çok tercih edilen ürünler
                                </Text>
                            </View>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => router.push('/best-sellers')}
                            >
                                <Text style={{ color: COLORS.primary }} className="font-semibold text-sm">
                                    Tümü
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="pl-4"
                            contentContainerStyle={{ paddingRight: 16 }}
                        >
                            {bestSellingProducts.map((product) => (
                                <View key={product.id} className="mr-3">
                                    <ProductCard product={product} />
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Featured Products */}
                {featuredProducts.length > 0 && (
                    <View className="px-4 mt-6 mb-6">
                        <View className="flex-row items-center justify-between mb-4">
                            <View>
                                <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                                    ⭐ Öne Çıkanlar
                                </Text>
                                <Text className="text-xs mt-1" style={{ color: COLORS.gray }}>
                                    Size özel seçtiklerimiz
                                </Text>
                            </View>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => router.push('/featured')}
                            >
                                <Text style={{ color: COLORS.primary }} className="font-semibold text-sm">
                                    Tümü
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row flex-wrap justify-between">
                            {featuredProducts.slice(0, 6).map((product) => (
                                <View key={product.id} className="mb-4" style={{ width: '48%' }}>
                                    <ProductCard product={product} width={undefined} />
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Bottom Spacing for Tab Bar */}
                <View className="h-24" />
            </ScrollView>
        </SafeAreaView>
    );
}