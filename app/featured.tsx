import { useState, useEffect, useCallback, memo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import ProductCard from '@/components/home/ProductCard';

interface ProductWithFavorites extends Product {
    favorite_count: number;
}

const SkeletonCard = memo(() => (
    <View
        style={{
            width: '48%',
            marginBottom: 16,
            backgroundColor: '#fff',
            borderRadius: 16,
            overflow: 'hidden',
        }}
    >
        <View style={{ height: 140, backgroundColor: '#F0F0F0' }} />
        <View style={{ padding: 12 }}>
            <View
                style={{
                    height: 14,
                    width: '80%',
                    backgroundColor: '#F0F0F0',
                    borderRadius: 8,
                    marginBottom: 8,
                }}
            />
            <View
                style={{
                    height: 12,
                    width: '50%',
                    backgroundColor: '#F0F0F0',
                    borderRadius: 8,
                    marginBottom: 8,
                }}
            />
            <View
                style={{
                    height: 16,
                    width: '40%',
                    backgroundColor: '#F0F0F0',
                    borderRadius: 8,
                }}
            />
        </View>
    </View>
));

export default function FeaturedScreen() {
    const router = useRouter();
    const [products, setProducts] = useState<ProductWithFavorites[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadFeaturedProducts();
    }, []);

    const loadFeaturedProducts = async () => {
        try {
            // favorites tablosundan en çok favorilenen ürünleri çek
            const { data: favoritesData, error: favoritesError } = await supabase
                .from('favorites')
                .select('product_id');

            if (favoritesError) throw favoritesError;

            // Favori verilerini product_id'ye göre grupla ve say
            const favoritesMap = new Map<string, number>();
            favoritesData?.forEach((item) => {
                if (item.product_id) {
                    const currentCount = favoritesMap.get(item.product_id) || 0;
                    favoritesMap.set(item.product_id, currentCount + 1);
                }
            });

            // Favori verisi olan ürün ID'lerini al ve sırala
            const sortedProductIds = Array.from(favoritesMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 30)
                .map(([productId]) => productId);

            if (sortedProductIds.length === 0) {
                // Favori verisi yoksa, is_featured ve rating'e göre sırala
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('products')
                    .select('*, category:categories(*), store:stores(*)')
                    .gt('stock', 0)
                    .order('is_featured', { ascending: false })
                    .order('rating', { ascending: false })
                    .limit(30);

                if (fallbackError) throw fallbackError;

                const productsWithFavorites: ProductWithFavorites[] = (fallbackData || []).map(
                    (p) => ({
                        ...p,
                        favorite_count: 0,
                    })
                );

                setProducts(productsWithFavorites);
            } else {
                // Favori verisi olan ürünleri çek
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('*, category:categories(*), store:stores(*)')
                    .in('id', sortedProductIds)
                    .gt('stock', 0);

                if (productsError) throw productsError;

                // Ürünleri favori sayısına göre sırala
                const productsWithFavorites: ProductWithFavorites[] = (productsData || [])
                    .map((product) => ({
                        ...product,
                        favorite_count: favoritesMap.get(product.id) || 0,
                    }))
                    .sort((a, b) => b.favorite_count - a.favorite_count);

                setProducts(productsWithFavorites);
            }
        } catch (error) {
            console.error('Error loading featured products:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        loadFeaturedProducts();
    }, []);

    const renderHeader = () => (
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <View
                style={{
                    backgroundColor: '#E8F5E9',
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <View
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: COLORS.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                    }}
                >
                    <Text style={{ fontSize: 24 }}>⭐</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1B5E20' }}>
                        Kullanıcı Favorileri
                    </Text>
                    <Text style={{ fontSize: 13, color: '#388E3C', marginTop: 2 }}>
                        En çok favorilenen ürünler burada
                    </Text>
                </View>
            </View>

            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 20,
                    marginBottom: 4,
                }}
            >
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.dark }}>
                    Tüm Ürünler
                </Text>
                <Text style={{ fontSize: 14, color: COLORS.gray }}>
                    {products.length} ürün
                </Text>
            </View>
        </View>
    );

    const renderProduct = useCallback(
        ({ item, index }: { item: ProductWithFavorites; index: number }) => (
            <View
                style={{
                    width: '48%',
                    marginLeft: index % 2 === 0 ? 16 : 0,
                    marginRight: index % 2 === 1 ? 16 : 8,
                    marginBottom: 16,
                }}
            >
                <ProductCard product={item} width={undefined} />
                {item.favorite_count > 0 && (
                    <View
                        style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            backgroundColor: COLORS.primary,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Ionicons name="heart" size={12} color="#fff" />
                        <Text
                            style={{
                                color: '#fff',
                                fontSize: 10,
                                fontWeight: '600',
                                marginLeft: 2,
                            }}
                        >
                            {item.favorite_count} favori
                        </Text>
                    </View>
                )}
            </View>
        ),
        []
    );

    const renderEmpty = () => (
        <View
            style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 60,
            }}
        >
            <Ionicons name="heart-outline" size={64} color={COLORS.gray} />
            <Text
                style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: COLORS.dark,
                    marginTop: 16,
                }}
            >
                Henüz favori eklenmemiş
            </Text>
            <Text
                style={{
                    fontSize: 14,
                    color: COLORS.gray,
                    marginTop: 8,
                    textAlign: 'center',
                }}
            >
                Öne çıkan ürünler listesi henüz oluşmadı
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View
                style={{
                    backgroundColor: '#fff',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: '#F0F0F0',
                }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: COLORS.background,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                    }}
                >
                    <Ionicons name="arrow-back" size={22} color={COLORS.dark} />
                </TouchableOpacity>
                <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.dark }}>
                    ⭐ Öne Çıkanlar
                </Text>
            </View>

            {/* Content */}
            {loading ? (
                <FlatList
                    data={[1, 2, 3, 4, 5, 6]}
                    numColumns={2}
                    ListHeaderComponent={renderHeader}
                    keyExtractor={(item) => item.toString()}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
                    renderItem={() => <SkeletonCard />}
                />
            ) : (
                <FlatList
                    data={products}
                    numColumns={2}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={renderEmpty}
                    renderItem={renderProduct}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={COLORS.primary}
                            colors={[COLORS.primary]}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}