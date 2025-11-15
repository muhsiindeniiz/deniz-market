import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/lib/types';
import { useCartStore } from '@/store/cartStore';
import { COLORS } from '@/lib/constants';
import { useToast } from '@/hooks/useToast';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const router = useRouter();
    const addItem = useCartStore((state) => state.addItem);
    const { showToast } = useToast();

    const handleAddToCart = (e: any) => {
        e.stopPropagation();
        addItem(product);
        showToast('Ürün sepete eklendi', 'success');
    };

    const price = product.discount_price || product.price;
    const hasDiscount = product.discount_price && product.discount_price < product.price;

    return (
        <TouchableOpacity
            onPress={() => router.push(`/product/${product.id}`)}
            className="bg-white rounded-2xl overflow-hidden mr-3"
            style={{ width: 160 }}
        >
            {hasDiscount && (
                <View className="absolute top-2 left-2 px-2 py-1 rounded-lg z-10" style={{ backgroundColor: COLORS.danger }}>
                    <Text className="text-white text-xs font-bold">İNDİRİM</Text>
                </View>
            )}

            <Image
                source={{ uri: product.images[0] }}
                className="w-full h-40"
                resizeMode="cover"
            />

            <View className="p-3">
                <Text className="text-sm font-semibold mb-1" style={{ color: COLORS.dark }} numberOfLines={2}>
                    {product.name}
                </Text>

                <View className="flex-row items-center mb-2">
                    <Ionicons name="star" size={14} color={COLORS.warning} />
                    <Text className="text-xs ml-1" style={{ color: COLORS.gray }}>
                        {product.rating.toFixed(1)} ({product.review_count})
                    </Text>
                </View>

                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-lg font-bold" style={{ color: COLORS.primary }}>
                            ₺{price.toFixed(2)}
                        </Text>
                        {hasDiscount && (
                            <Text className="text-xs line-through" style={{ color: COLORS.gray }}>
                                ₺{product.price.toFixed(2)}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={handleAddToCart}
                        className="w-8 h-8 rounded-lg items-center justify-center"
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        <Ionicons name="add" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}