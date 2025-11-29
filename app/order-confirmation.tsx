import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { Address } from '@/lib/types';
import { COLORS, DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, PAYMENT_METHODS } from '@/lib/constants';
import { useAddressStore } from '@/store/addressStore';

export default function OrderConfirmationScreen() {
    const router = useRouter();
    const { items, getTotal, clearCart } = useCartStore();
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const {
        addresses,
        selectedAddress: storeAddress,
        loadAddresses,
        subscribeToAddresses,
        unsubscribeFromAddresses
    } = useAddressStore();
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
    const [selectedDeliveryTime, setSelectedDeliveryTime] = useState('');
    const [loading, setLoading] = useState(false);

    const subtotal = getTotal();
    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const total = subtotal + deliveryFee;

    useEffect(() => {
        if (user?.id) {
            loadAddresses(user.id);
            subscribeToAddresses(user.id);
        }

        return () => {
            unsubscribeFromAddresses();
        };
    }, [user]);

    useEffect(() => {
        if (storeAddress) {
            setSelectedAddress(storeAddress);
        } else if (addresses.length > 0) {
            const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
            setSelectedAddress(defaultAddr);
        }
    }, [addresses, storeAddress]);

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            Alert.alert('Adres Seçin', 'Lütfen teslimat adresi seçin.');
            return;
        }

        if (!selectedDeliveryTime) {
            Alert.alert('Teslimat Saati', 'Lütfen teslimat saati seçin.');
            return;
        }

        setLoading(true);
        try {
            const orderNumber = `DM${Date.now()}`;

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([
                    {
                        user_id: user?.id,
                        order_number: orderNumber,
                        status: 'pending',
                        total_amount: total,
                        delivery_fee: deliveryFee,
                        discount_amount: 0,
                        payment_method: selectedPaymentMethod,
                        delivery_address: selectedAddress,
                        delivery_time: selectedDeliveryTime,
                    },
                ])
                .select()
                .single();

            if (orderError) throw orderError;

            const orderItems = items.map(item => ({
                order_id: orderData.id,
                product_id: item.product.id,
                quantity: item.quantity,
                price: item.product.price,
                discount_price: item.product.discount_price,
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            clearCart();
            showToast('Siparişiniz başarıyla oluşturuldu!', 'success');
            router.replace(`/order-tracking/${orderData.id}`);
        } catch (error: any) {
            console.error('Error placing order:', error);
            showToast(error.message || 'Sipariş oluşturulamadı', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1"style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                </TouchableOpacity>
                <Text className="text-xl font-bold flex-1" style={{ color: COLORS.dark }}>
                    Sipariş Onayı
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {/* Delivery Address */}
                <View className="bg-white px-4 py-4 mb-2">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-lg font-bold" style={{ color: COLORS.dark }}>
                            Teslimat Adresi
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/addresses')}
                            className="flex-row items-center"
                        >
                            <Text style={{ color: COLORS.primary }} className="font-semibold mr-1">
                                Değiştir
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    {selectedAddress ? (
                        <View className="bg-gray-50 rounded-2xl p-4">
                            <View className="flex-row items-start">
                                <View
                                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                    style={{ backgroundColor: COLORS.primary + '20' }}
                                >
                                    <Ionicons name="home" size={24} color={COLORS.primary} />
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row items-center mb-1">
                                        <Text className="text-base font-semibold mr-2" style={{ color: COLORS.dark }}>
                                            {selectedAddress.title}
                                        </Text>
                                        {selectedAddress.is_default && (
                                            <View className="px-2 py-1 rounded" style={{ backgroundColor: COLORS.primary }}>
                                                <Text className="text-white text-xs">Varsayılan</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text className="text-sm mb-1" style={{ color: COLORS.gray }}>
                                        {user?.full_name}
                                    </Text>
                                    <Text className="text-sm mb-1" style={{ color: COLORS.gray }}>
                                        {user?.phone}
                                    </Text>
                                    <Text className="text-sm" style={{ color: COLORS.gray }}>
                                        {selectedAddress.full_address}, {selectedAddress.district}, {selectedAddress.city}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => router.push('/add-address')}
                            className="bg-gray-50 rounded-2xl p-4 flex-row items-center justify-center"
                        >
                            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                            <Text className="ml-2 font-semibold" style={{ color: COLORS.primary }}>
                                Adres Ekle
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Delivery Time */}
                <View className="bg-white px-4 py-4 mb-2">
                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        Teslimat Zamanı
                    </Text>

                    {[
                        { id: 'asap', label: 'En Kısa Sürede', subtitle: '30-45 dakika' },
                        { id: 'morning', label: 'Sabah', subtitle: '09:00 - 12:00' },
                        { id: 'afternoon', label: 'Öğleden Sonra', subtitle: '12:00 - 17:00' },
                        { id: 'evening', label: 'Akşam', subtitle: '17:00 - 21:00' },
                    ].map((time) => (
                        <TouchableOpacity
                            key={time.id}
                            onPress={() => setSelectedDeliveryTime(time.id)}
                            className="flex-row items-center justify-between bg-gray-50 rounded-2xl p-4 mb-2"
                            style={{
                                borderWidth: 2,
                                borderColor: selectedDeliveryTime === time.id ? COLORS.primary : 'transparent',
                            }}
                        >
                            <View className="flex-1">
                                <Text className="text-base font-semibold mb-1" style={{ color: COLORS.dark }}>
                                    {time.label}
                                </Text>
                                <Text className="text-sm" style={{ color: COLORS.gray }}>
                                    {time.subtitle}
                                </Text>
                            </View>
                            <View
                                className="w-6 h-6 rounded-full border-2 items-center justify-center"
                                style={{
                                    borderColor: selectedDeliveryTime === time.id ? COLORS.primary : COLORS.gray,
                                }}
                            >
                                {selectedDeliveryTime === time.id && (
                                    <View className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Payment Method */}
                <View className="bg-white px-4 py-4 mb-2">
                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        Ödeme Yöntemi
                    </Text>

                    {PAYMENT_METHODS.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            onPress={() => setSelectedPaymentMethod(method.id)}
                            className="flex-row items-center justify-between bg-gray-50 rounded-2xl p-4 mb-2"
                            style={{
                                borderWidth: 2,
                                borderColor: selectedPaymentMethod === method.id ? COLORS.primary : 'transparent',
                            }}
                        >
                            <View className="flex-row items-center flex-1">
                                <View
                                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                    style={{ backgroundColor: COLORS.primary + '20' }}
                                >
                                    <Ionicons name={method.icon as any} size={24} color={COLORS.primary} />
                                </View>
                                <Text className="text-base font-semibold" style={{ color: COLORS.dark }}>
                                    {method.label}
                                </Text>
                            </View>
                            <View
                                className="w-6 h-6 rounded-full border-2 items-center justify-center"
                                style={{
                                    borderColor: selectedPaymentMethod === method.id ? COLORS.primary : COLORS.gray,
                                }}
                            >
                                {selectedPaymentMethod === method.id && (
                                    <View className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Order Summary */}
                <View className="bg-white px-4 py-4 mb-2">
                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        Sipariş Özeti
                    </Text>

                    <View className="flex-row justify-between mb-2">
                        <Text style={{ color: COLORS.gray }}>Ürünler ({items.length})</Text>
                        <Text className="font-semibold" style={{ color: COLORS.dark }}>
                            ₺{subtotal.toFixed(2)}
                        </Text>
                    </View>

                    <View className="flex-row justify-between mb-3 pb-3 border-b border-gray-200">
                        <Text style={{ color: COLORS.gray }}>Teslimat Ücreti</Text>
                        <Text
                            className="font-semibold"
                            style={{ color: deliveryFee === 0 ? COLORS.primary : COLORS.dark }}
                        >
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

                {/* Info Box */}
                <View className="mx-4 mb-4 bg-blue-50 rounded-2xl p-4 border border-blue-200">
                    <View className="flex-row">
                        <Ionicons name="information-circle" size={24} color={COLORS.info} />
                        <Text className="flex-1 ml-3 text-sm" style={{ color: COLORS.dark }}>
                            Siparişiniz onaylandıktan sonra kapıda ödeme yapabilirsiniz. Teslimat süresi yaklaşık 30-45 dakikadır.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Place Order Button */}
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
                    onPress={handlePlaceOrder}
                    disabled={loading || !selectedAddress}
                    className="rounded-xl py-4"
                    style={{
                        backgroundColor: COLORS.primary,
                        opacity: loading || !selectedAddress ? 0.5 : 1,
                    }}
                >
                    <Text className="text-white text-center text-lg font-semibold">
                        {loading ? 'Sipariş Oluşturuluyor...' : `Siparişi Onayla (₺${total.toFixed(2)})`}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}