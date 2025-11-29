// app/(screens)/product/[id].tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Product, Review, Category, Store, User } from '@/lib/types';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { COLORS } from '@/lib/constants';
import { Pressable } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const DESCRIPTION_LINES = 3;

// Skeleton Component
const ProductDetailSkeleton = () => (
    <ScrollView className="flex-1">
        <View style={{ width, height: width, backgroundColor: COLORS.gray + '30' }} />
        <View className="p-4">
            <View style={{ width: '80%', height: 28, backgroundColor: COLORS.gray + '30', borderRadius: 4, marginBottom: 12 }} />
            <View style={{ width: '50%', height: 20, backgroundColor: COLORS.gray + '30', borderRadius: 4, marginBottom: 16 }} />
            <View className="flex-row items-center mb-4 pb-4 border-b border-gray-200">
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.gray + '30', marginRight: 12 }} />
                <View className="flex-1">
                    <View style={{ width: '60%', height: 16, backgroundColor: COLORS.gray + '30', borderRadius: 4, marginBottom: 8 }} />
                    <View style={{ width: '40%', height: 14, backgroundColor: COLORS.gray + '30', borderRadius: 4 }} />
                </View>
            </View>
            <View style={{ width: '40%', height: 20, backgroundColor: COLORS.gray + '30', borderRadius: 4, marginBottom: 12 }} />
            <View style={{ width: '100%', height: 16, backgroundColor: COLORS.gray + '30', borderRadius: 4, marginBottom: 8 }} />
            <View style={{ width: '100%', height: 16, backgroundColor: COLORS.gray + '30', borderRadius: 4, marginBottom: 8 }} />
            <View style={{ width: '70%', height: 16, backgroundColor: COLORS.gray + '30', borderRadius: 4, marginBottom: 16 }} />
        </View>
    </ScrollView>
);

