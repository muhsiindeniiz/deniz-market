import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAddressStore } from '@/store/addressStore';
import { useToast } from '@/hooks/useToast';
import { COLORS } from '@/lib/constants';

export default function AddAddressScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { refreshAddresses } = useAddressStore();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        full_address: '',
        city: '',
        district: '',
        postal_code: '',
        is_default: false,
    });

    const handleSave = async () => {
        if (!formData.title || !formData.full_address || !formData.city || !formData.district) {
            showToast('Lütfen tüm zorunlu alanları doldurun', 'warning');
            return;
        }

        setLoading(true);
        try {
            // If this is the first address or marked as default, set others to non-default
            if (formData.is_default) {
                await supabase
                    .from('addresses')
                    .update({ is_default: false })
                    .eq('user_id', user?.id);
            }

            const { error } = await supabase.from('addresses').insert([
                {
                    ...formData,
                    user_id: user?.id,
                },
            ]);

            if (error) throw error;

            // Adresleri yeniden yükle
            if (user?.id) {
                await refreshAddresses(user.id);
            }

            showToast('Adres başarıyla eklendi', 'success');
            router.back();
        } catch (error: any) {
            showToast(error.message || 'Adres eklenemedi', 'error');
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
                    Yeni Adres Ekle
                </Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    <View className="p-4">
                        {/* Form fields - aynı kalacak */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                Adres Başlığı *
                            </Text>
                            <TextInput
                                placeholder="Ev, İş, vb."
                                value={formData.title}
                                onChangeText={(text) => setFormData({ ...formData, title: text })}
                                className="bg-white rounded-xl px-4 py-3 text-base border border-gray-200"
                                placeholderTextColor={COLORS.gray}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                Tam Adres *
                            </Text>
                            <TextInput
                                placeholder="Sokak, Mahalle, Bina No, Daire No"
                                value={formData.full_address}
                                onChangeText={(text) => setFormData({ ...formData, full_address: text })}
                                className="bg-white rounded-xl px-4 py-3 text-base border border-gray-200"
                                placeholderTextColor={COLORS.gray}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                Şehir *
                            </Text>
                            <TextInput
                                placeholder="İstanbul"
                                value={formData.city}
                                onChangeText={(text) => setFormData({ ...formData, city: text })}
                                className="bg-white rounded-xl px-4 py-3 text-base border border-gray-200"
                                placeholderTextColor={COLORS.gray}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                İlçe *
                            </Text>
                            <TextInput
                                placeholder="Kadıköy"
                                value={formData.district}
                                onChangeText={(text) => setFormData({ ...formData, district: text })}
                                className="bg-white rounded-xl px-4 py-3 text-base border border-gray-200"
                                placeholderTextColor={COLORS.gray}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                Posta Kodu
                            </Text>
                            <TextInput
                                placeholder="34000"
                                value={formData.postal_code}
                                onChangeText={(text) => setFormData({ ...formData, postal_code: text })}
                                keyboardType="number-pad"
                                className="bg-white rounded-xl px-4 py-3 text-base border border-gray-200"
                                placeholderTextColor={COLORS.gray}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={() => setFormData({ ...formData, is_default: !formData.is_default })}
                            className="bg-white rounded-xl p-4 flex-row items-center justify-between mb-6"
                        >
                            <Text className="text-base font-semibold" style={{ color: COLORS.dark }}>
                                Varsayılan adres olarak ayarla
                            </Text>
                            <View
                                className="w-12 h-6 rounded-full justify-center"
                                style={{ backgroundColor: formData.is_default ? COLORS.primary : COLORS.gray + '40' }}
                            >
                                <View
                                    className="w-5 h-5 rounded-full bg-white"
                                    style={{
                                        marginLeft: formData.is_default ? 26 : 2,
                                    }}
                                />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={loading}
                            className="rounded-xl py-4 mb-6"
                            style={{
                                backgroundColor: COLORS.primary,
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            <Text className="text-white text-center text-lg font-semibold">
                                {loading ? 'Kaydediliyor...' : 'Adresi Kaydet'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}