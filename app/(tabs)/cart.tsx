// app/(tabs)/cart.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { COLORS, FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from '@/lib/constants';
import { Coupon } from '@/lib/types';

export default function CartScreen() {
    const router = useRouter();
    const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
    const { isAuthenticated } = useAuthStore();
    const { showToast } = useToast();

    const [promoCode, setPromoCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [discount, setDiscount] = useState(0);
    const [couponModalVisible, setCouponModalVisible] = useState(false);
    const [couponInput, setCouponInput] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);

    const subtotal = getTotal();
    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const total = subtotal - discount + deliveryFee;
    const remainingForFreeDelivery = FREE_DELIVERY_THRESHOLD - subtotal;

    useEffect(() => {
        loadAvailableCoupons();
    }, []);

    // Kupon uygulandığında veya sepet değiştiğinde indirimi yeniden hesapla
    useEffect(() => {
        if (appliedCoupon) {
            calculateDiscount(appliedCoupon);
        }
    }, [subtotal, appliedCoupon]);

    const loadAvailableCoupons = async () => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('is_active', true)
                .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
                .order('discount_value', { ascending: false });

            if (error) throw error;
            if (data) setAvailableCoupons(data);
        } catch (error) {
            console.error('Error loading coupons:', error);
        }
    };

    const calculateDiscount = (coupon: Coupon) => {
        if (subtotal < coupon.min_order_amount) {
            setDiscount(0);
            return;
        }

        let discountAmount = 0;
        if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotal * coupon.discount_value) / 100;
        } else {
            discountAmount = coupon.discount_value;
        }

        // İndirim tutarı sepet toplamını geçemez
        discountAmount = Math.min(discountAmount, subtotal);
        setDiscount(discountAmount);
    };

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) {
            showToast('Lütfen kupon kodu girin', 'warning');
            return;
        }

        setCouponLoading(true);

        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', couponInput.toUpperCase())
                .eq('is_active', true)
                .single();

            if (error || !data) {
                showToast('Geçersiz kupon kodu', 'error');
                setCouponLoading(false);
                return;
            }

            const coupon = data as Coupon;

            // Geçerlilik tarihi kontrolü
            if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
                showToast('Bu kuponun süresi dolmuş', 'error');
                setCouponLoading(false);
                return;
            }

            // Kullanım limiti kontrolü
            if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
                showToast('Bu kupon kullanım limitine ulaşmış', 'error');
                setCouponLoading(false);
                return;
            }

            // Minimum sipariş tutarı kontrolü
            if (subtotal < coupon.min_order_amount) {
                showToast(
                    `Bu kuponu kullanmak için minimum ₺${coupon.min_order_amount.toFixed(2)} tutarında sipariş vermelisiniz`,
                    'warning'
                );
                setCouponLoading(false);
                return;
            }

            // Kupon uygula
            setAppliedCoupon(coupon);
            setPromoCode(coupon.code);
            calculateDiscount(coupon);
            setCouponModalVisible(false);
            setCouponInput('');
            showToast('Kupon kodu başarıyla uygulandı!', 'success');
        } catch (error) {
            console.error('Error applying coupon:', error);
            showToast('Kupon uygulanırken bir hata oluştu', 'error');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setPromoCode('');
        setDiscount(0);
        showToast('Kupon kaldırıldı', 'info');
    };

    const handleSelectCoupon = (coupon: Coupon) => {
        if (subtotal < coupon.min_order_amount) {
            showToast(
                `Bu kuponu kullanmak için minimum ₺${coupon.min_order_amount.toFixed(2)} tutarında sipariş vermelisiniz`,
                'warning'
            );
            return;
        }

        setAppliedCoupon(coupon);
        setPromoCode(coupon.code);
        calculateDiscount(coupon);
        setCouponModalVisible(false);
        showToast('Kupon kodu başarıyla uygulandı!', 'success');
    };

    const handleCheckout = () => {
        if (!isAuthenticated) {
            Alert.alert(
                'Giriş Gerekli',
                'Sipariş vermek için giriş yapmanız gerekiyor.',
                [
                    { text: 'İptal', style: 'cancel' },
                    { text: 'Giriş Yap', onPress: () => router.push('/(auth)/login') },
                ]
            );
            return;
        }

        if (items.length === 0) {
            return;
        }

        router.push('/order-confirmation');
    };

    const handleRemoveItem = (productId: string, productName: string) => {
        Alert.alert(
            'Ürünü Kaldır',
            `${productName} sepetten kaldırılsın mı?`,
            [
                { text: 'İptal', style: 'cancel' },
                { text: 'Kaldır', style: 'destructive', onPress: () => removeItem(productId) },
            ]
        );
    };

    const formatDiscountText = (coupon: Coupon): string => {
        if (coupon.discount_type === 'percentage') {
            return `%${coupon.discount_value} indirim`;
        }
        return `₺${coupon.discount_value} indirim`;
    };

    if (items.length === 0) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
                <View className="bg-white px-4 py-4 border-b border-gray-200">
                    <Text className="text-2xl font-bold" style={{ color: COLORS.dark }}>
                        Sepetim
                    </Text>
                </View>

                <View className="flex-1 items-center justify-center px-8">
                    <View
                        className="w-32 h-32 rounded-full items-center justify-center mb-6"
                        style={{ backgroundColor: COLORS.primary + '20' }}
                    >
                        <Ionicons name="cart-outline" size={64} color={COLORS.primary} />
                    </View>
                    <Text className="text-2xl font-bold mb-2 text-center" style={{ color: COLORS.dark }}>
                        Sepetiniz Boş
                    </Text>
                    <Text className="text-base text-center mb-6" style={{ color: COLORS.gray }}>
                        Görünüşe göre henüz bir şey eklemediniz — hemen alışverişe başlayın!
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)')}
                        className="rounded-xl px-8 py-4"
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        <Text className="text-white text-base font-semibold">Alışverişe Başla</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                    <Text className="text-2xl font-bold" style={{ color: COLORS.dark }}>
                        Sepetim
                    </Text>
                    <TouchableOpacity onPress={() => {
                        Alert.alert(
                            'Sepeti Temizle',
                            'Tüm ürünler sepetten kaldırılacak. Emin misiniz?',
                            [
                                { text: 'İptal', style: 'cancel' },
                                {
                                    text: 'Temizle',
                                    style: 'destructive',
                                    onPress: () => {
                                        clearCart();
                                        setAppliedCoupon(null);
                                        setDiscount(0);
                                        setPromoCode('');
                                    }
                                },
                            ]
                        );
                    }}>
                        <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {/* Free Delivery Banner */}
                {remainingForFreeDelivery > 0 && (
                    <View className="mx-4 mt-4 bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                        <View className="flex-row items-center">
                            <Ionicons name="information-circle" size={24} color={COLORS.warning} />
                            <Text className="flex-1 ml-3 text-sm" style={{ color: COLORS.dark }}>
                                Sepete <Text className="font-bold">₺{remainingForFreeDelivery.toFixed(2)}</Text> değerinde daha ürün ekleyin, kargo ücretsiz olsun!
                            </Text>
                        </View>
                    </View>
                )}

                {/* Cart Items */}
                <View className="px-4 py-4">
                    {items.map((item) => {
                        const price = item.product.discount_price || item.product.price;
                        const itemTotal = price * item.quantity;
                        const isMinQuantity = item.quantity <= 1;
                        const isMaxQuantity = item.quantity >= item.product.stock;

                        return (
                            <View
                                key={item.product.id}
                                className="bg-white rounded-2xl p-4 mb-3 flex-row"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                    elevation: 2,
                                }}
                            >
                                <Image
                                    source={{ uri: item.product.images?.[0] || 'https://via.placeholder.com/100' }}
                                    className="w-24 h-24 rounded-xl"
                                    resizeMode="cover"
                                />

                                <View className="flex-1 ml-3">
                                    <View className="flex-row items-start justify-between mb-1">
                                        <Text
                                            className="flex-1 text-base font-semibold mr-2"
                                            style={{ color: COLORS.dark }}
                                            numberOfLines={2}
                                        >
                                            {item.product.name}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => handleRemoveItem(item.product.id, item.product.name)}
                                        >
                                            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                                        </TouchableOpacity>
                                    </View>

                                    <Text className="text-sm mb-2" style={{ color: COLORS.gray }}>
                                        {item.product.unit}
                                    </Text>

                                    <View className="flex-row items-center justify-between">
                                        <View>
                                            <Text className="text-lg font-bold" style={{ color: COLORS.primary }}>
                                                ₺{itemTotal.toFixed(2)}
                                            </Text>
                                            {item.product.discount_price && (
                                                <Text className="text-xs line-through" style={{ color: COLORS.gray }}>
                                                    ₺{(item.product.price * item.quantity).toFixed(2)}
                                                </Text>
                                            )}
                                        </View>

                                        {/* Quantity Selector */}
                                        <View className="flex-row items-center bg-gray-100 rounded-xl">
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (!isMinQuantity) {
                                                        updateQuantity(item.product.id, item.quantity - 1);
                                                    }
                                                }}
                                                disabled={isMinQuantity}
                                                className="w-8 h-8 items-center justify-center"
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons
                                                    name="remove"
                                                    size={18}
                                                    color={isMinQuantity ? COLORS.gray + '80' : COLORS.dark}
                                                />
                                            </TouchableOpacity>

                                            <Text className="text-base font-semibold px-3" style={{ color: COLORS.dark }}>
                                                {item.quantity}
                                            </Text>

                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (!isMaxQuantity) {
                                                        updateQuantity(item.product.id, item.quantity + 1);
                                                    } else {
                                                        showToast('Maksimum stok miktarına ulaşıldı', 'warning');
                                                    }
                                                }}
                                                disabled={isMaxQuantity}
                                                className="w-8 h-8 items-center justify-center"
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons
                                                    name="add"
                                                    size={18}
                                                    color={isMaxQuantity ? COLORS.gray + '80' : COLORS.dark}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Promo Code */}
                {!appliedCoupon ? (
                    <View className="px-4 mb-4">
                        <TouchableOpacity
                            onPress={() => setCouponModalVisible(true)}
                            className="bg-white rounded-2xl p-4 flex-row items-center justify-between"
                        >
                            <View className="flex-row items-center flex-1">
                                <View
                                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                    style={{ backgroundColor: COLORS.primary + '20' }}
                                >
                                    <Ionicons name="pricetag" size={24} color={COLORS.primary} />
                                </View>
                                <Text className="text-base font-medium" style={{ color: COLORS.dark }}>
                                    Kupon Kodu Var mı?
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* Applied Coupon */
                    <View className="mx-4 mb-4 bg-green-50 rounded-2xl p-4 border border-green-200">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                                <View className="ml-3 flex-1">
                                    <Text className="font-semibold" style={{ color: COLORS.dark }}>
                                        {appliedCoupon.code}
                                    </Text>
                                    <Text className="text-sm" style={{ color: COLORS.gray }}>
                                        {formatDiscountText(appliedCoupon)} - ₺{discount.toFixed(2)} tasarruf
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleRemoveCoupon}>
                                <Ionicons name="close-circle" size={24} color={COLORS.danger} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Price Summary */}
                <View className="bg-white rounded-2xl mx-4 mb-4 p-4">
                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        Fiyat Özeti
                    </Text>

                    <View className="flex-row justify-between mb-2">
                        <Text style={{ color: COLORS.gray }}>Ara Toplam</Text>
                        <Text className="font-semibold" style={{ color: COLORS.dark }}>
                            ₺{subtotal.toFixed(2)}
                        </Text>
                    </View>

                    {discount > 0 && (
                        <View className="flex-row justify-between mb-2">
                            <Text style={{ color: COLORS.primary }}>İndirim ({promoCode})</Text>
                            <Text className="font-semibold" style={{ color: COLORS.primary }}>
                                -₺{discount.toFixed(2)}
                            </Text>
                        </View>
                    )}

                    <View className="flex-row justify-between mb-3 pb-3 border-b border-gray-200">
                        <Text style={{ color: COLORS.gray }}>Kargo Ücreti</Text>
                        <Text className="font-semibold" style={{ color: deliveryFee === 0 ? COLORS.primary : COLORS.dark }}>
                            {deliveryFee === 0 ? 'ÜCRETSİZ' : `₺${deliveryFee.toFixed(2)}`}
                        </Text>
                    </View>

                    <View className="flex-row justify-between">
                        <Text className="text-lg font-bold" style={{ color: COLORS.dark }}>
                            Toplam
                        </Text>
                        <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>
                            ₺{total.toFixed(2)}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Checkout Button */}
            <View
                className="px-4 py-4 bg-white border-t border-gray-200"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 8,
                }}
            >
                <TouchableOpacity
                    onPress={handleCheckout}
                    className="rounded-xl py-4"
                    style={{ backgroundColor: COLORS.primary }}
                >
                    <Text className="text-white text-center text-lg font-semibold">
                        Siparişi Tamamla (₺{total.toFixed(2)})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Coupon Modal */}
            <Modal
                visible={couponModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setCouponModalVisible(false)}
            >
                <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View className="bg-white rounded-t-3xl" style={{ maxHeight: '80%' }}>
                        {/* Modal Header */}
                        <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
                            <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                                Kupon Kodu
                            </Text>
                            <TouchableOpacity onPress={() => setCouponModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.dark} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="px-6 py-4">
                            {/* Input Section */}
                            <View className="mb-6">
                                <Text className="text-sm mb-2" style={{ color: COLORS.gray }}>
                                    Kupon kodunuzu girerek indirimden yararlanın
                                </Text>

                                <View className="flex-row items-center">
                                    <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 py-3 border border-gray-200 mr-3">
                                        <TextInput
                                            placeholder="Kupon kodunu girin"
                                            value={couponInput}
                                            onChangeText={setCouponInput}
                                            autoCapitalize="characters"
                                            className="flex-1 text-base"
                                            placeholderTextColor={COLORS.gray}
                                            style={{ color: COLORS.dark }}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        onPress={handleApplyCoupon}
                                        disabled={couponLoading}
                                        className="rounded-xl px-6 py-3"
                                        style={{ backgroundColor: COLORS.primary }}
                                    >
                                        {couponLoading ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <Text className="text-white font-semibold">Uygula</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Available Coupons */}
                            {availableCoupons.length > 0 && (
                                <View>
                                    <Text className="text-lg font-semibold mb-3" style={{ color: COLORS.dark }}>
                                        Kullanılabilir Kuponlar
                                    </Text>

                                    {availableCoupons.map((coupon) => {
                                        const isEligible = subtotal >= coupon.min_order_amount;

                                        return (
                                            <TouchableOpacity
                                                key={coupon.id}
                                                onPress={() => handleSelectCoupon(coupon)}
                                                disabled={!isEligible}
                                                className="rounded-2xl p-4 mb-3 border-2"
                                                style={{
                                                    borderColor: isEligible ? COLORS.primary : COLORS.gray + '40',
                                                    backgroundColor: isEligible ? COLORS.primary + '10' : COLORS.gray + '10',
                                                    opacity: isEligible ? 1 : 0.6,
                                                }}
                                            >
                                                <View className="flex-row items-center justify-between">
                                                    <View className="flex-1">
                                                        <View className="flex-row items-center mb-1">
                                                            <View
                                                                className="px-3 py-1 rounded-full mr-2"
                                                                style={{ backgroundColor: COLORS.primary }}
                                                            >
                                                                <Text className="text-white font-bold text-sm">
                                                                    {coupon.code}
                                                                </Text>
                                                            </View>
                                                            <Text className="font-bold" style={{ color: COLORS.dark }}>
                                                                {formatDiscountText(coupon)}
                                                            </Text>
                                                        </View>

                                                        {coupon.min_order_amount > 0 && (
                                                            <Text className="text-sm" style={{ color: COLORS.gray }}>
                                                                Min. sipariş: ₺{coupon.min_order_amount.toFixed(2)}
                                                                {!isEligible && (
                                                                    <Text style={{ color: COLORS.danger }}>
                                                                        {' '}(₺{(coupon.min_order_amount - subtotal).toFixed(2)} daha gerekli)
                                                                    </Text>
                                                                )}
                                                            </Text>
                                                        )}

                                                        {coupon.valid_until && (
                                                            <Text className="text-xs mt-1" style={{ color: COLORS.gray }}>
                                                                Son geçerlilik: {new Date(coupon.valid_until).toLocaleDateString('tr-TR')}
                                                            </Text>
                                                        )}
                                                    </View>

                                                    {isEligible && (
                                                        <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}

                            <View className="h-6" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}