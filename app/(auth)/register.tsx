import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { COLORS } from '@/lib/constants';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen() {
    const router = useRouter();
    const { setUser } = useAuthStore();
    const { showToast } = useToast();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        if (!fullName || !email || !phone || !password || !confirmPassword) {
            showToast('Lütfen tüm alanları doldurun', 'warning');
            return false;
        }

        if (password !== confirmPassword) {
            showToast('Şifreler eşleşmiyor', 'error');
            return false;
        }

        if (password.length < 6) {
            showToast('Şifre en az 6 karakter olmalıdır', 'warning');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Geçerli bir e-posta adresi girin', 'warning');
            return false;
        }

        return true;
    };

    const handleRegister = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('users')
                    .insert([
                        {
                            id: authData.user.id,
                            email,
                            full_name: fullName,
                            phone,
                        },
                    ]);

                if (profileError) throw profileError;

                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single();

                setUser(userData);
                showToast('Kayıt başarılı! Hoş geldiniz!', 'success');
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            showToast(error.message || 'Kayıt olunamadı', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <LinearGradient colors={['#E8F5E9', '#FFFFFF']} className="flex-1">
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="flex-1 px-6 pt-16 pb-8">
                        {/* Back Button */}
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-full items-center justify-center mb-6"
                            style={{ backgroundColor: COLORS.white }}
                        >
                            <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                        </TouchableOpacity>

                        {/* Header */}
                        <Text className="text-3xl font-bold mb-2" style={{ color: COLORS.dark }}>
                            Hesap Oluştur
                        </Text>
                        <Text className="text-base mb-8" style={{ color: COLORS.gray }}>
                            Deniz Market'e katılın ve alışverişe başlayın!
                        </Text>

                        {/* Full Name Input */}
                        <View className="mb-4">
                            <Text className="text-sm mb-2" style={{ color: COLORS.gray }}>
                                Ad Soyad
                            </Text>
                            <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200">
                                <TextInput
                                    placeholder="Adınız Soyadınız"
                                    value={fullName}
                                    onChangeText={setFullName}
                                    className="flex-1 text-base"
                                    placeholderTextColor={COLORS.gray}
                                />
                            </View>
                        </View>

                        {/* Email Input */}
                        <View className="mb-4">
                            <Text className="text-sm mb-2" style={{ color: COLORS.gray }}>
                                E-posta Adresi
                            </Text>
                            <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200">
                                <TextInput
                                    placeholder="ornek@email.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    className="flex-1 text-base"
                                    placeholderTextColor={COLORS.gray}
                                />
                            </View>
                        </View>

                        {/* Phone Input */}
                        <View className="mb-4">
                            <Text className="text-sm mb-2" style={{ color: COLORS.gray }}>
                                Telefon Numarası
                            </Text>
                            <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200">
                                <TextInput
                                    placeholder="05XX XXX XX XX"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    className="flex-1 text-base"
                                    placeholderTextColor={COLORS.gray}
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View className="mb-4">
                            <Text className="text-sm mb-2" style={{ color: COLORS.gray }}>
                                Şifre
                            </Text>
                            <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200">
                                <TextInput
                                    placeholder="En az 6 karakter"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    className="flex-1 text-base"
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

                        {/* Confirm Password Input */}
                        <View className="mb-6">
                            <Text className="text-sm mb-2" style={{ color: COLORS.gray }}>
                                Şifre Tekrar
                            </Text>
                            <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200">
                                <TextInput
                                    placeholder="Şifrenizi tekrar girin"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    className="flex-1 text-base"
                                    placeholderTextColor={COLORS.gray}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                                        size={24}
                                        color={COLORS.gray}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Register Button */}
                        <TouchableOpacity
                            onPress={handleRegister}
                            disabled={isLoading}
                            className="rounded-xl py-4 mb-4"
                            style={{ backgroundColor: COLORS.primary }}
                        >
                            <Text className="text-white text-center text-lg font-semibold">
                                {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                            </Text>
                        </TouchableOpacity>

                        {/* Sign In Link */}
                        <View className="flex-row items-center justify-center mt-4">
                            <Text style={{ color: COLORS.gray }}>Zaten hesabınız var mı? </Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                                <Text style={{ color: COLORS.primary }} className="font-semibold">
                                    Giriş Yap
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}