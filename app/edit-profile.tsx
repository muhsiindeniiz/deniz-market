import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { COLORS } from '@/lib/constants';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
    });

    const handleSave = async () => {
        if (!formData.full_name || !formData.phone) {
            showToast('Lütfen tüm alanları doldurun', 'warning');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user?.id)
                .select()
                .single();

            if (error) throw error;

            setUser(data);
            showToast('Profil başarıyla güncellendi', 'success');
            router.back();
        } catch (error: any) {
            showToast(error.message || 'Profil güncellenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                </TouchableOpacity>
                <Text className="text-xl font-bold flex-1" style={{ color: COLORS.dark }}>
                    Profili Düzenle
                </Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    <View className="p-4">
                        {/* Profile Picture */}
                        <View className="items-center mb-8">
                            <View
                                className="w-32 h-32 rounded-full items-center justify-center mb-4"
                                style={{ backgroundColor: COLORS.primary + '20' }}
                            >
                                <Text className="text-5xl font-bold" style={{ color: COLORS.primary }}>
                                    {formData.full_name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <TouchableOpacity>
                                <Text style={{ color: COLORS.primary }} className="font-semibold">
                                    Fotoğraf Değiştir
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Full Name */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                Ad Soyad
                            </Text>
                            <TextInput
                                placeholder="Adınız Soyadınız"
                                value={formData.full_name}
                                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                                className="bg-white rounded-xl border border-gray-200"
                                style={styles.input}
                                placeholderTextColor={COLORS.gray}
                            />
                        </View>

                        {/* Phone */}
                        <View className="mb-6">
                            <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                Telefon Numarası
                            </Text>
                            <TextInput
                                placeholder="05XX XXX XX XX"
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                keyboardType="phone-pad"
                                className="bg-white rounded-xl border border-gray-200"
                                style={styles.input}
                                placeholderTextColor={COLORS.gray}
                            />
                        </View>

                        {/* Email (Read Only) */}
                        <View className="mb-6">
                            <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                E-posta Adresi
                            </Text>
                            <View className="bg-gray-100 rounded-xl px-4 flex-row items-center justify-between" style={styles.readOnlyContainer}>
                                <Text className="text-base" style={{ color: COLORS.gray }}>
                                    {user?.email}
                                </Text>
                                <TouchableOpacity onPress={() => router.push('/edit-email')}>
                                    <Text style={{ color: COLORS.primary }} className="font-semibold">
                                        Değiştir
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={loading}
                            className="rounded-xl py-4"
                            style={{
                                backgroundColor: COLORS.primary,
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            <Text className="text-white text-center text-lg font-semibold">
                                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                            </Text>
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
    readOnlyContainer: {
        height: 50,
    },
});