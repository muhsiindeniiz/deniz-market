import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Dimensions, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { Product, Category } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import ProductCard from '@/components/home/ProductCard';
import CategoryCard from '@/components/home/CategoryCard';
import PromoCarousel from '@/components/home/PromoCarousel';

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const itemCount = useCartStore((state) => state.getItemCount());
    const [selectedAddress, setSelectedAddress] = useState('Adres Seçin');
    const [categories, setCategories] = useState<Category[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
        loadDefaultAddress();
    }, []);

    const loadData = async () => {
        try {
            // Kategorileri yükle
            const { data: categoriesData } = await supabase
                .from('categories')
                .select('*')
                .limit(6);

            if (categoriesData) setCategories(categoriesData);

            // Öne çıkan ürünleri yükle
            const { data: featuredData } = await supabase
                .from('products')
                .select('*, category:categories(*)')
                .eq('is_featured', true)
                .limit(10);

            if (featuredData) setFeaturedProducts(featuredData);

            // Çok satan ürünleri yükle
            const { data: bestSellingData } = await supabase
                .from('products')
                .select('*, category:categories(*)')
                .order('created_at', { ascending: false })
                .limit(10);

            if (bestSellingData) setBestSellingProducts(bestSellingData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const loadDefaultAddress = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('addresses')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_default', true)
                .single();

            if (data) {
                setSelectedAddress(`${data.district}, ${data.city}`);
            }
        } catch (error) {
            console.error('Error loading address:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
                <TouchableOpacity
                    onPress={() => router.push('/addresses')}
                    className="flex-1 flex-row items-center"
                >
                    <Ionicons name="location" size={20} color={COLORS.primary} />
                    <View className="flex-1 ml-2">
                        <Text className="text-xs" style={{ color: COLORS.gray }}>
                            Teslimat Adresi
                        </Text>
                        <Text className="text-sm font-semibold" style={{ color: COLORS.dark }} numberOfLines={1}>
                            {selectedAddress}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={COLORS.dark} />
                </TouchableOpacity>

                <View className="flex-row ml-4">
                    <TouchableOpacity
                        onPress={() => router.push('/notifications')}
                        className="w-10 h-10 rounded-full items-center justify-center mr-2"
                        style={{ backgroundColor: COLORS.background }}
                    >
                        <Ionicons name="notifications-outline" size={24} color={COLORS.dark} />
                        <View className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.danger }} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/cart')}
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: COLORS.background }}
                    >
                        <Ionicons name="cart-outline" size={24} color={COLORS.dark} />
                        {itemCount > 0 && (
                            <View
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
                                style={{ backgroundColor: COLORS.danger }}
                            >
                                <Text className="text-white text-xs font-bold">
                                    {itemCount > 9 ? '9+' : itemCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
            >
                {/* Search Bar */}
                <View className="px-4 pt-4 pb-2">
                    <TouchableOpacity
                        onPress={() => router.push('/search')}
                        className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-200"
                    >
                        <Ionicons name="search" size={20} color={COLORS.gray} />
                        <Text className="flex-1 ml-3 text-base" style={{ color: COLORS.gray }}>
                            Ürün ara...
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Promo Carousel */}
                <PromoCarousel />

                {/* Categories */}
                <View className="px-4 mt-4">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                            Kategoriler
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/categories')}>
                            <Text style={{ color: COLORS.primary }} className="font-semibold">
                                Hepsini Gör
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
                        {categories.map((category) => (
                            <CategoryCard key={category.id} category={category} />
                        ))}
                    </ScrollView>
                </View>

                {/* Best Selling Products */}
                <View className="px-4 mt-6">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                            Çok Satanlar
                        </Text>
                        <TouchableOpacity>
                            <Text style={{ color: COLORS.primary }} className="font-semibold">
                                Hepsini Gör
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
                        {bestSellingProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </ScrollView>
                </View>

                {/* Featured Products */}
                {featuredProducts.length > 0 && (
                    <View className="px-4 mt-6 mb-6">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                                Öne Çıkanlar
                            </Text>
                        </View>

                        <View className="flex-row flex-wrap -mx-2">
                            {featuredProducts.slice(0, 4).map((product) => (
                                <View key={product.id} className="w-1/2 px-2 mb-4">
                                    <ProductCard product={product} />
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}