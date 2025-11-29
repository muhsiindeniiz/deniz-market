// components/home/ProductCard.tsx
import { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/lib/types';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/constants';
import { useToast } from '@/hooks/useToast';

interface ProductCardProps {
    product: Product;
    width?: number;
}

export default function ProductCard({ product, width = 160 }: ProductCardProps) {
    const router = useRouter();
    const addItem = useCartStore((state) => state.addItem);
    const { user, isAuthenticated } = useAuthStore();
    const { showToast } = useToast();

    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            checkFavoriteStatus();
        } else {
            setIsFavorite(false);
        }
    }, [isAuthenticated, user?.id, product.id]);

    const checkFavoriteStatus = async () => {
        if (!user?.id) return;

        try {
            const { data } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('product_id', product.id)
                .maybeSingle();

            setIsFavorite(!!data);
        } catch (error) {
            setIsFavorite(false);
        }
    };

    const handleToggleFavorite = async (e: any) => {
        e.stopPropagation();

        if (!isAuthenticated) {
            showToast('Favorilere eklemek için giriş yapın', 'warning');
            router.push('/(auth)/login');
            return;
        }

        if (!user?.id) return;

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

    const handleAddToCart = (e: any) => {
        e.stopPropagation();
        if (product.stock <= 0) {
            showToast('Bu ürün şu anda stokta yok', 'error');
            return;
        }
        addItem(product);
        showToast('Ürün sepete eklendi', 'success');
    };

    const price = product.discount_price || product.price;
    const hasDiscount = product.discount_price && product.discount_price < product.price;
    const discountPercentage = hasDiscount
        ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
        : 0;

    const imageUrl = product.images && product.images.length > 0
        ? product.images[0]
        : null;

    return (
        <TouchableOpacity
            onPress={() => router.push(`/product/${product.id}`)}
            className="bg-white rounded-2xl overflow-hidden"
            style={{
                width,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
            }}
            activeOpacity={0.7}
        >
            {/* Discount Badge */}
            {hasDiscount && (
                <View
                    className="absolute top-2 left-2 px-2 py-1 rounded-lg z-10"
                    style={{ backgroundColor: COLORS.danger }}
                >
                    <Text className="text-white text-xs font-bold">
                        %{discountPercentage} indirim
                    </Text>
                </View>
            )}

            {/* Favorite Button - Pressable kullanıyoruz */}
            <Pressable
                onPress={handleToggleFavorite}
                disabled={favoriteLoading}
                style={({ pressed }) => [
                    {
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: COLORS.white,
                        zIndex: 10,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.2,
                        shadowRadius: 2,
                        elevation: 3,
                        transform: [{ scale: pressed ? 0.9 : 1 }], // Basınca küçülsün
                    },
                ]}
            >
                {favoriteLoading ? (
                    <ActivityIndicator size="small" color={COLORS.danger} />
                ) : (
                    <Ionicons
                        name={isFavorite ? 'heart' : 'heart-outline'}
                        size={18}
                        color={isFavorite ? COLORS.danger : COLORS.gray}
                    />
                )}
            </Pressable>

            {/* Stock Badge */}
            {product.stock <= 0 && (
                <View
                    className="absolute top-2 left-2 px-2 py-1 rounded-lg z-10"
                    style={{ backgroundColor: COLORS.gray }}
                >
                    <Text className="text-white text-xs font-bold">
                        Tükendi
                    </Text>
                </View>
            )}

            {/* Product Image */}
            <View className="w-full h-40 bg-gray-100">
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="w-full h-full items-center justify-center">
                        <Ionicons name="image-outline" size={40} color={COLORS.gray} />
                    </View>
                )}
            </View>

            <View className="p-3">
                {/* Store Name */}
                {product.store && (
                    <Text
                        className="text-xs mb-1"
                        style={{ color: COLORS.primary }}
                        numberOfLines={1}
                    >
                        {product.store.name}
                    </Text>
                )}

                {/* Product Name */}
                <Text
                    className="text-sm font-semibold mb-1"
                    style={{ color: COLORS.dark }}
                    numberOfLines={2}
                >
                    {product.name}
                </Text>

                {/* Weight/Unit */}
                {product.weight && (
                    <Text className="text-xs mb-1" style={{ color: COLORS.gray }}>
                        {product.weight}
                    </Text>
                )}

                {/* Rating */}
                <View className="flex-row items-center mb-2">
                    <Ionicons name="star" size={14} color={COLORS.warning} />
                    <Text className="text-xs ml-1" style={{ color: COLORS.gray }}>
                        {product.rating.toFixed(1)} ({product.review_count})
                    </Text>
                </View>

                {/* Price and Add Button */}
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text
                            className="text-lg font-bold"
                            style={{ color: COLORS.primary }}
                        >
                            ₺{price.toFixed(2)}
                        </Text>
                        {hasDiscount && (
                            <Text
                                className="text-xs line-through"
                                style={{ color: COLORS.gray }}
                            >
                                ₺{product.price.toFixed(2)}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={handleAddToCart}
                        className="w-9 h-9 rounded-xl items-center justify-center"
                        style={{
                            backgroundColor: product.stock > 0 ? COLORS.primary : COLORS.gray,
                        }}
                        disabled={product.stock <= 0}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add" size={22} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}