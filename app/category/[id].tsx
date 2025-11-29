import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import ProductCard from '@/components/home/ProductCard';
import BottomSheet from '@gorhom/bottom-sheet';
import { ProductCardSkeleton } from '@/components/ui/Loading';

export default function CategoryDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [category, setCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'rating'>('name');
    const bottomSheetRef = useRef<BottomSheet>(null);

    useEffect(() => {
        loadData();
    }, [id, sortBy]);

    const loadData = async () => {
        try {
            // Load category
            const { data: categoryData } = await supabase
                .from('categories')
                .select('*')
                .eq('id', id)
                .single();

            if (categoryData) setCategory(categoryData);

            // Load products
            let query = supabase
                .from('products')
                .select('*, category:categories(*)')
                .eq('category_id', id);

            // Apply sorting
            switch (sortBy) {
                case 'price_asc':
                    query = query.order('price', { ascending: true });
                    break;
                case 'price_desc':
                    query = query.order('price', { ascending: false });
                    break;
                case 'rating':
                    query = query.order('rating', { ascending: false });
                    break;
                default:
                    query = query.order('name');
            }

            const { data: productsData } = await query;

            if (productsData) setProducts(productsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openSortSheet = () => {
        bottomSheetRef.current?.expand();
    };

    const renderProduct = ({ item }: { item: Product }) => {
        if (viewMode === 'list') {
            return (
                <TouchableOpacity
                    onPress={() => router.push(`/product/${item.id}`)}
                    className="bg-white rounded-2xl p-4 mx-4 mb-4 flex-row"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 3,
                    }}
                >
                    <View className="flex-1">
                        <Text className="text-lg font-semibold mb-2" style={{ color: COLORS.dark }}>
                            {item.name}
                        </Text>
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="star" size={16} color={COLORS.warning} />
                            <Text className="text-sm ml-1" style={{ color: COLORS.gray }}>
                                {item.rating.toFixed(1)} ({item.review_count})
                            </Text>
                        </View>
                        <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>
                            ₺{(item.discount_price || item.price).toFixed(2)}
                        </Text>
                    </View>
                </TouchableOpacity>
            );
        }

        return (
            <View className="w-1/2 px-2 mb-4">
                <ProductCard product={item} />
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1"style={{ backgroundColor: COLORS.background }}>
                <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-200">
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity onPress={() => router.back()} className="mr-3">
                            <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                        </TouchableOpacity>
                        <View className="flex-1">
                            <View style={{ width: '60%', height: 20, backgroundColor: COLORS.gray + '30', borderRadius: 4 }} />
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/cart')} className="ml-3">
                        <Ionicons name="cart-outline" size={24} color={COLORS.dark} />
                    </TouchableOpacity>
                </View>

                <View className="bg-white px-4 py-3 border-b border-gray-200">
                    <View className="flex-row items-center">
                        <View className="flex-1 h-12 bg-gray-100 rounded-xl mr-3" />
                        <View className="w-12 h-12 rounded-xl bg-gray-100 mr-2" />
                        <View className="w-12 h-12 rounded-xl bg-gray-100" />
                    </View>
                </View>

                <ScrollView horizontal className="px-4 mt-4" showsHorizontalScrollIndicator={false}>
                    {[1, 2].map((item) => (
                        <ProductCardSkeleton key={item} />
                    ))}
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1"style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-200">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold flex-1" style={{ color: COLORS.dark }} numberOfLines={1}>
                        {category?.name}
                    </Text>
                </View>

                <TouchableOpacity onPress={() => router.push('/cart')} className="ml-3">
                    <Ionicons name="cart-outline" size={24} color={COLORS.dark} />
                </TouchableOpacity>
            </View>

            {/* Search and Filters */}
            <View className="bg-white px-4 py-3 border-b border-gray-200">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.push('/search')}
                        className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mr-3"
                    >
                        <Ionicons name="search" size={20} color={COLORS.gray} />
                        <Text className="ml-2" style={{ color: COLORS.gray }}>
                            Ürün ara...
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        className="w-12 h-12 rounded-xl items-center justify-center mr-2"
                        style={{ backgroundColor: COLORS.background }}
                    >
                        <Ionicons name={viewMode === 'grid' ? 'list' : 'grid'} size={24} color={COLORS.dark} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={openSortSheet}
                        className="w-12 h-12 rounded-xl items-center justify-center"
                        style={{ backgroundColor: COLORS.background }}
                    >
                        <Ionicons name="filter" size={24} color={COLORS.dark} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Products Count */}
            <View className="px-4 py-3">
                <Text className="text-base" style={{ color: COLORS.gray }}>
                    {products.length} ürün gösteriliyor
                </Text>
            </View>

            {/* Products List */}
            <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                numColumns={viewMode === 'grid' ? 2 : 1}
                key={viewMode}
                contentContainerStyle={{ paddingHorizontal: viewMode === 'grid' ? 8 : 0 }}
                showsVerticalScrollIndicator={false}
            />

            {/* Sort Bottom Sheet */}
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={['50%']}
                enablePanDownToClose
            >
                <View className="flex-1 px-6 py-4">
                    <Text className="text-xl font-bold mb-4" style={{ color: COLORS.dark }}>
                        Sıralama
                    </Text>

                    {[
                        { value: 'name', label: 'İsme göre (A-Z)' },
                        { value: 'price_asc', label: 'Fiyat (Düşükten Yükseğe)' },
                        { value: 'price_desc', label: 'Fiyat (Yüksekten Düşüğe)' },
                        { value: 'rating', label: 'En Yüksek Puanlı' },
                    ].map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => {
                                setSortBy(option.value as any);
                                bottomSheetRef.current?.close();
                            }}
                            className="flex-row items-center justify-between py-4 border-b border-gray-200"
                        >
                            <Text
                                className="text-base"
                                style={{
                                    color: sortBy === option.value ? COLORS.primary : COLORS.dark,
                                    fontWeight: sortBy === option.value ? '600' : '400',
                                }}
                            >
                                {option.label}
                            </Text>
                            {sortBy === option.value && (
                                <Ionicons name="checkmark" size={24} color={COLORS.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </BottomSheet>
        </SafeAreaView>
    );
}