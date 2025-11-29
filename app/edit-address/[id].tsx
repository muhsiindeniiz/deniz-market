import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAddressStore } from '@/store/addressStore';
import { useToast } from '@/hooks/useToast';
import { Address } from '@/lib/types';
import { COLORS } from '@/lib/constants';

export default function EditAddressScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuthStore();
    const { refreshAddresses } = useAddressStore();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        full_address: '',
        city: '',
        district: '',
        postal_code: '',
        is_default: false,
    });

    useEffect(() => {
        if (id) {
            loadAddress();
        }
    }, [id]);

    const loadAddress = async () => {
        try {
            setInitialLoading(true);
            const { data, error } = await supabase
                .from('addresses')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                setFormData({
                    title: data.title || '',
                    full_address: data.full_address || '',
                    city: data.city || '',
                    district: data.district || '',
                    postal_code: data.postal_code || '',
                    is_default: data.is_default || false,
                });
            }
        } catch (error: any) {
            console.error('Error loading address:', error);
            showToast('Adres yüklenemedi', 'error');
            router.back();
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.full_address || !formData.city || !formData.district) {
            showToast('Lütfen tüm zorunlu alanları doldurun', 'warning');
            return;
        }

        setLoading(true);
        try {
            if (formData.is_default) {
                await supabase
                    .from('addresses')
                    .update({ is_default: false })
                    .eq('user_id', user?.id)
                    .neq('id', id);
            }

            const { error } = await supabase
                .from('addresses')
                .update({
                    title: formData.title,
                    full_address: formData.full_address,
                    city: formData.city,
                    district: formData.district,
                    postal_code: formData.postal_code,
                    is_default: formData.is_default,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) throw error;

            if (user?.id) {
                await refreshAddresses(user.id);
            }

            showToast('Adres başarıyla güncellendi', 'success');
            router.back();
        } catch (error: any) {
            console.error('Error updating address:', error);
            showToast(error.message || 'Adres güncellenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
                <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-200">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold flex-1" style={{ color: COLORS.dark }}>
                        Adresi Düzenle
                    </Text>
                </View>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text className="mt-4 text-base" style={{ color: COLORS.gray }}>
                        Adres yükleniyor...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                </TouchableOpacity>
                <Text className="text-xl font-bold flex-1" style={{ color: COLORS.dark }}>
                    Adresi Düzenle
                </Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    <View className="p-4">
                        {/* Address Title */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                Adres Başlığı *
                            </Text>
                            <TextInput
                                placeholder="Ev, İş, vb."
                                value={formData.title}
                                onChangeText={(text) => setFormData({ ...formData, title: text })}
                                className="bg-white rounded-xl border border-gray-200"
                                style={styles.input}
                                placeholderTextColor={COLORS.gray}
                            />
                        </View>

                        {/* Full Address */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                Tam Adres *
                            </Text>
                            <TextInput
                                placeholder="Sokak, Mahalle, Bina No, Daire No"
                                value={formData.full_address}
                                onChangeText={(text) => setFormData({ ...formData, full_address: text })}
                                className="bg-white rounded-xl border border-gray-200"
                                style={styles.multilineInput}
                                placeholderTextColor={COLORS.gray}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* City */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                Şehir *
                            </Text>
                            <TextInput
                                placeholder="İstanbul"
                                value={formData.city}
                                onChangeText={(text) => setFormData({ ...formData, city: text })}
                                className="bg-white rounded-xl border border-gray-200"
                                style={styles.input}
                                placeholderTextColor={COLORS.gray}
                            />
                        </View>

                        {/* District */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                İlçe *
                            </Text>
                            <TextInput
                                placeholder="Kadıköy"
                                value={formData.district}
                                onChangeText={(text) => setFormData({ ...formData, district: text })}
                                className="bg-white rounded-xl border border-gray-200"
                                style={styles.input}
                                placeholderTextColor={COLORS.gray}
                            />
                        </View>

                        {/* Postal Code */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                Posta Kodu
                            </Text>
                            <TextInput
                                placeholder="34000"
                                value={formData.postal_code}
                                onChangeText={(text) => setFormData({ ...formData, postal_code: text })}
                                keyboardType="number-pad"
                                className="bg-white rounded-xl border border-gray-200"
                                style={styles.input}
                                placeholderTextColor={COLORS.gray}
                            />
                        </View>

                        {/* Default Toggle - activeOpacity eklendi */}
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => setFormData({ ...formData, is_default: !formData.is_default })}
                            className="bg-white rounded-xl p-4 flex-row items-center justify-between mb-6"
                            style={styles.switchCard}
                        >
                            <Text className="text-base font-semibold" style={{ color: COLORS.dark }}>
                                Varsayılan adres olarak ayarla
                            </Text>
                            <View
                                style={[
                                    styles.switchTrack,
                                    { backgroundColor: formData.is_default ? COLORS.primary : '#E5E7EB' }
                                ]}
                            >
                                <View
                                    style={[
                                        styles.switchThumb,
                                        { marginLeft: formData.is_default ? 26 : 2 }
                                    ]}
                                />
                            </View>
                        </TouchableOpacity>

                        {/* Save Button - activeOpacity ve düzeltilmiş loading state */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleSave}
                            disabled={loading}
                            style={[
                                styles.saveButton,
                                { backgroundColor: COLORS.primary }
                            ]}
                        >
                            {loading ? (
                                <View className="flex-row items-center justify-center">
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                    <Text className="text-white text-center text-lg font-semibold ml-2">
                                        Kaydediliyor...
                                    </Text>
                                </View>
                            ) : (
                                <Text className="text-white text-center text-lg font-semibold">
                                    Değişiklikleri Kaydet
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    input: {
        height: 50,
        paddingHorizontal: 16,
        fontSize: 16,
        textAlignVertical: 'center',
    },
    multilineInput: {
        minHeight: 80,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        fontSize: 16,
    },
    switchCard: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    switchTrack: {
        width: 48,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
    },
    switchThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    saveButton: {
        borderRadius: 12,
        paddingVertical: 16,
        marginBottom: 24,
    },
});