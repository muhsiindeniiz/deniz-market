// app/(auth)/register.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { COLORS } from '@/lib/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = (): boolean => {
        if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
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
        if (!emailRegex.test(email.trim())) {
            showToast('Geçerli bir e-posta adresi girin', 'warning');
            return false;
        }

        return true;
    };

    const handleRegister = async () => {
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            console.log('🔄 Starting registration for:', email);

            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                    }
                }
            });

            if (authError) {
                console.error('❌ Auth error:', authError);

                if (authError.message.includes('already registered')) {
                    showToast('Bu e-posta adresi zaten kayıtlı', 'error');
                } else {
                    showToast(authError.message || 'Kayıt olunamadı', 'error');
                }
                return;
            }

            if (!authData.user) {
                showToast('Kullanıcı oluşturulamadı', 'error');
                return;
            }

            console.log('✅ Auth user created:', authData.user.id);

            // Wait for trigger or create profile manually
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Check if profile was created by trigger
            const { data: existingProfile } = await supabase
                .from('users')
                .select('id')
                .eq('id', authData.user.id)
                .maybeSingle();

            if (!existingProfile) {
                // Create profile manually
                const { error: profileError } = await supabase
                    .from('users')
                    .insert([{
                        id: authData.user.id,
                        email: email.trim(),
                        full_name: fullName.trim(),
                        phone: null,
                        birth_date: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }]);

                if (profileError) {
                    console.error('❌ Profile creation error:', profileError);
                    // Don't fail registration, user can complete profile later
                }
            }

            console.log('✅ Registration successful');
            showToast('Kayıt başarılı! Profilinizi tamamlayın.', 'success');

            // Navigate to complete profile
            router.replace('/(auth)/complete-profile');

        } catch (error: any) {
            console.error('❌ Registration error:', error);
            showToast(error.message || 'Kayıt olunamadı', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#E8F5E9', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
        >
            <SafeAreaView className="flex-1"style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 }}>
                            {/* Back Button */}
                            <TouchableOpacity
                                onPress={() => router.back()}
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 24,
                                    backgroundColor: '#FFFFFF',
                                }}
                                disabled={isLoading}
                            >
                                <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                            </TouchableOpacity>

                            {/* Header */}
                            <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: COLORS.dark }}>
                                Hesap Oluştur
                            </Text>
                            <Text style={{ fontSize: 16, marginBottom: 32, color: COLORS.gray }}>
                                Deniz Market'e katılın ve alışverişe başlayın!
                            </Text>

                            {/* Full Name Input */}
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ fontSize: 14, marginBottom: 8, color: COLORS.gray }}>
                                    Ad Soyad
                                </Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    borderWidth: 1,
                                    borderColor: '#E5E5E5',
                                }}>
                                    <Ionicons name="person-outline" size={20} color={COLORS.gray} />
                                    <TextInput
                                        placeholder="Adınız Soyadınız"
                                        value={fullName}
                                        onChangeText={setFullName}
                                        autoCapitalize="words"
                                        style={{ flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.dark }}
                                        placeholderTextColor={COLORS.gray}
                                        editable={!isLoading}
                                    />
                                </View>
                            </View>

                            {/* Email Input */}
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ fontSize: 14, marginBottom: 8, color: COLORS.gray }}>
                                    E-posta Adresi
                                </Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    borderWidth: 1,
                                    borderColor: '#E5E5E5',
                                }}>
                                    <Ionicons name="mail-outline" size={20} color={COLORS.gray} />
                                    <TextInput
                                        placeholder="ornek@email.com"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        style={{ flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.dark }}
                                        placeholderTextColor={COLORS.gray}
                                        editable={!isLoading}
                                    />
                                </View>
                            </View>

                            {/* Password Input */}
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ fontSize: 14, marginBottom: 8, color: COLORS.gray }}>
                                    Şifre
                                </Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    borderWidth: 1,
                                    borderColor: '#E5E5E5',
                                }}>
                                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} />
                                    <TextInput
                                        placeholder="En az 6 karakter"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        style={{ flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.dark }}
                                        placeholderTextColor={COLORS.gray}
                                        editable={!isLoading}
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
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ fontSize: 14, marginBottom: 8, color: COLORS.gray }}>
                                    Şifre Tekrar
                                </Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    borderWidth: 1,
                                    borderColor: '#E5E5E5',
                                }}>
                                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} />
                                    <TextInput
                                        placeholder="Şifrenizi tekrar girin"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                        style={{ flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.dark }}
                                        placeholderTextColor={COLORS.gray}
                                        editable={!isLoading}
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
                                style={{
                                    borderRadius: 12,
                                    paddingVertical: 16,
                                    marginBottom: 16,
                                    backgroundColor: COLORS.primary,
                                    opacity: isLoading ? 0.7 : 1,
                                }}
                                activeOpacity={0.8}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={{ color: '#FFFFFF', textAlign: 'center', fontSize: 18, fontWeight: '600' }}>
                                        Kayıt Ol
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Sign In Link */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: 16,
                            }}>
                                <Text style={{ color: COLORS.gray }}>Zaten hesabınız var mı? </Text>
                                <TouchableOpacity onPress={() => router.push('/(auth)/login')} disabled={isLoading}>
                                    <Text style={{ color: COLORS.primary, fontWeight: '600' }}>
                                        Giriş Yap
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}