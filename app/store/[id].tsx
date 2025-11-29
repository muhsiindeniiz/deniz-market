import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Store, Product } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import ProductCard from '@/components/home/ProductCard';

export default function StoreDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStoreData();
    }, [id]);

    const loadStoreData = async () => {
        try {
            // Load store
            const { data: storeData } = await supabase
                .from('stores')
                .select('*')
                .eq('id', id)
                .single();

            if (storeData) setStore(storeData);

            // Load products
            const { data: productsData } = await supabase
                .from('products')
                .select('*, category:categories(*), store:stores(*)')
                .eq('store_id', id);

            if (productsData) setProducts(productsData);
        } catch (error) {
            console.error('Error loading store:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderProduct = ({ item }: { item: Product }) => (
        <View className="w-1/2 px-2 mb-4">
            <ProductCard product={item} />
        </View>
    );

    if (!store) {
        return null;
    }

    return (
        <SafeAreaView className="flex-1"style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                </TouchableOpacity>
                <Text className="text-xl font-bold flex-1" style={{ color: COLORS.dark }} numberOfLines={1}>
                    {store.name}
                </Text>
            </View>

            <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                numColumns={2}
                ListHeaderComponent={
                    <View>
                        {/* Store Banner */}
                        {store.banner_image && (
                            <Image
                                source={{ uri: store.banner_image }}
                                style={{ width: '100%', height: 200 }}
                                resizeMode="cover"
                            />
                        )}

                        {/* Store Info */}
                        <View className="bg-white p-4 mb-2">
                            <View className="flex-row items-center mb-3">
                                {store.logo && (
                                    <Image
                                        source={{ uri: store.logo }}
                                        className="w-20 h-20 rounded-2xl mr-4"
                                        resizeMode="cover"
                                    />
                                )}
                                <View className="flex-1">
                                    <Text className="text-2xl font-bold mb-1" style={{ color: COLORS.dark }}>
                                        {store.name}
                                    </Text>
                                    <View className="flex-row items-center">
                                        <Ionicons name="star" size={16} color={COLORS.warning} />
                                        <Text className="ml-1" style={{ color: COLORS.gray }}>
                                            {store.rating.toFixed(1)} ({store.review_count} değerlendirme)
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {store.description && (
                                <Text className="text-base mb-3" style={{ color: COLORS.gray }}>
                                    {store.description}
                                </Text>
                            )}

                            {store.address && (
                                <View className="flex-row items-center mb-2">
                                    <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                                    <Text className="ml-2 flex-1" style={{ color: COLORS.gray }}>
                                        {store.address}
                                    </Text>
                                </View>
                            )}

                            {store.phone && (
                                <View className="flex-row items-center">
                                    <Ionicons name="call-outline" size={20} color={COLORS.primary} />
                                    <Text className="ml-2" style={{ color: COLORS.gray }}>
                                        {store.phone}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View className="px-4 py-3 bg-white mb-2">
                            <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                                Ürünler ({products.length})
                            </Text>
                        </View>
                    </View>
                }
                contentContainerStyle={{ paddingHorizontal: 8 }}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}