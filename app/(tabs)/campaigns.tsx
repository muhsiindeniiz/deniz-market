// app/(tabs)/campaigns.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/constants';
import { Product, Promo } from '@/lib/types';
import ProductCard from '@/components/home/ProductCard';

type TabType = 'all' | 'discount' | 'bogo';

export default function CampaignsScreen() {
    const router = useRouter();
    const [promos, setPromos] = useState<Promo[]>([]);
    const [discountProducts, setDiscountProducts] = useState<Product[]>([]);
    const [bogoProducts, setBogoProducts] = useState<Product[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('all');

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([
            loadPromos(),
            loadDiscountProducts(),
            loadBogoProducts(),
        ]);
        setLoading(false);
    };

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
        }
    };

    const loadDiscountProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, category:categories(*), store:stores(*)')
                .eq('is_on_sale', true)
                .not('discount_price', 'is', null)
                .gt('stock', 0)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            if (data) setDiscountProducts(data);
        } catch (error) {
            console.error('Error loading discount products:', error);
        }
    };

    const loadBogoProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, category:categories(*), store:stores(*)')
                .not('discount_price', 'is', null)
                .gt('stock', 0)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            const bogoFiltered = data?.filter(product => {
                if (!product.discount_price) return false;
                const discountPercent = ((product.price - product.discount_price) / product.price) * 100;
                return discountPercent >= 50;
            }) || [];

            setBogoProducts(bogoFiltered);
        } catch (error) {
            console.error('Error loading bogo products:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAllData();
        setRefreshing(false);
    };

    const handlePromoPress = (promo: Promo) => {
        switch (promo.link_type) {
            case 'category':
                if (promo.link_id) {
                    router.push(`/category/${promo.link_id}`);
                }
                break;
            case 'product':
                if (promo.link_id) {
                    router.push(`/product/${promo.link_id}`);
                }
                break;
            case 'store':
                if (promo.link_id) {
                    router.push(`/store/${promo.link_id}`);
                }
                break;
            case 'external':
                break;
            default:
                break;
        }
    };

    const getDisplayedProducts = (): Product[] => {
        switch (activeTab) {
            case 'discount':
                return discountProducts;
            case 'bogo':
                return bogoProducts;
            case 'all':
            default:
                const allProducts = [...discountProducts];
                bogoProducts.forEach(bp => {
                    if (!allProducts.find(p => p.id === bp.id)) {
                        allProducts.push(bp);
                    }
                });
                return allProducts;
        }
    };

    const getActivePromoCount = (): number => {
        return promos.length;
    };

    const getActiveProductCount = (): number => {
        return getDisplayedProducts().length;
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text className="mt-4 text-base" style={{ color: COLORS.gray }}>
                        Kampanyalar yükleniyor...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const displayedProducts = getDisplayedProducts();

    return (
        <SafeAreaView style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 border-b border-gray-200">
                <Text className="text-2xl font-bold" style={{ color: COLORS.dark }}>
                    Kampanyalar
                </Text>
                <Text className="text-sm mt-1" style={{ color: COLORS.gray }}>
                    {getActivePromoCount()} aktif kampanya, {getActiveProductCount()} indirimli ürün
                </Text>
            </View>

            <View className="bg-white px-4 py-3 border-b border-gray-200">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('all')}
                        className="px-6 py-2 rounded-full mr-3"
                        style={{
                            backgroundColor: activeTab === 'all' ? COLORS.primary : COLORS.background
                        }}
                        activeOpacity={0.7}
                    >
                        <Text
                            className="font-semibold"
                            style={{ color: activeTab === 'all' ? '#FFF' : COLORS.dark }}
                        >
                            Tümü
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('discount')}
                        className="px-6 py-2 rounded-full mr-3"
                        style={{
                            backgroundColor: activeTab === 'discount' ? COLORS.primary : COLORS.background
                        }}
                        activeOpacity={0.7}
                    >
                        <Text
                            className="font-semibold"
                            style={{ color: activeTab === 'discount' ? '#FFF' : COLORS.dark }}
                        >
                            İndirimler ({discountProducts.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('bogo')}
                        className="px-6 py-2 rounded-full"
                        style={{
                            backgroundColor: activeTab === 'bogo' ? COLORS.primary : COLORS.background
                        }}
                        activeOpacity={0.7}
                    >
                        <Text
                            className="font-semibold"
                            style={{ color: activeTab === 'bogo' ? '#FFF' : COLORS.dark }}
                        >
                            1 Alana 1 Bedava ({bogoProducts.length})
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
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
                {/* Promo Banners */}
                {promos.length > 0 && (
                    <View className="px-4 pt-4">
                        <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                            Öne Çıkan Kampanyalar
                        </Text>
                        {promos.map((promo) => (
                            <TouchableOpacity
                                key={promo.id}
                                className="rounded-3xl mb-4 overflow-hidden"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 8,
                                    elevation: 3,
                                }}
                                activeOpacity={0.9}
                                onPress={() => handlePromoPress(promo)}
                            >
                                {/* Gradient Background */}
                                <View
                                    style={{
                                        backgroundColor: promo.gradient_start,
                                        position: 'relative'
                                    }}
                                >
                                    <Image
                                        source={{ uri: promo.image_url }}
                                        className="w-full h-48"
                                        resizeMode="cover"
                                    />
                                    {/* Gradient Overlay */}
                                    <View
                                        style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            height: 100,
                                            backgroundColor: 'rgba(0,0,0,0.4)',
                                        }}
                                    />
                                    {/* Text Overlay */}
                                    <View
                                        style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            padding: 16,
                                        }}
                                    >
                                        <Text className="text-xl font-bold text-white">
                                            {promo.title}
                                        </Text>
                                        <Text className="text-sm text-white opacity-90 mt-1">
                                            {promo.subtitle}
                                        </Text>
                                    </View>
                                </View>

                                {promo.description && (
                                    <View className="bg-white p-4">
                                        <Text className="text-sm" style={{ color: COLORS.gray }}>
                                            {promo.description}
                                        </Text>
                                        <TouchableOpacity
                                            className="mt-3 px-5 py-2 rounded-full self-start"
                                            style={{ backgroundColor: COLORS.primary }}
                                            activeOpacity={0.8}
                                            onPress={() => handlePromoPress(promo)}
                                        >
                                            <Text className="text-white font-semibold text-sm">
                                                Kampanyaya Git
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Campaign Products */}
                {displayedProducts.length > 0 ? (
                    <View className="px-4 mt-2 mb-6">
                        <Text className="text-lg font-bold mb-4" style={{ color: COLORS.dark }}>
                            {activeTab === 'all' && 'Tüm İndirimli Ürünler'}
                            {activeTab === 'discount' && 'İndirimli Ürünler'}
                            {activeTab === 'bogo' && '1 Alana 1 Bedava Ürünler'}
                        </Text>

                        <View className="flex-row flex-wrap -mx-2">
                            {displayedProducts.map((product) => (
                                <View key={product.id} className="w-1/2 px-2 mb-4">
                                    <ProductCard product={product} />
                                </View>
                            ))}
                        </View>
                    </View>
                ) : (
                    <View className="px-4 py-12 items-center">
                        <Ionicons name="pricetag-outline" size={64} color={COLORS.gray} />
                        <Text className="text-lg font-semibold mt-4" style={{ color: COLORS.dark }}>
                            Kampanya Bulunamadı
                        </Text>
                        <Text className="text-sm mt-2 text-center" style={{ color: COLORS.gray }}>
                            Bu kategoride şu an aktif kampanya bulunmuyor.
                        </Text>
                    </View>
                )}

                <View className="h-6" />
            </ScrollView>
        </SafeAreaView>
    );
}