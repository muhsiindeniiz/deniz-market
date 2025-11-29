// components/home/ProductCard.tsx
import { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
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

    const handleToggleFavorite = async () => {
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

    const handleAddToCart = () => {
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
            style={[styles.card, { width }]}
            activeOpacity={0.7}
        >
            {/* Image Section */}
            <View style={styles.imageContainer}>
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="image-outline" size={40} color={COLORS.gray} />
                    </View>
                )}

                {/* Discount Badge - Sol üst */}
                {hasDiscount && product.stock > 0 && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>%{discountPercentage}</Text>
                    </View>
                )}

                {/* Stock Badge - Sol üst */}
                {product.stock <= 0 && (
                    <View style={styles.stockBadge}>
                        <Text style={styles.stockText}>Tükendi</Text>
                    </View>
                )}

                {/* Favorite Button - Sağ üst */}
                <TouchableOpacity
                    onPress={handleToggleFavorite}
                    disabled={favoriteLoading}
                    style={styles.favoriteButton}
                    activeOpacity={0.7}
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
                </TouchableOpacity>
            </View>

            {/* Content Section */}
            <View style={styles.content}>
                {/* Store Name */}
                {product.store && (
                    <Text style={styles.storeName} numberOfLines={1}>
                        {product.store.name}
                    </Text>
                )}

                {/* Product Name */}
                <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                </Text>

                {/* Weight/Unit */}
                {product.weight && (
                    <Text style={styles.weight}>{product.weight}</Text>
                )}

                {/* Rating */}
                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={12} color={COLORS.warning} />
                    <Text style={styles.ratingText}>
                        {product.rating.toFixed(1)} ({product.review_count})
                    </Text>
                </View>

                {/* Price and Add Button */}
                <View style={styles.priceRow}>
                    <View>
                        <Text style={styles.price}>₺{price.toFixed(2)}</Text>
                        {hasDiscount && (
                            <Text style={styles.oldPrice}>₺{product.price.toFixed(2)}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={handleAddToCart}
                        style={[
                            styles.addButton,
                            { backgroundColor: product.stock > 0 ? COLORS.primary : COLORS.gray }
                        ]}
                        disabled={product.stock <= 0}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    imageContainer: {
        width: '100%',
        height: 140,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#F5F5F5',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    discountBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: COLORS.danger,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    discountText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    stockBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: COLORS.gray,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    stockText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    favoriteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    content: {
        padding: 12,
    },
    storeName: {
        fontSize: 11,
        color: COLORS.primary,
        marginBottom: 2,
    },
    productName: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 2,
        lineHeight: 18,
    },
    weight: {
        fontSize: 11,
        color: COLORS.gray,
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingText: {
        fontSize: 11,
        color: COLORS.gray,
        marginLeft: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
    },
    oldPrice: {
        fontSize: 11,
        color: COLORS.gray,
        textDecorationLine: 'line-through',
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});