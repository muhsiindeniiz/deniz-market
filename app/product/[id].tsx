import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Product, Review } from '@/lib/types';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/useToast';
import { COLORS } from '@/lib/constants';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const addItem = useCartStore((state) => state.addItem);
    const { showToast } = useToast();
    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);

    useEffect(() => {
        loadProductData();
    }, [id]);

    const loadProductData = async () => {
        try {
            // Load product
            const { data: productData } = await supabase
                .from('products')
                .select('*, category:categories(*)')
                .eq('id', id)
                .single();

            if (productData) setProduct(productData);

            // Load reviews
            const { data: reviewsData } = await supabase
                .from('reviews')
                .select('*, user:users(*)')
                .eq('product_id', id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (reviewsData) setReviews(reviewsData);
        } catch (error) {
            console.error('Error loading product:', error);
        } finally {
            setLoading(false);
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

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!product) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.background }}>
                <Text>Ürün bulunamadı</Text>
            </View>
        );
    }

    const price = product.discount_price || product.price;
    const hasDiscount = product.discount_price && product.discount_price < product.price;

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

                    {/* Favorite Button */}
                    <TouchableOpacity
                        onPress={() => setIsFavorite(!isFavorite)}
                        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white items-center justify-center"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 3,
                        }}
                    >
                        <Ionicons
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={24}
                            color={isFavorite ? COLORS.danger : COLORS.dark}
                        />
                    </TouchableOpacity>
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

                    {/* Seller Info */}
                    <TouchableOpacity className="flex-row items-center mb-4 pb-4 border-b border-gray-200">
                        <View
                            className="w-12 h-12 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: COLORS.primary + '20' }}
                        >
                            <Ionicons name="storefront" size={24} color={COLORS.primary} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-semibold" style={{ color: COLORS.dark }}>
                                Deniz Market
                            </Text>
                            <Text className="text-sm" style={{ color: COLORS.gray }}>
                                1.5K Takipçi
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                    </TouchableOpacity>

                    {/* Description */}
                    <View className="mb-4">
                        <Text className="text-lg font-semibold mb-2" style={{ color: COLORS.dark }}>
                            Ürün Açıklaması
                        </Text>
                        <Text
                            className="text-base leading-6"
                            style={{ color: COLORS.gray }}
                            numberOfLines={showFullDescription ? undefined : 3}
                        >
                            {product.description}
                        </Text>
                        <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)} className="mt-2">
                            <Text style={{ color: COLORS.primary }} className="font-semibold">
                                {showFullDescription ? 'Daha az göster' : 'Devamını oku'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Product Details */}
                    <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                        <Text className="text-lg font-semibold mb-3" style={{ color: COLORS.dark }}>
                            Ürün Detayları
                        </Text>

                        <View className="flex-row justify-between mb-2">
                            <Text style={{ color: COLORS.gray }}>Kategori</Text>
                            <Text className="font-medium" style={{ color: COLORS.dark }}>
                                {product.category?.name}
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
                                            <Ionicons name="person" size={20} color={COLORS.primary} />
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
                className="px-4 py-4 border-t border-gray-200"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 8,
                    backgroundColor: COLORS.white,
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

                    {/* Quantity Selector */}
                    <View className="flex-row items-center bg-gray-100 rounded-xl">
                        <TouchableOpacity
                            onPress={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 items-center justify-center"
                        >
                            <Ionicons name="remove" size={20} color={COLORS.dark} />
                        </TouchableOpacity>

                        <Text className="text-lg font-semibold px-4" style={{ color: COLORS.dark }}>
                            {quantity}
                        </Text>

                        <TouchableOpacity
                            onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                            className="w-10 h-10 items-center justify-center"
                        >
                            <Ionicons name="add" size={20} color={COLORS.dark} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="flex-row">
                    <TouchableOpacity
                        onPress={handleAddToCart}
                        disabled={product.stock === 0}
                        className="flex-1 rounded-xl py-4 mr-2 border-2"
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
                        className="flex-1 rounded-xl py-4 ml-2"
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