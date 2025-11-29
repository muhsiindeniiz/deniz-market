import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { COLORS } from '@/lib/constants';

export default function EditEmailScreen() {
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleUpdateEmail = async () => {
        if (!newEmail || !currentPassword) {
            showToast('Lütfen tüm alanları doldurun', 'warning');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            showToast('Geçerli bir e-posta adresi girin', 'warning');
            return;
        }

        if (newEmail === user?.email) {
            showToast('Yeni e-posta adresi mevcut adresle aynı olamaz', 'warning');
            return;
        }

        setLoading(true);
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user?.email || '',
                password: currentPassword,
            });

            if (signInError) {
                throw new Error('Mevcut şifre yanlış');
            }

            const { error: updateError } = await supabase.auth.updateUser({
                email: newEmail,
            });

            if (updateError) throw updateError;

            const { data, error: profileError } = await supabase
                .from('users')
                .update({ email: newEmail, updated_at: new Date().toISOString() })
                .eq('id', user?.id)
                .select()
                .single();

            if (profileError) throw profileError;

            setUser(data);

            Alert.alert(
                'E-posta Güncellendi',
                'Yeni e-posta adresinize bir doğrulama maili gönderildi. Lütfen e-postanızı kontrol edin ve doğrulayın.',
                [{ text: 'Tamam', onPress: () => router.back() }]
            );
        } catch (error: any) {
            showToast(error.message || 'E-posta güncellenemedi', 'error');
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
                    E-posta Değiştir
                </Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    <View className="p-4">
                        {/* Info Box */}
                        <View className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-200">
                            <View className="flex-row">
                                <Ionicons name="information-circle" size={24} color={COLORS.info} />
                                <Text className="flex-1 ml-3 text-sm" style={{ color: COLORS.dark }}>
                                    E-posta adresinizi değiştirmek için önce mevcut şifrenizi girmeniz gerekir.
                                    Yeni e-posta adresinize bir doğrulama maili gönderilecektir.
                                </Text>
                            </View>
                        </View>

                        {/* Current Email (Read Only) */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                Mevcut E-posta Adresi
                            </Text>
                            <View className="bg-gray-100 rounded-xl px-4 justify-center" style={styles.readOnlyContainer}>
                                <Text className="text-base" style={{ color: COLORS.gray }}>
                                    {user?.email}
                                </Text>
                            </View>
                        </View>

                        {/* Current Password */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                Mevcut Şifre *
                            </Text>
                            <View className="flex-row items-center bg-white rounded-xl px-4 border border-gray-200" style={styles.inputContainer}>
                                <TextInput
                                    placeholder="Mevcut şifrenizi girin"
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    secureTextEntry={!showPassword}
                                    className="flex-1"
                                    style={styles.inputWithIcon}
                                    placeholderTextColor={COLORS.gray}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? 'eye-off' : 'eye'}
                                        size={24}
                                        color={COLORS.gray}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* New Email */}
                        <View className="mb-6">
                            <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.dark }}>
                                Yeni E-posta Adresi *
                            </Text>
                            <View className="flex-row items-center bg-white rounded-xl px-4 border border-gray-200" style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color={COLORS.gray} />
                                <TextInput
                                    placeholder="yeni@email.com"
                                    value={newEmail}
                                    onChangeText={setNewEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    className="flex-1 ml-3"
                                    style={styles.inputWithIcon}
                                    placeholderTextColor={COLORS.gray}
                                />
                            </View>
                        </View>

                        {/* Update Button */}
                        <TouchableOpacity
                            onPress={handleUpdateEmail}
                            disabled={loading}
                            className="rounded-xl py-4 mb-4"
                            style={{
                                backgroundColor: COLORS.primary,
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            <Text className="text-white text-center text-lg font-semibold">
                                {loading ? 'Güncelleniyor...' : 'E-postayı Güncelle'}
                            </Text>
                        </TouchableOpacity>

                        {/* Warning */}
                        <View className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                            <View className="flex-row">
                                <Ionicons name="warning" size={24} color={COLORS.warning} />
                                <Text className="flex-1 ml-3 text-sm" style={{ color: COLORS.dark }}>
                                    E-posta adresinizi değiştirdikten sonra yeni adresinizi doğrulayana kadar
                                    oturum açmak için eski e-posta adresinizi kullanmalısınız.
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        height: 50,
    },
    inputWithIcon: {
        fontSize: 16,
        height: '100%',
        textAlignVertical: 'center',
    },
    readOnlyContainer: {
        height: 50,
    },
});