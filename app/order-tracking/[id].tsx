import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Platform,
    Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import { COLORS, ORDER_STATUS_LABELS } from '@/lib/constants';

const { width } = Dimensions.get('window');

const ORDER_STEPS = [
    { id: 'pending', label: 'Sipariş Alındı', icon: 'checkmark-circle', color: '#10B981' },
    { id: 'processing', label: 'Hazırlanıyor', icon: 'restaurant', color: '#F59E0B' },
    { id: 'preparing', label: 'Paketleniyor', icon: 'cube', color: '#3B82F6' },
    { id: 'on_delivery', label: 'Yolda', icon: 'bicycle', color: '#8B5CF6' },
    { id: 'delivered', label: 'Teslim Edildi', icon: 'checkmark-done-circle', color: '#10B981' },
];

// Skeleton Components
const SkeletonBox = ({ width, height, borderRadius = 8, style }: any) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    backgroundColor: '#E5E7EB',
                    borderRadius,
                    opacity,
                },
                style,
            ]}
        />
    );
};

const SkeletonCircle = ({ size, style }: any) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width: size,
                    height: size,
                    backgroundColor: '#E5E7EB',
                    borderRadius: size / 2,
                    opacity,
                },
                style,
            ]}
        />
    );
};

const StatusCardSkeleton = () => {
    return (
        <View className="px-4 pt-6">
            <View
                style={{
                    borderRadius: 24,
                    padding: 32,
                    backgroundColor: '#F3F4F6',
                }}
            >
                <View className="items-center">
                    <SkeletonCircle size={96} style={{ marginBottom: 24 }} />
                    <SkeletonBox width={200} height={32} borderRadius={16} style={{ marginBottom: 12 }} />
                    <SkeletonBox width={250} height={20} borderRadius={10} />
                </View>
            </View>
        </View>
    );
};

