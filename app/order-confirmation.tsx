// app/order-confirmation.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
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
    const [deliveryNote, setDeliveryNote] = useState('');
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

        if (loading) return;

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
                        delivery_note: deliveryNote.trim() || null,
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
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View
                    style={{
                        backgroundColor: '#fff',
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderBottomWidth: 1,
                        borderBottomColor: '#E5E5E5'
                    }}
                >
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ marginRight: 12 }}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: '700', flex: 1, color: COLORS.dark }}>
                        Sipariş Onayı
                    </Text>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Delivery Address */}
                    <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.dark }}>
                                Teslimat Adresi
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push('/addresses')}
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                            >
                                <Text style={{ color: COLORS.primary, fontWeight: '600', marginRight: 4 }}>
                                    Değiştir
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        {selectedAddress ? (
                            <View style={{ backgroundColor: '#F8F9FA', borderRadius: 16, padding: 16 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                    <View
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 12,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 12,
                                            backgroundColor: COLORS.primary + '20'
                                        }}
                                    >
                                        <Ionicons name="home" size={24} color={COLORS.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                            <Text style={{ fontSize: 16, fontWeight: '600', marginRight: 8, color: COLORS.dark }}>
                                                {selectedAddress.title}
                                            </Text>
                                            {selectedAddress.is_default && (
                                                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: COLORS.primary }}>
                                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>Varsayılan</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 2 }}>
                                            {user?.full_name}
                                        </Text>
                                        <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 2 }}>
                                            {user?.phone}
                                        </Text>
                                        <Text style={{ fontSize: 14, color: COLORS.gray }}>
                                            {selectedAddress.full_address}, {selectedAddress.district}, {selectedAddress.city}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() => router.push('/add-address')}
                                style={{
                                    backgroundColor: '#F8F9FA',
                                    borderRadius: 16,
                                    padding: 16,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                                <Text style={{ marginLeft: 8, fontWeight: '600', color: COLORS.primary }}>
                                    Adres Ekle
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Delivery Note */}
                    <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, marginBottom: 8 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.dark, marginBottom: 12 }}>
                            Teslimat Notu
                        </Text>
                        <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 12 }}>
                            Kurye için özel talimatlarınızı yazabilirsiniz (opsiyonel)
                        </Text>
                        <View
                            style={{
                                backgroundColor: '#F8F9FA',
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: '#E5E5E5',
                            }}
                        >
                            <TextInput
                                placeholder="Örn: Kapıda bırakın, zili çalmayın, 3. kat..."
                                placeholderTextColor={COLORS.gray}
                                value={deliveryNote}
                                onChangeText={setDeliveryNote}
                                multiline
                                numberOfLines={4}
                                maxLength={500}
                                style={{
                                    padding: 16,
                                    fontSize: 15,
                                    color: COLORS.dark,
                                    minHeight: 100,
                                    textAlignVertical: 'top',
                                }}
                            />
                        </View>
                        <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 8, textAlign: 'right' }}>
                            {deliveryNote.length}/500
                        </Text>
                    </View>

                    {/* Payment Method */}
                    <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, marginBottom: 8 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.dark, marginBottom: 12 }}>
                            Ödeme Yöntemi
                        </Text>

                        {PAYMENT_METHODS.map((method) => {
                            const isSelected = selectedPaymentMethod === method.id;
                            return (
                                <TouchableOpacity
                                    key={method.id}
                                    onPress={() => setSelectedPaymentMethod(method.id)}
                                    activeOpacity={0.7}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        backgroundColor: '#F8F9FA',
                                        borderRadius: 16,
                                        padding: 16,
                                        marginBottom: 8,
                                        borderWidth: 2,
                                        borderColor: isSelected ? COLORS.primary : 'transparent',
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View
                                            style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 12,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: 12,
                                                backgroundColor: isSelected ? COLORS.primary + '20' : '#E5E5E5'
                                            }}
                                        >
                                            <Ionicons
                                                name={method.icon as any}
                                                size={24}
                                                color={isSelected ? COLORS.primary : COLORS.gray}
                                            />
                                        </View>
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                fontWeight: '600',
                                                color: COLORS.dark
                                            }}
                                        >
                                            {method.label}
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 12,
                                            borderWidth: 2,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderColor: isSelected ? COLORS.primary : COLORS.gray,
                                        }}
                                    >
                                        {isSelected && (
                                            <View
                                                style={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: 6,
                                                    backgroundColor: COLORS.primary
                                                }}
                                            />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Order Summary */}
                    <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, marginBottom: 8 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.dark, marginBottom: 12 }}>
                            Sipariş Özeti
                        </Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={{ color: COLORS.gray, fontSize: 15 }}>Ürünler ({items.length})</Text>
                            <Text style={{ fontWeight: '600', color: COLORS.dark, fontSize: 15 }}>
                                ₺{subtotal.toFixed(2)}
                            </Text>
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginBottom: 12,
                                paddingBottom: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: '#E5E5E5'
                            }}
                        >
                            <Text style={{ color: COLORS.gray, fontSize: 15 }}>Teslimat Ücreti</Text>
                            <Text
                                style={{
                                    fontWeight: '600',
                                    color: deliveryFee === 0 ? COLORS.primary : COLORS.dark,
                                    fontSize: 15
                                }}
                            >
                                {deliveryFee === 0 ? 'ÜCRETSİZ' : `₺${deliveryFee.toFixed(2)}`}
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.dark }}>
                                Toplam
                            </Text>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.primary }}>
                                ₺{total.toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    {/* Info Box */}
                    <View
                        style={{
                            marginHorizontal: 16,
                            marginBottom: 16,
                            backgroundColor: '#EBF5FF',
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: '#BFDBFE'
                        }}
                    >
                        <View style={{ flexDirection: 'row' }}>
                            <Ionicons name="information-circle" size={24} color={COLORS.info} />
                            <Text style={{ flex: 1, marginLeft: 12, fontSize: 14, color: COLORS.dark, lineHeight: 20 }}>
                                Siparişiniz onaylandıktan sonra kapıda ödeme yapabilirsiniz. Teslimat süresi yaklaşık 30-45 dakikadır.
                            </Text>
                        </View>
                    </View>

                    {/* Bottom spacing */}
                    <View style={{ height: 20 }} />
                </ScrollView>

                {/* Place Order Button */}
                <View
                    style={{
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        backgroundColor: '#fff',
                        borderTopWidth: 1,
                        borderTopColor: '#E5E5E5',
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
                        activeOpacity={0.8}
                        style={{
                            borderRadius: 14,
                            paddingVertical: 16,
                            backgroundColor: (!selectedAddress) ? '#CCCCCC' : COLORS.primary,
                        }}
                    >
                        {loading ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>
                                    Sipariş Oluşturuluyor...
                                </Text>
                            </View>
                        ) : (
                            <Text style={{ color: '#fff', textAlign: 'center', fontSize: 17, fontWeight: '600' }}>
                                Siparişi Onayla (₺{total.toFixed(2)})
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}