export default function ProductDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const addItem = useCartStore((state) => state.addItem);
    const { user, isAuthenticated } = useAuthStore();
    const { showToast } = useToast();

    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [shouldShowReadMore, setShouldShowReadMore] = useState(false);

    useEffect(() => {
        loadProductData();
    }, [id]);

    useEffect(() => {
        if (isAuthenticated && user?.id && id) {
            checkFavoriteStatus();
        }
    }, [isAuthenticated, user?.id, id]);

    const checkFavoriteStatus = async () => {
        if (!user?.id || !id) return;

        try {
            const { data } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('product_id', id)
                .maybeSingle();

            setIsFavorite(!!data);
        } catch (error) {
            setIsFavorite(false);
        }
    };

    const loadProductData = async () => {
        try {
            setLoading(true);

            const { data: productData, error: productError } = await supabase
                .from('products')
                .select(`
                    *,
                    category:categories (*),
                    store:stores (*)
                `)
                .eq('id', id)
                .single();

            if (productError) throw productError;

            if (productData) {
                const categoryData = Array.isArray(productData.category)
                    ? productData.category[0]
                    : productData.category;

                const storeData = Array.isArray(productData.store)
                    ? productData.store[0]
                    : productData.store;

                const formattedProduct: Product = {
                    id: productData.id,
                    name: productData.name,
                    description: productData.description,
                    price: productData.price,
                    discount_price: productData.discount_price,
                    category_id: productData.category_id,
                    store_id: productData.store_id,
                    images: productData.images || [],
                    stock: productData.stock,
                    unit: productData.unit,
                    weight: productData.weight,
                    rating: productData.rating,
                    review_count: productData.review_count,
                    is_featured: productData.is_featured,
                    is_on_sale: productData.is_on_sale,
                    created_at: productData.created_at,
                    updated_at: productData.updated_at,
                    category: categoryData ? {
                        id: categoryData.id,
                        name: categoryData.name,
                        icon: categoryData.icon,
                        color: categoryData.color,
                        item_count: categoryData.item_count,
                        image_url: categoryData.image_url,
                        created_at: categoryData.created_at,
                        updated_at: categoryData.updated_at,
                    } : undefined,
                    store: storeData ? {
                        id: storeData.id,
                        name: storeData.name,
                        description: storeData.description,
                        logo: storeData.logo,
                        banner_image: storeData.banner_image,
                        address: storeData.address,
                        phone: storeData.phone,
                        email: storeData.email,
                        rating: storeData.rating,
                        review_count: storeData.review_count,
                        is_active: storeData.is_active,
                        created_at: storeData.created_at,
                        updated_at: storeData.updated_at,
                    } : undefined,
                };
                setProduct(formattedProduct);
            }

            // Load reviews
            const { data: reviewsData } = await supabase
                .from('reviews')
                .select(`
                    *,
                    user:users (*)
                `)
                .eq('product_id', id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (reviewsData) {
                const formattedReviews: Review[] = reviewsData.map(review => {
                    const userData = Array.isArray(review.user) ? review.user[0] : review.user;

                    return {
                        id: review.id,
                        product_id: review.product_id,
                        user_id: review.user_id,
                        rating: review.rating,
                        comment: review.comment,
                        created_at: review.created_at,
                        user: userData ? {
                            id: userData.id,
                            email: userData.email,
                            full_name: userData.full_name,
                            phone: userData.phone,
                            birth_date: userData.birth_date,
                            created_at: userData.created_at,
                            updated_at: userData.updated_at,
                        } : undefined,
                    };
                });
                setReviews(formattedReviews);
            }
        } catch (error) {
            console.error('Error loading product:', error);
            showToast('Ürün yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            showToast('Favorilere eklemek için giriş yapın', 'warning');
            router.push('/(auth)/login');
            return;
        }

        if (!user?.id || !product?.id) return;

        setFavoriteLoading(true);

        try {
            if (isFavorite) {
                const { error } = await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', product.id);

                if (error) throw error;

                setIsFavorite(false);
                showToast('Favorilerden kaldırıldı', 'success');
            } else {
                const { error } = await supabase
                    .from('favorites')
                    .insert({
                        user_id: user.id,
                        product_id: product.id,
                    });

                if (error) throw error;

                setIsFavorite(true);
                showToast('Favorilere eklendi', 'success');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showToast('Bir hata oluştu', 'error');
        } finally {
            setFavoriteLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (!product) return;
        addItem(product, quantity);
        showToast(`${quantity} adet ${product.name} sepete eklendi`, 'success');
    };

    const handleBuyNow = () => {
        if (!product) return;
        addItem(product, quantity);
        router.push('/cart');
    };

    const handleStorePress = () => {
        if (product?.store?.id) {
            router.push(`/store/${product.store.id}`);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.white }}>
                <View className="px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                    </TouchableOpacity>
                    <Text className="text-lg font-semibold" style={{ color: COLORS.dark }}>
                        Ürün Detayı
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/cart')}>
                        <Ionicons name="cart-outline" size={24} color={COLORS.dark} />
                    </TouchableOpacity>
                </View>
                <ProductDetailSkeleton />
            </SafeAreaView>
        );
    }

    if (!product) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
                <View className="px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                    </TouchableOpacity>
                    <Text className="text-lg font-semibold" style={{ color: COLORS.dark }}>
                        Ürün Detayı
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/cart')}>
                        <Ionicons name="cart-outline" size={24} color={COLORS.dark} />
                    </TouchableOpacity>
                </View>
                <View className="flex-1 items-center justify-center">
                    <Ionicons name="alert-circle-outline" size={64} color={COLORS.gray} />
                    <Text className="text-xl font-bold mt-4" style={{ color: COLORS.dark }}>
                        Ürün Bulunamadı
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mt-6 px-6 py-3 rounded-xl"
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        <Text className="text-white font-semibold">Geri Dön</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const price = product.discount_price || product.price;
    const hasDiscount = product.discount_price && product.discount_price < product.price;
    const isMinQuantity = quantity <= 1;
    const isMaxQuantity = quantity >= product.stock;

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.white }}>
            {/* Header */}
            <View className="px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                </TouchableOpacity>
                <Text className="text-lg font-semibold" style={{ color: COLORS.dark }}>
                    Ürün Detayı
                </Text>
                <TouchableOpacity onPress={() => router.push('/cart')}>
                    <Ionicons name="cart-outline" size={24} color={COLORS.dark} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Product Images */}
                <View className="bg-gray-100">
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(event) => {
                            const index = Math.round(event.nativeEvent.contentOffset.x / width);
                            setSelectedImageIndex(index);
                        }}
                        scrollEventThrottle={16}
                    >
                        {product.images.map((image, index) => (
                            <Image
                                key={index}
                                source={{ uri: image }}
                                style={{ width, height: width }}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>

                    {/* Image Indicators */}
                    {product.images.length > 1 && (
                        <View className="absolute bottom-4 left-0 right-0 flex-row justify-center">
                            {product.images.map((_, index) => (
                                <View
                                    key={index}
                                    className="h-2 rounded-full mx-1"
                                    style={{
                                        width: selectedImageIndex === index ? 24 : 8,
                                        backgroundColor: selectedImageIndex === index ? COLORS.primary : COLORS.white + '60',
                                    }}
                                />
                            ))}
                        </View>
                    )}

                    {/* Favorite Button */}
                    <Pressable
                        onPress={handleToggleFavorite}
                        disabled={favoriteLoading}
                        style={({ pressed }) => [
                            {
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: COLORS.white,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.15,
                                shadowRadius: 8,
                                elevation: 4,
                                opacity: pressed ? 0.8 : 1,
                            },
                        ]}
                    >
                        {favoriteLoading ? (
                            <ActivityIndicator size="small" color={COLORS.danger} />
                        ) : (
                            <Ionicons
                                name={isFavorite ? 'heart' : 'heart-outline'}
                                size={26}
                                color={isFavorite ? COLORS.danger : COLORS.dark}
                            />
                        )}
                    </Pressable>

                    {/* Discount Badge */}
                    {hasDiscount && (
                        <View
                            className="absolute top-4 left-4 px-3 py-1 rounded-full"
                            style={{ backgroundColor: COLORS.danger }}
                        >
                            <Text className="text-white font-bold text-sm">
                                %{Math.round(((product.price - product.discount_price!) / product.price) * 100)} İndirim
                            </Text>
                        </View>
                    )}
                </View>

                {/* Product Info */}
                <View className="p-4">
                    <Text className="text-2xl font-bold mb-2" style={{ color: COLORS.dark }}>
                        {product.name}
                    </Text>

                    <View className="flex-row items-center mb-4">
                        <View className="flex-row items-center mr-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                    key={star}
                                    name={star <= Math.round(product.rating) ? 'star' : 'star-outline'}
                                    size={18}
                                    color={COLORS.warning}
                                />
                            ))}
                            <Text className="ml-2 text-base" style={{ color: COLORS.gray }}>
                                {product.rating.toFixed(1)} ({product.review_count} değerlendirme)
                            </Text>
                        </View>
                    </View>

                    {/* Store Info */}
                    {product.store && (
                        <TouchableOpacity
                            onPress={handleStorePress}
                            className="flex-row items-center mb-4 pb-4 border-b border-gray-200"
                            activeOpacity={0.7}
                        >
                            <View
                                className="w-12 h-12 rounded-full items-center justify-center mr-3 overflow-hidden"
                                style={{ backgroundColor: COLORS.primary + '20' }}
                            >
                                {product.store.logo ? (
                                    <Image
                                        source={{ uri: product.store.logo }}
                                        style={{ width: 48, height: 48 }}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Ionicons name="storefront" size={24} color={COLORS.primary} />
                                )}
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-semibold mb-1" style={{ color: COLORS.dark }}>
                                    {product.store.name}
                                </Text>
                                <View className="flex-row items-center">
                                    <Ionicons name="star" size={14} color={COLORS.warning} />
                                    <Text className="text-sm ml-1" style={{ color: COLORS.gray }}>
                                        {product.store.rating?.toFixed(1) || '5.0'} ({product.store.review_count || 0} değerlendirme)
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                        </TouchableOpacity>
                    )}

                    {/* Description */}
                    {product.description && (
                        <View className="mb-4">
                            <Text className="text-lg font-semibold mb-2" style={{ color: COLORS.dark }}>
                                Ürün Açıklaması
                            </Text>
                            <Text
                                className="text-base leading-6"
                                style={{ color: COLORS.gray }}
                                numberOfLines={showFullDescription ? undefined : DESCRIPTION_LINES}
                                onTextLayout={(e) => {
                                    if (e.nativeEvent.lines.length > DESCRIPTION_LINES) {
                                        setShouldShowReadMore(true);
                                    }
                                }}
                            >
                                {product.description}
                            </Text>
                            {shouldShowReadMore && (
                                <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)} className="mt-2">
                                    <Text style={{ color: COLORS.primary }} className="font-semibold">
                                        {showFullDescription ? 'Daha az göster' : 'Devamını oku'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Product Details */}
                    <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                        <Text className="text-lg font-semibold mb-3" style={{ color: COLORS.dark }}>
                            Ürün Detayları
                        </Text>

                        {product.store && (
                            <View className="flex-row justify-between mb-2">
                                <Text style={{ color: COLORS.gray }}>Mağaza</Text>
                                <Text className="font-medium" style={{ color: COLORS.dark }}>
                                    {product.store.name}
                                </Text>
                            </View>
                        )}

                        <View className="flex-row justify-between mb-2">
                            <Text style={{ color: COLORS.gray }}>Kategori</Text>
                            <Text className="font-medium" style={{ color: COLORS.dark }}>
                                {product.category?.name || '-'}
                            </Text>
                        </View>

                        <View className="flex-row justify-between mb-2">
                            <Text style={{ color: COLORS.gray }}>Birim</Text>
                            <Text className="font-medium" style={{ color: COLORS.dark }}>
                                {product.unit}
                            </Text>
                        </View>

                        {product.weight && (
                            <View className="flex-row justify-between mb-2">
                                <Text style={{ color: COLORS.gray }}>Ağırlık</Text>
                                <Text className="font-medium" style={{ color: COLORS.dark }}>
                                    {product.weight}
                                </Text>
                            </View>
                        )}

                        <View className="flex-row justify-between">
                            <Text style={{ color: COLORS.gray }}>Stok</Text>
                            <Text className="font-medium" style={{ color: product.stock > 0 ? COLORS.primary : COLORS.danger }}>
                                {product.stock > 0 ? `${product.stock} adet` : 'Stokta yok'}
                            </Text>
                        </View>
                    </View>

                    {/* Reviews */}
                    {reviews.length > 0 && (
                        <View className="mb-4">
                            <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-lg font-semibold" style={{ color: COLORS.dark }}>
                                    Değerlendirmeler
                                </Text>
                                <TouchableOpacity onPress={() => router.push(`/reviews/${product.id}`)}>
                                    <Text style={{ color: COLORS.primary }} className="font-semibold">
                                        Tümünü Gör
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {reviews.slice(0, 2).map((review) => (
                                <View key={review.id} className="bg-gray-50 rounded-2xl p-4 mb-3">
                                    <View className="flex-row items-center mb-2">
                                        <View
                                            className="w-10 h-10 rounded-full items-center justify-center mr-3"
                                            style={{ backgroundColor: COLORS.primary + '20' }}
                                        >
                                            <Text className="font-bold" style={{ color: COLORS.primary }}>
                                                {review.user?.full_name?.charAt(0).toUpperCase() || 'K'}
                                            </Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text className="font-semibold" style={{ color: COLORS.dark }}>
                                                {review.user?.full_name || 'Kullanıcı'}
                                            </Text>
                                            <View className="flex-row">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Ionicons
                                                        key={star}
                                                        name={star <= review.rating ? 'star' : 'star-outline'}
                                                        size={14}
                                                        color={COLORS.warning}
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                    <Text style={{ color: COLORS.gray }}>{review.comment}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Bar */}
            <View
                className="px-4 py-3 border-t border-gray-200"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 8,
                    backgroundColor: COLORS.white,
                    paddingBottom: 20,
                }}
            >
                <View className="flex-row items-center mb-3">
                    <View className="flex-1">
                        <Text className="text-sm mb-1" style={{ color: COLORS.gray }}>
                            Toplam Fiyat
                        </Text>
                        <View className="flex-row items-center">
                            <Text className="text-2xl font-bold mr-2" style={{ color: COLORS.primary }}>
                                ₺{(price * quantity).toFixed(2)}
                            </Text>
                            {hasDiscount && (
                                <Text className="text-base line-through" style={{ color: COLORS.gray }}>
                                    ₺{(product.price * quantity).toFixed(2)}
                                </Text>
                            )}
                        </View>
                    </View>

                    <View className="flex-row items-center bg-gray-100 rounded-xl">
                        <TouchableOpacity
                            onPress={() => {
                                if (!isMinQuantity) {
                                    setQuantity(quantity - 1);
                                }
                            }}
                            disabled={isMinQuantity}
                            className="w-10 h-10 items-center justify-center"
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="remove"
                                size={20}
                                color={isMinQuantity ? COLORS.gray + '80' : COLORS.dark}
                            />
                        </TouchableOpacity>

                        <Text className="text-lg font-semibold px-4" style={{ color: COLORS.dark }}>
                            {quantity}
                        </Text>

                        <TouchableOpacity
                            onPress={() => {
                                if (!isMaxQuantity) {
                                    setQuantity(quantity + 1);
                                } else {
                                    showToast('Maksimum stok miktarına ulaşıldı', 'warning');
                                }
                            }}
                            disabled={isMaxQuantity}
                            className="w-10 h-10 items-center justify-center"
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="add"
                                size={20}
                                color={isMaxQuantity ? COLORS.gray + '80' : COLORS.dark}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="flex-row">
                    <TouchableOpacity
                        onPress={handleAddToCart}
                        disabled={product.stock === 0}
                        className="flex-1 rounded-xl py-3 mr-2 border-2"
                        style={{
                            borderColor: COLORS.primary,
                            opacity: product.stock === 0 ? 0.5 : 1,
                        }}
                    >
                        <Text className="text-center font-semibold text-base" style={{ color: COLORS.primary }}>
                            Sepete Ekle
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleBuyNow}
                        disabled={product.stock === 0}
                        className="flex-1 rounded-xl py-3 ml-2"
                        style={{
                            backgroundColor: COLORS.primary,
                            opacity: product.stock === 0 ? 0.5 : 1,
                        }}
                    >
                        <Text className="text-white text-center font-semibold text-base">
                            Hemen Al
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}