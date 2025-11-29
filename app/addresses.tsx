import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { Address } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { useAddressStore } from '@/store/addressStore';

export default function AddressesScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const {
        addresses,
        loadAddresses,
        refreshAddresses,
        subscribeToAddresses,
        unsubscribeFromAddresses
    } = useAddressStore();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        if (user?.id) {
            subscribeToAddresses(user.id);
        }

        return () => {
            unsubscribeFromAddresses();
        };
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            if (user?.id) {
                refreshAddresses(user.id);
            }
        }, [user])
    );

    const loadData = async () => {
        if (user?.id) {
            await loadAddresses(user.id);
        }
        setLoading(false);
    };

    const handleSetDefault = async (addressId: string) => {
        try {
            await supabase
                .from('addresses')
                .update({ is_default: false })
                .eq('user_id', user?.id);

            await supabase
                .from('addresses')
                .update({ is_default: true })
                .eq('id', addressId);

            if (user?.id) {
                await refreshAddresses(user.id);
            }

            showToast('Varsayılan adres güncellendi', 'success');
        } catch (error) {
            showToast('Adres güncellenemedi', 'error');
        }
    };

    const handleDeleteAddress = (address: Address) => {
        Alert.alert(
            'Adresi Sil',
            `${address.title} adresini silmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await supabase.from('addresses').delete().eq('id', address.id);

                            if (user?.id) {
                                await refreshAddresses(user.id);
                            }

                            showToast('Adres silindi', 'success');
                        } catch (error) {
                            showToast('Adres silinemedi', 'error');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1"style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-200">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                        Adreslerim
                    </Text>
                </View>

                <TouchableOpacity onPress={() => router.push('/add-address')}>
                    <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {addresses.length === 0 ? (
                    <View className="flex-1 items-center justify-center px-8 py-20">
                        <View
                            className="w-32 h-32 rounded-full items-center justify-center mb-6"
                            style={{ backgroundColor: COLORS.primary + '20' }}
                        >
                            <Ionicons name="location-outline" size={64} color={COLORS.primary} />
                        </View>
                        <Text className="text-2xl font-bold mb-2 text-center" style={{ color: COLORS.dark }}>
                            Henüz Adres Yok
                        </Text>
                        <Text className="text-base text-center mb-6" style={{ color: COLORS.gray }}>
                            Sipariş verebilmek için bir teslimat adresi eklemelisiniz.
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.push('/add-address')}
                            className="rounded-xl px-8 py-4"
                            style={{ backgroundColor: COLORS.primary }}
                        >
                            <Text className="text-white text-base font-semibold">Adres Ekle</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="px-4 py-4">
                        {addresses.map((address) => (
                            <View
                                key={address.id}
                                className="bg-white rounded-3xl p-5 mb-4"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 8,
                                    elevation: 3,
                                }}
                            >
                                <View className="flex-row items-start mb-3">
                                    <View
                                        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                        style={{ backgroundColor: COLORS.primary + '20' }}
                                    >
                                        <Ionicons name="location" size={24} color={COLORS.primary} />
                                    </View>

                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-2">
                                            <Text className="text-lg font-bold mr-2" style={{ color: COLORS.dark }}>
                                                {address.title}
                                            </Text>
                                            {address.is_default && (
                                                <View className="px-2 py-1 rounded" style={{ backgroundColor: COLORS.primary }}>
                                                    <Text className="text-white text-xs font-semibold">Varsayılan</Text>
                                                </View>
                                            )}
                                        </View>

                                        <Text className="text-sm mb-1" style={{ color: COLORS.gray }}>
                                            {address.full_address}
                                        </Text>
                                        <Text className="text-sm" style={{ color: COLORS.gray }}>
                                            {address.district}, {address.city}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row">
                                    {!address.is_default && (
                                        <TouchableOpacity
                                            onPress={() => handleSetDefault(address.id)}
                                            className="flex-1 rounded-xl py-3 mr-2 border-2"
                                            style={{ borderColor: COLORS.primary }}
                                        >
                                            <Text className="text-center font-semibold" style={{ color: COLORS.primary }}>
                                                Varsayılan Yap
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        onPress={() => router.push(`/edit-address/${address.id}`)}
                                        className="flex-1 rounded-xl py-3 mx-1"
                                        style={{ backgroundColor: COLORS.primary }}
                                    >
                                        <Text className="text-white text-center font-semibold">Düzenle</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => handleDeleteAddress(address)}
                                        className="w-12 rounded-xl items-center justify-center ml-2"
                                        style={{ backgroundColor: COLORS.danger }}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={COLORS.white} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}