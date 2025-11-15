import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import { COLORS, ORDER_STATUS_LABELS } from '@/lib/constants';

const ORDER_STEPS = [
    { id: 'pending', label: 'Sipariş Alındı', icon: 'checkmark-circle' },
    { id: 'processing', label: 'Hazırlanıyor', icon: 'restaurant' },
    { id: 'preparing', label: 'Paketleniyor', icon: 'cube' },
    { id: 'on_delivery', label: 'Yolda', icon: 'bicycle' },
    { id: 'delivered', label: 'Teslim Edildi', icon: 'checkmark-done-circle' },
];

export default function OrderTrackingScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        loadOrder();

        // Polling for free tier (her 30 saniyede bir güncelle)
        pollingInterval.current = setInterval(() => {
            loadOrder();
        }, 30000); // 30 saniye

        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
            }
        };
    }, [id]);

    const loadOrder = async () => {
        try {
            const { data } = await supabase
                .from('orders')
                .select('*, items:order_items(*, product:products(*))')
                .eq('id', id)
                .single();

            if (data) setOrder(data);
        } catch (error) {
            console.error('Error loading order:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStepIndex = (status: string) => {
        return ORDER_STEPS.findIndex(step => step.id === status);
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!order) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.background }}>
                <Text>Sipariş bulunamadı</Text>
            </View>
        );
    }

    const currentStepIndex = getStepIndex(order.status);
    const isDelivered = order.status === 'delivered';

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                </TouchableOpacity>
                <Text className="text-xl font-bold flex-1" style={{ color: COLORS.dark }}>
                    Sipariş Takibi
                </Text>
                {/* Refresh Button */}
                <TouchableOpacity onPress={loadOrder} className="ml-3">
                    <Ionicons name="refresh" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Success/Status Card */}
                <LinearGradient
                    colors={isDelivered ? [COLORS.primary, COLORS.secondary] : ['#E3F2FD', '#BBDEFB']}
                    className="mx-4 mt-4 rounded-3xl p-6 items-center"
                >
                    <View
                        className="w-24 h-24 rounded-full items-center justify-center mb-4"
                        style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                    >
                        <Ionicons
                            name={isDelivered ? 'checkmark-done-circle' : 'time'}
                            size={64}
                            color={COLORS.white}
                        />
                    </View>

                    <Text className="text-white text-2xl font-bold mb-2 text-center">
                        {isDelivered ? 'Teslim Edildi!' : ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                    </Text>

                    <Text className="text-white text-center mb-4">
                        {isDelivered
                            ? 'Siparişiniz teslim edildi. Afiyet olsun!'
                            : 'Siparişiniz hazırlanıyor ve en kısa sürede kapınızda olacak!'}
                    </Text>

                    <View className="bg-white/20 rounded-2xl px-6 py-3">
                        <Text className="text-white text-center">
                            Sipariş No: <Text className="font-bold">{order.order_number}</Text>
                        </Text>
                    </View>
                </LinearGradient>

                {/* Auto refresh info for free tier */}
                <View className="mx-4 mt-3 bg-blue-50 rounded-2xl p-3 border border-blue-200">
                    <View className="flex-row items-center">
                        <Ionicons name="information-circle" size={20} color={COLORS.info} />
                        <Text className="flex-1 ml-2 text-xs" style={{ color: COLORS.dark }}>
                            Sipariş durumu otomatik olarak 30 saniyede bir güncellenir
                        </Text>
                    </View>
                </View>

                {/* Order Timeline */}
                <View className="bg-white mx-4 mt-4 rounded-3xl p-6">
                    <Text className="text-xl font-bold mb-6" style={{ color: COLORS.dark }}>
                        Sipariş Durumu
                    </Text>

                    {ORDER_STEPS.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isActive = index === currentStepIndex;

                        return (
                            <View key={step.id} className="flex-row">
                                <View className="items-center mr-4">
                                    <View
                                        className="w-12 h-12 rounded-full items-center justify-center"
                                        style={{
                                            backgroundColor: isCompleted ? COLORS.primary : COLORS.gray + '30',
                                        }}
                                    >
                                        <Ionicons
                                            name={step.icon as any}
                                            size={24}
                                            color={isCompleted ? COLORS.white : COLORS.gray}
                                        />
                                    </View>
                                    {index < ORDER_STEPS.length - 1 && (
                                        <View
                                            className="w-1 flex-1 my-1"
                                            style={{
                                                backgroundColor: isCompleted ? COLORS.primary : COLORS.gray + '30',
                                                minHeight: 40,
                                            }}
                                        />
                                    )}
                                </View>

                                <View className="flex-1 pb-6">
                                    <Text
                                        className="text-base font-semibold mb-1"
                                        style={{
                                            color: isCompleted ? COLORS.dark : COLORS.gray,
                                        }}
                                    >
                                        {step.label}
                                    </Text>
                                    {isActive && (
                                        <Text className="text-sm" style={{ color: COLORS.gray }}>
                                            {new Date(order.updated_at).toLocaleString('tr-TR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Delivery Info */}
                <View className="bg-white mx-4 mt-4 rounded-3xl p-6">
                    <Text className="text-xl font-bold mb-4" style={{ color: COLORS.dark }}>
                        Teslimat Bilgileri
                    </Text>

                    <View className="flex-row items-start mb-4">
                        <View
                            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                            style={{ backgroundColor: COLORS.primary + '20' }}
                        >
                            <Ionicons name="location" size={24} color={COLORS.primary} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-sm mb-1" style={{ color: COLORS.gray }}>
                                Teslimat Adresi
                            </Text>
                            <Text className="text-base font-semibold" style={{ color: COLORS.dark }}>
                                {order.delivery_address.title}
                            </Text>
                            <Text className="text-sm" style={{ color: COLORS.gray }}>
                                {order.delivery_address.full_address}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-center mb-4">
                        <View
                            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                            style={{ backgroundColor: COLORS.primary + '20' }}
                        >
                            <Ionicons name="card" size={24} color={COLORS.primary} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-sm mb-1" style={{ color: COLORS.gray }}>
                                Ödeme Yöntemi
                            </Text>
                            <Text className="text-base font-semibold" style={{ color: COLORS.dark }}>
                                {order.payment_method === 'cash' ? 'Kapıda Nakit' : 'Kapıda Kredi Kartı'}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-center">
                        <View
                            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                            style={{ backgroundColor: COLORS.primary + '20' }}
                        >
                            <Ionicons name="cash" size={24} color={COLORS.primary} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-sm mb-1" style={{ color: COLORS.gray }}>
                                Toplam Tutar
                            </Text>
                            <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>
                                ₺{order.total_amount.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Order Items */}
                <View className="bg-white mx-4 mt-4 mb-4 rounded-3xl p-6">
                    <Text className="text-xl font-bold mb-4" style={{ color: COLORS.dark }}>
                        Sipariş Detayları ({order.items.length} Ürün)
                    </Text>

                    {order.items.map((item) => (
                        <View key={item.id} className="flex-row items-center mb-3 pb-3 border-b border-gray-200">
                            <View className="flex-1">
                                <Text className="text-base font-semibold mb-1" style={{ color: COLORS.dark }}>
                                    {item.product.name}
                                </Text>
                                <Text className="text-sm" style={{ color: COLORS.gray }}>
                                    {item.quantity} adet × ₺{(item.discount_price || item.price).toFixed(2)}
                                </Text>
                            </View>
                            <Text className="text-base font-bold" style={{ color: COLORS.primary }}>
                                ₺{((item.discount_price || item.price) * item.quantity).toFixed(2)}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            {isDelivered && (
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
                    <View className="flex-row">
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)')}
                            className="flex-1 rounded-xl py-4 mr-2 border-2"
                            style={{ borderColor: COLORS.primary }}
                        >
                            <Text className="text-center font-semibold" style={{ color: COLORS.primary }}>
                                Ana Sayfa
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push(`/reviews/${order.items[0].product_id}`)}
                            className="flex-1 rounded-xl py-4 ml-2"
                            style={{ backgroundColor: COLORS.primary }}
                        >
                            <Text className="text-white text-center font-semibold">
                                Değerlendir
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}