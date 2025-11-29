import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Modal, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import ProductCard from '@/components/home/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Loading';

export default function CategoryDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [category, setCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'rating'>('name');
    const [showSortModal, setShowSortModal] = useState(false);

    useEffect(() => {
        loadData();
    }, [id, sortBy]);

    const loadData = async () => {
        try {
            const { data: categoryData } = await supabase
                .from('categories')
                .select('*')
                .eq('id', id)
                .single();

            if (categoryData) setCategory(categoryData);

            let query = supabase
                .from('products')
                .select('*, category:categories(*)')
                .eq('category_id', id);

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

    const sortOptions = [
        { value: 'name' as const, label: 'İsme göre (A-Z)' },
        { value: 'price_asc' as const, label: 'Fiyat (Düşükten Yükseğe)' },
        { value: 'price_desc' as const, label: 'Fiyat (Yüksekten Düşüğe)' },
        { value: 'rating' as const, label: 'En Yüksek Puanlı' },
    ];

    const handleSortSelect = (value: 'name' | 'price_asc' | 'price_desc' | 'rating') => {
        setSortBy(value);
        setShowSortModal(false);
    };

    const renderProduct = ({ item, index }: { item: Product; index: number }) => {
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
            <View style={{ width: '50%', paddingLeft: index % 2 === 0 ? 16 : 8, paddingRight: index % 2 === 0 ? 8 : 16, marginBottom: 16 }}>
                <ProductCard product={item} />
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
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
                        <View className="w-24 h-12 rounded-xl bg-gray-100 mr-2" />
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
        <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
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

                    {/* Grid/List Toggle Buttons */}
                    <View className="flex-row rounded-xl overflow-hidden mr-2" style={{ backgroundColor: '#E5E7EB' }}>
                        <TouchableOpacity
                            onPress={() => setViewMode('grid')}
                            className="w-11 h-11 items-center justify-center"
                            style={{
                                backgroundColor: viewMode === 'grid' ? COLORS.primary : 'transparent',
                            }}
                        >
                            <Ionicons
                                name="grid"
                                size={20}
                                color={viewMode === 'grid' ? '#FFFFFF' : COLORS.gray}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setViewMode('list')}
                            className="w-11 h-11 items-center justify-center"
                            style={{
                                backgroundColor: viewMode === 'list' ? COLORS.primary : 'transparent',
                            }}
                        >
                            <Ionicons
                                name="list"
                                size={20}
                                color={viewMode === 'list' ? '#FFFFFF' : COLORS.gray}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Filter Button */}
                    <TouchableOpacity
                        onPress={() => setShowSortModal(true)}
                        className="w-11 h-11 rounded-xl items-center justify-center"
                        style={{
                            backgroundColor: sortBy !== 'name' ? COLORS.primary : '#E5E7EB',
                        }}
                    >
                        <Ionicons
                            name="funnel"
                            size={20}
                            color={sortBy !== 'name' ? '#FFFFFF' : COLORS.gray}
                        />
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
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            />

            {/* Sort Modal */}
            <Modal
                visible={showSortModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowSortModal(false)}
            >
                <Pressable
                    className="flex-1 justify-end"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onPress={() => setShowSortModal(false)}
                >
                    <Pressable
                        className="bg-white rounded-t-3xl"
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Handle Bar */}
                        <View className="items-center pt-3 pb-2">
                            <View
                                style={{
                                    width: 40,
                                    height: 4,
                                    backgroundColor: COLORS.gray,
                                    borderRadius: 2,
                                    opacity: 0.3,
                                }}
                            />
                        </View>

                        <View className="px-6 py-4">
                            <Text className="text-xl font-bold mb-4" style={{ color: COLORS.dark }}>
                                Sıralama
                            </Text>

                            {sortOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    onPress={() => handleSortSelect(option.value)}
                                    className="flex-row items-center justify-between py-4 border-b"
                                    style={{ borderBottomColor: '#E5E7EB' }}
                                    activeOpacity={0.7}
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
                                        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}

                            {/* Cancel Button */}
                            <TouchableOpacity
                                onPress={() => setShowSortModal(false)}
                                className="mt-4 mb-6 py-4 rounded-xl items-center"
                                style={{ backgroundColor: COLORS.background }}
                            >
                                <Text className="text-base font-semibold" style={{ color: COLORS.dark }}>
                                    İptal
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}