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

interface ProductWithSales extends Product {
    total_sold: number;
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

export default function BestSellersScreen() {
    const router = useRouter();
    const [products, setProducts] = useState<ProductWithSales[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadBestSellers();
    }, []);

    const loadBestSellers = async () => {
        try {
            // order_items tablosundan en çok satılan ürünleri çek
            const { data: salesData, error: salesError } = await supabase
                .from('order_items')
                .select('product_id, quantity');

            if (salesError) throw salesError;

            // Satış verilerini product_id'ye göre grupla ve topla
            const salesMap = new Map<string, number>();
            salesData?.forEach((item) => {
                if (item.product_id) {
                    const currentTotal = salesMap.get(item.product_id) || 0;
                    salesMap.set(item.product_id, currentTotal + item.quantity);
                }
            });

            // Satış verisi olan ürün ID'lerini al ve sırala
            const sortedProductIds = Array.from(salesMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 30)
                .map(([productId]) => productId);

            if (sortedProductIds.length === 0) {
                // Satış verisi yoksa, review_count'a göre sırala
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('products')
                    .select('*, category:categories(*), store:stores(*)')
                    .gt('stock', 0)
                    .order('review_count', { ascending: false })
                    .limit(30);

                if (fallbackError) throw fallbackError;

                const productsWithSales: ProductWithSales[] = (fallbackData || []).map((p) => ({
                    ...p,
                    total_sold: 0,
                }));

                setProducts(productsWithSales);
            } else {
                // Satış verisi olan ürünleri çek
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('*, category:categories(*), store:stores(*)')
                    .in('id', sortedProductIds)
                    .gt('stock', 0);

                if (productsError) throw productsError;

                // Ürünleri satış miktarına göre sırala
                const productsWithSales: ProductWithSales[] = (productsData || [])
                    .map((product) => ({
                        ...product,
                        total_sold: salesMap.get(product.id) || 0,
                    }))
                    .sort((a, b) => b.total_sold - a.total_sold);

                setProducts(productsWithSales);
            }
        } catch (error) {
            console.error('Error loading best sellers:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        loadBestSellers();
    }, []);

    const renderHeader = () => (
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <View
                style={{
                    backgroundColor: '#FFF3E0',
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
                        backgroundColor: '#FF9800',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                    }}
                >
                    <Text style={{ fontSize: 24 }}>🔥</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#E65100' }}>
                        En Çok Tercih Edilenler
                    </Text>
                    <Text style={{ fontSize: 13, color: '#F57C00', marginTop: 2 }}>
                        Müşterilerimizin en çok satın aldığı ürünler
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
        ({ item, index }: { item: ProductWithSales; index: number }) => (
            <View
                style={{
                    width: '48%',
                    marginLeft: index % 2 === 0 ? 16 : 0,
                    marginRight: index % 2 === 1 ? 16 : 8,
                    marginBottom: 16,
                }}
            >
                <ProductCard product={item} width={undefined} />
                {item.total_sold > 0 && (
                    <View
                        style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            backgroundColor: COLORS.danger,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Ionicons name="flame" size={12} color="#fff" />
                        <Text
                            style={{
                                color: '#fff',
                                fontSize: 10,
                                fontWeight: '600',
                                marginLeft: 2,
                            }}
                        >
                            {item.total_sold} satıldı
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
            <Ionicons name="bag-outline" size={64} color={COLORS.gray} />
            <Text
                style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: COLORS.dark,
                    marginTop: 16,
                }}
            >
                Henüz satış verisi yok
            </Text>
            <Text
                style={{
                    fontSize: 14,
                    color: COLORS.gray,
                    marginTop: 8,
                    textAlign: 'center',
                }}
            >
                Çok satanlar listesi henüz oluşmadı
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
                    🔥 Çok Satanlar
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