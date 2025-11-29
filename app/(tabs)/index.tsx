// app/(tabs)/index.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Animated } from 'react-native';
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
    const [showUrgencyBanner, setShowUrgencyBanner] = useState(true);

    useEffect(() => {
        loadData();
        if (user?.id) {
            loadAddresses(user.id);
            subscribeToAddresses(user.id);
        }

        return () => {
            unsubscribeFromAddresses();
        };
    }, [user]);

    const displayAddress = selectedAddress
        ? `${selectedAddress.district}, ${selectedAddress.city}`
        : 'Adres Seçin';

    const loadData = async () => {
        try {
            const { data: categoriesData } = await supabase
                .from('categories')
                .select('*')
                .limit(8);

            if (categoriesData) setCategories(categoriesData);

            const { data: featuredData } = await supabase
                .from('products')
                .select('*, category:categories(*), store:stores(*)')
                .eq('is_featured', true)
                .limit(10);

            if (featuredData) setFeaturedProducts(featuredData);

            const { data: bestSellingData } = await supabase
                .from('products')
                .select('*, category:categories(*), store:stores(*)')
                .order('created_at', { ascending: false })
                .limit(10);

            if (bestSellingData) setBestSellingProducts(bestSellingData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        if (user?.id) {
            await loadAddresses(user.id);
        }
        setRefreshing(false);
    };

    return (
        <SafeAreaView style={{ backgroundColor: COLORS.background }}>
            <View className="bg-white px-4 py-3 border-b border-gray-200">
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
                            <View
                                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                                style={{ backgroundColor: COLORS.danger }}
                            />
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
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
            >
                {/* 2. SEARCH BAR - Full Width, Prominent */}
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

                {/* 3. URGENCY BANNER - Son 1 Saat */}
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
                                className="ml-2"
                            >
                                <Ionicons name="close-circle" size={24} color="#F57C00" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* 4. HERO CAROUSEL - Max 2-3 Slides */}
                <PromoCarousel />

                {/* 5. KATEGORİLER - Üstte, 4'lü Grid */}
                <View className="px-4 mt-4">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                            Kategoriler
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/categories')}
                            activeOpacity={0.7}
                        >
                            <View className="flex-row items-center">
                                <Text style={{ color: COLORS.primary }} className="font-semibold text-sm mr-1">
                                    Hepsini Gör
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row flex-wrap -mx-2">
                        {categories.slice(0, 8).map((category) => (
                            <View key={category.id} className="w-1/4 px-2 mb-3">
                                <CategoryCard category={category} />
                            </View>
                        ))}
                    </View>
                </View>

                {/* 6. ÇOK SATANLAR - Sosyal Kanıt */}
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
                        <TouchableOpacity activeOpacity={0.7}>
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

                {/* 7. ÖZEL SEÇİMLER / KAMPANYALAR */}
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
                        </View>

                        <View className="flex-row flex-wrap -mx-2">
                            {featuredProducts.slice(0, 6).map((product) => (
                                <View key={product.id} className="w-1/2 px-2 mb-4">
                                    <ProductCard product={product} />
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Bottom Spacing */}
                <View className="h-6" />
            </ScrollView>
        </SafeAreaView>
    );
}