const TimelineSkeleton = () => {
    return (
        <View className="px-4 mt-6">
            <View
                className="rounded-3xl p-6"
                style={{
                    backgroundColor: COLORS.white,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 4,
                }}
            >
                <SkeletonBox width={150} height={24} borderRadius={12} style={{ marginBottom: 24 }} />

                {[1, 2, 3, 4, 5].map((item, index) => (
                    <View key={item} className="flex-row mb-6">
                        <View className="items-center mr-4" style={{ width: 48 }}>
                            <SkeletonBox width={48} height={48} borderRadius={12} />
                            {index < 4 && (
                                <SkeletonBox
                                    width={2}
                                    height={40}
                                    borderRadius={0}
                                    style={{ marginVertical: 8 }}
                                />
                            )}
                        </View>
                        <View className="flex-1">
                            <SkeletonBox width={120} height={20} borderRadius={10} style={{ marginBottom: 8 }} />
                            <SkeletonBox width={80} height={14} borderRadius={7} />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const DeliveryInfoSkeleton = () => {
    return (
        <View className="px-4 mt-6">
            <View
                className="rounded-3xl p-6"
                style={{
                    backgroundColor: COLORS.white,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 4,
                }}
            >
                <SkeletonBox width={180} height={24} borderRadius={12} style={{ marginBottom: 24 }} />

                {[1, 2, 3].map((item) => (
                    <View key={item} className="flex-row items-start mb-5">
                        <SkeletonBox width={48} height={48} borderRadius={12} style={{ marginRight: 12 }} />
                        <View className="flex-1">
                            <SkeletonBox width={60} height={12} borderRadius={6} style={{ marginBottom: 8 }} />
                            <SkeletonBox width="80%" height={18} borderRadius={9} style={{ marginBottom: 6 }} />
                            <SkeletonBox width="60%" height={14} borderRadius={7} />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const OrderItemsSkeleton = () => {
    return (
        <View className="px-4 mt-6 mb-6">
            <View
                className="rounded-3xl p-6"
                style={{
                    backgroundColor: COLORS.white,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 4,
                }}
            >
                <SkeletonBox width={200} height={24} borderRadius={12} style={{ marginBottom: 24 }} />

                {[1, 2, 3].map((item, idx) => (
                    <View
                        key={item}
                        className="flex-row items-center py-4"
                        style={{
                            borderBottomWidth: idx !== 2 ? 1 : 0,
                            borderBottomColor: '#F3F4F6',
                        }}
                    >
                        <SkeletonBox width={48} height={48} borderRadius={12} style={{ marginRight: 12 }} />
                        <View className="flex-1">
                            <SkeletonBox width="70%" height={18} borderRadius={9} style={{ marginBottom: 6 }} />
                            <SkeletonBox width="40%" height={14} borderRadius={7} />
                        </View>
                        <SkeletonBox width={60} height={20} borderRadius={10} />
                    </View>
                ))}
            </View>
        </View>
    );
};

export default function OrderTrackingScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        console.log('Order ID:', id);

        if (!id) {
            setError('Sipariş ID bulunamadı');
            setLoading(false);
            return;
        }

        loadOrder();

        // Auto-refresh every 30 seconds
        pollingInterval.current = setInterval(() => {
            loadOrder(true);
        }, 30000);

        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
            }
        };
    }, [id]);

    const loadOrder = async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true);
                setError(null);
            }

            console.log('Loading order with ID:', id);

            const { data, error: fetchError } = await supabase
                .from('orders')
                .select(`
                    *,
                    items:order_items(
                        *,
                        product:products(*)
                    )
                `)
                .eq('id', id)
                .single();

            console.log('Supabase response:', { data, error: fetchError });

            if (fetchError) {
                console.error('Supabase error:', fetchError);
                setError(fetchError.message);
                return;
            }

            if (data) {
                console.log('Order loaded successfully:', data);
                setOrder(data);
                setError(null);
            } else {
                setError('Sipariş bulunamadı');
            }
        } catch (err) {
            console.error('Catch error:', err);
            setError('Bir hata oluştu');
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const getStepIndex = (status: string) => {
        return ORDER_STEPS.findIndex((step) => step.id === status);
    };

    // Loading State with Skeleton
    if (loading) {
        return (
            <SafeAreaView className="flex-1"style={{ backgroundColor: COLORS.background }}>
                <View
                    className="bg-white px-4 py-4 flex-row items-center"
                    style={{
                        borderBottomWidth: 1,
                        borderBottomColor: '#F3F4F6',
                    }}
                >
                    <TouchableOpacity onPress={() => router.back()} className="mr-3" activeOpacity={0.7}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                            Sipariş Takibi
                        </Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    <StatusCardSkeleton />
                    <TimelineSkeleton />
                    <DeliveryInfoSkeleton />
                    <OrderItemsSkeleton />
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Error State
    if (error || !order) {
        return (
            <SafeAreaView className="flex-1"style={{ backgroundColor: COLORS.background }}>
                <View
                    className="bg-white px-4 py-4 flex-row items-center"
                    style={{
                        borderBottomWidth: 1,
                        borderBottomColor: '#F3F4F6',
                    }}
                >
                    <TouchableOpacity onPress={() => router.back()} className="mr-3" activeOpacity={0.7}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                            Sipariş Takibi
                        </Text>
                    </View>
                </View>
                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons name="alert-circle-outline" size={80} color={COLORS.gray} />
                    <Text className="mt-4 text-xl font-bold text-center" style={{ color: COLORS.dark }}>
                        {error || 'Sipariş Bulunamadı'}
                    </Text>
                    <Text className="mt-2 text-center" style={{ color: COLORS.gray }}>
                        Sipariş ID: {id || '—'}
                    </Text>
                    <TouchableOpacity
                        onPress={() => loadOrder()}
                        className="mt-6 px-8 py-4 rounded-2xl"
                        style={{ backgroundColor: COLORS.primary }}
                        activeOpacity={0.8}
                    >
                        <Text className="text-white font-semibold text-base">Tekrar Dene</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mt-4 px-8 py-4 rounded-2xl"
                        style={{ borderWidth: 2, borderColor: COLORS.primary }}
                        activeOpacity={0.8}
                    >
                        <Text className="font-semibold text-base" style={{ color: COLORS.primary }}>
                            Geri Dön
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const currentStepIndex = getStepIndex(order.status);
    const isDelivered = order.status === 'delivered';
    const currentStep = ORDER_STEPS[currentStepIndex] || ORDER_STEPS[0];

    // Main Content
    return (
        <SafeAreaView className="flex-1"style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View
                className="bg-white px-4 py-4 flex-row items-center"
                style={{
                    borderBottomWidth: 1,
                    borderBottomColor: '#F3F4F6',
                }}
            >
                <TouchableOpacity onPress={() => router.back()} className="mr-3" activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                        Sipariş Takibi
                    </Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View>
                    {/* Status Card */}
                    <View className="px-4 pt-6">
                        <LinearGradient
                            colors={
                                isDelivered
                                    ? ['#10B981', '#059669']
                                    : [currentStep.color || COLORS.primary, COLORS.primary]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                borderRadius: 24,
                                padding: 32,
                                shadowColor: isDelivered ? '#10B981' : COLORS.primary,
                                shadowOffset: { width: 0, height: 8 },
                                shadowOpacity: 0.3,
                                shadowRadius: 16,
                                elevation: 12,
                            }}
                        >
                            <View className="items-center">
                                <View
                                    className="w-24 h-24 rounded-full items-center justify-center mb-6"
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.25)',
                                    }}
                                >
                                    <Ionicons
                                        name={
                                            isDelivered
                                                ? 'checkmark-done-circle'
                                                : (currentStep.icon as any) || 'time'
                                        }
                                        size={64}
                                        color={COLORS.white}
                                    />
                                </View>

                                <Text className="text-white text-3xl font-bold mb-3 text-center">
                                    {isDelivered
                                        ? 'Teslim Edildi!'
                                        : ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ??
                                        'Bilinmeyen Durum'}
                                </Text>

                                <Text className="text-white/90 text-center text-base leading-6 px-4">
                                    {isDelivered
                                        ? 'Siparişiniz başarıyla teslim edildi. Afiyet olsun!'
                                        : currentStep.label}
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Timeline */}
                    <View className="px-4 mt-6">
                        <View
                            className="rounded-3xl p-6"
                            style={{
                                backgroundColor: COLORS.white,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.06,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            <Text className="text-xl font-bold mb-6" style={{ color: COLORS.dark }}>
                                Sipariş Durumu
                            </Text>

                            {ORDER_STEPS.map((step, index) => {
                                const isCompleted = index <= currentStepIndex;
                                const isActive = index === currentStepIndex;
                                const isLast = index === ORDER_STEPS.length - 1;

                                return (
                                    <View key={step.id} className="flex-row">
                                        {/* Timeline indicator */}
                                        <View className="items-center mr-4" style={{ width: 48 }}>
                                            <View
                                                className="w-12 h-12 rounded-xl items-center justify-center"
                                                style={{
                                                    backgroundColor: isCompleted ? step.color : '#F3F4F6',
                                                }}
                                            >
                                                <Ionicons
                                                    name={step.icon as any}
                                                    size={24}
                                                    color={isCompleted ? COLORS.white : '#9CA3AF'}
                                                />
                                            </View>

                                            {!isLast && (
                                                <View
                                                    className="my-2"
                                                    style={{
                                                        width: 2,
                                                        height: 40,
                                                        backgroundColor: isCompleted ? step.color : '#E5E7EB',
                                                    }}
                                                />
                                            )}
                                        </View>

                                        {/* Content */}
                                        <View className="flex-1 pb-6">
                                            <Text
                                                className="text-lg font-bold mb-1"
                                                style={{
                                                    color: isCompleted ? COLORS.dark : '#9CA3AF',
                                                }}
                                            >
                                                {step.label}
                                            </Text>

                                            {isActive && order.updated_at && (
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
                    </View>

                    {/* Delivery Info */}
                    <View className="px-4 mt-6">
                        <View
                            className="rounded-3xl p-6"
                            style={{
                                backgroundColor: COLORS.white,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.06,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            <Text className="text-xl font-bold mb-6" style={{ color: COLORS.dark }}>
                                Teslimat Bilgileri
                            </Text>

                            {/* Address */}
                            <View className="flex-row items-start mb-5">
                                <View
                                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                    style={{ backgroundColor: COLORS.primary + '15' }}
                                >
                                    <Ionicons name="location" size={24} color={COLORS.primary} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs mb-1" style={{ color: COLORS.gray }}>
                                        Adres
                                    </Text>
                                    <Text className="text-base font-bold mb-1" style={{ color: COLORS.dark }}>
                                        {order.delivery_address?.title || '—'}
                                    </Text>
                                    <Text className="text-sm" style={{ color: COLORS.gray }}>
                                        {order.delivery_address?.full_address || '—'}
                                    </Text>
                                </View>
                            </View>

                            {/* Payment */}
                            <View className="flex-row items-center mb-5">
                                <View
                                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                    style={{ backgroundColor: COLORS.primary + '15' }}
                                >
                                    <Ionicons name="card" size={24} color={COLORS.primary} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs mb-1" style={{ color: COLORS.gray }}>
                                        Ödeme
                                    </Text>
                                    <Text className="text-base font-bold" style={{ color: COLORS.dark }}>
                                        {order.payment_method === 'cash' ? 'Kapıda Nakit' : 'Kapıda Kredi Kartı'}
                                    </Text>
                                </View>
                            </View>

                            {/* Total */}
                            <View
                                className="flex-row items-center pt-5"
                                style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6' }}
                            >
                                <View
                                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                    style={{ backgroundColor: COLORS.primary + '15' }}
                                >
                                    <Ionicons name="cash" size={24} color={COLORS.primary} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs mb-1" style={{ color: COLORS.gray }}>
                                        Toplam
                                    </Text>
                                    <Text className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                                        ₺{(order.total_amount ?? 0).toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                        <View className="px-4 mt-6 mb-6">
                            <View
                                className="rounded-3xl p-6"
                                style={{
                                    backgroundColor: COLORS.white,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.06,
                                    shadowRadius: 8,
                                    elevation: 4,
                                }}
                            >
                                <Text className="text-xl font-bold mb-6" style={{ color: COLORS.dark }}>
                                    Sipariş Detayları ({order.items.length} Ürün)
                                </Text>

                                {order.items.map((item, idx) => {
                                    const price = item.discount_price ?? item.price ?? 0;
                                    const totalItemPrice = price * (item.quantity ?? 1);

                                    return (
                                        <View
                                            key={item.id}
                                            className="flex-row items-center py-4"
                                            style={{
                                                borderBottomWidth: idx !== order.items.length - 1 ? 1 : 0,
                                                borderBottomColor: '#F3F4F6',
                                            }}
                                        >
                                            <View
                                                className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                                style={{ backgroundColor: COLORS.primary + '15' }}
                                            >
                                                <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>
                                                    {item.quantity ?? 1}
                                                </Text>
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-base font-bold mb-1" style={{ color: COLORS.dark }}>
                                                    {item.product?.name || 'Ürün Bilgisi Yok'}
                                                </Text>
                                                <Text className="text-sm" style={{ color: COLORS.gray }}>
                                                    ₺{price.toFixed(2)} / adet
                                                </Text>
                                            </View>
                                            <Text className="text-lg font-bold" style={{ color: COLORS.dark }}>
                                                ₺{totalItemPrice.toFixed(2)}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Buttons */}
            {isDelivered && order.items && order.items.length > 0 && (
                <View
                    style={{
                        backgroundColor: COLORS.white,
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        paddingBottom: Platform.OS === 'ios' ? 20 : 16,
                        borderTopWidth: 1,
                        borderTopColor: '#F3F4F6',
                    }}
                >
                    <View className="flex-row">
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)')}
                            className="flex-1 mr-2 rounded-2xl py-4 items-center justify-center"
                            style={{
                                borderWidth: 2,
                                borderColor: COLORS.primary,
                            }}
                            activeOpacity={0.8}
                        >
                            <Text className="font-bold text-base" style={{ color: COLORS.primary }}>
                                Ana Sayfa
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                const firstProductId = order.items[0]?.product_id;
                                if (firstProductId) {
                                    router.push(`/reviews/${firstProductId}`);
                                } else {
                                    alert('Değerlendirilecek ürün bulunamadı.');
                                }
                            }}
                            className="flex-1 ml-2 rounded-2xl py-4 items-center justify-center"
                            style={{
                                backgroundColor: COLORS.primary,
                            }}
                            activeOpacity={0.8}
                        >
                            <Text className="text-white font-bold text-base">Değerlendir</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}