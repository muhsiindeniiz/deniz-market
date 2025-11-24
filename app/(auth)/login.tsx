// app/(auth)/login.tsx
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { COLORS } from '@/lib/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as Crypto from 'expo-crypto';

export default function LoginScreen() {
    const router = useRouter();
    const { setUser } = useAuthStore();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [provider, setProvider] = useState<string>('');
    const [showEmailForm, setShowEmailForm] = useState(false);

    // Email login states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Configure Google Sign-In
        GoogleSignin.configure({
            iosClientId: "491979314052-k2kna9glv0phkhbjf59tiaikfmugd2nu.apps.googleusercontent.com",
            webClientId: "491979314052-0usbel7amqladm9c0nl6549b70fb48u6.apps.googleusercontent.com",
            offlineAccess: false,
        });
    }, []);

    // Check if user profile is complete and handle navigation
    const checkUserAndNavigate = async (userId: string, userEmail: string, fullName?: string) => {
        try {
            console.log('=== checkUserAndNavigate called ===');
            console.log('UserId:', userId);
            console.log('Email:', userEmail);
            console.log('Full Name:', fullName);

            // Check if user exists in our users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            console.log('User data from DB:', userData);
            console.log('User error:', userError);

            if (userError && userError.code !== 'PGRST116') {
                // Real error occurred
                console.error('Database error:', userError);
                throw userError;
            }

            if (!userData) {
                // User doesn't exist in database - create new profile
                console.log('User not found in DB, creating new profile...');

                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert([
                        {
                            id: userId,
                            email: userEmail,
                            full_name: fullName || '',
                            phone: null,
                            birth_date: null,
                        },
                    ])
                    .select()
                    .single();

                if (insertError) {
                    console.error('Insert error:', insertError);
                    // If insert fails due to duplicate, try to fetch again
                    if (insertError.code === '23505') {
                        const { data: existingUser } = await supabase
                            .from('users')
                            .select('*')
                            .eq('id', userId)
                            .single();

                        if (existingUser) {
                            return await handleExistingUser(existingUser);
                        }
                    }
                    throw insertError;
                }

                console.log('New user created:', newUser);
                console.log('Redirecting to complete-profile...');

                // Navigate to complete profile
                router.replace('/(auth)/complete-profile');
                return;
            }

            // User exists - check profile completeness
            await handleExistingUser(userData);

        } catch (error: any) {
            console.error('checkUserAndNavigate error:', error);
            throw error;
        }
    };

    const handleExistingUser = async (userData: any) => {
        console.log('Handling existing user:', userData);

        // Check if profile is complete (has phone and birth_date)
        const isProfileComplete = userData.phone &&
            userData.phone.trim() !== '' &&
            userData.birth_date;

        if (!isProfileComplete) {
            console.log('Profile incomplete, redirecting to complete-profile');
            router.replace('/(auth)/complete-profile');
        } else {
            console.log('Profile complete, redirecting to home');
            setUser(userData);
            showToast('Giriş başarılı!', 'success');
            router.replace('/(tabs)');
        }
    };

    const handleEmailLogin = async () => {
        if (!email.trim() || !password.trim()) {
            showToast('Lütfen tüm alanları doldurun', 'warning');
            return;
        }

        setIsLoading(true);
        setProvider('email');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    showToast('E-posta veya şifre hatalı', 'error');
                } else {
                    showToast(error.message || 'Giriş yapılamadı', 'error');
                }
                return;
            }

            if (data.user) {
                await checkUserAndNavigate(data.user.id, data.user.email!, data.user.user_metadata?.full_name);
            }
        } catch (error: any) {
            console.error('Email login error:', error);
            showToast(error.message || 'Giriş yapılamadı', 'error');
        } finally {
            setIsLoading(false);
            setProvider('');
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            setProvider('google');
            console.log('=== Starting Google login ===');

            // Sign out first to ensure clean state
            try {
                await GoogleSignin.signOut();
            } catch (e) {
                console.log('Sign out error (can be ignored):', e);
            }

            // Check Play Services
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            // Sign in with Google
            console.log('Calling GoogleSignin.signIn()...');
            const response = await GoogleSignin.signIn();
            console.log('Google response type:', response.type);

            // Check if user cancelled
            if (response.type === 'cancelled') {
                console.log('User cancelled Google sign in');
                showToast('Giriş iptal edildi', 'info');
                return;
            }

            // Extract user data
            let googleUser;
            let idToken;

            if (response.type === 'success' && response.data) {
                googleUser = response.data.user;
                idToken = response.data.idToken;
            } else if ((response as any).user) {
                googleUser = (response as any).user;
                idToken = (response as any).idToken;
            }

            console.log('Extracted Google User:', googleUser?.email);
            console.log('Has ID Token:', !!idToken);

            if (!googleUser || !googleUser.email) {
                throw new Error('Google kullanıcı bilgileri alınamadı');
            }

            if (!idToken) {
                throw new Error('Google kimlik doğrulama başarısız - ID token alınamadı');
            }

            console.log('Authenticating with Supabase...');

            // Generate a raw nonce
            const rawNonce = generateNonce();
            console.log('Generated nonce');

            // Try to authenticate with Supabase using ID token
            const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: idToken,
                nonce: rawNonce, // This might not work with Google's pre-generated nonce
            });

            // If nonce error, try without nonce (for existing users in Supabase Auth)
            if (authError) {
                console.log('Initial auth error:', authError.message);

                if (authError.message.includes('nonce') || authError.message.includes('Nonce')) {
                    console.log('Nonce error detected, trying alternative authentication...');

                    // Try signInWithIdToken without explicit nonce
                    // The token already has a nonce from Google
                    const { data: retryData, error: retryError } = await supabase.auth.signInWithIdToken({
                        provider: 'google',
                        token: idToken,
                    });

                    if (retryError) {
                        console.log('Retry auth error:', retryError.message);

                        // Check if user exists with this email in Supabase Auth
                        // We need to handle the case where user signed up with email but trying to login with Google
                        await handleGoogleUserWithExistingEmail(googleUser);
                        return;
                    }

                    if (retryData?.user) {
                        console.log('Supabase authentication successful on retry');
                        await checkUserAndNavigate(
                            retryData.user.id,
                            googleUser.email,
                            googleUser.name
                        );
                        return;
                    }
                }

                // Other auth errors
                throw authError;
            }

            if (authData?.user) {
                console.log('Supabase authentication successful');
                await checkUserAndNavigate(
                    authData.user.id,
                    googleUser.email,
                    googleUser.name
                );
            }
        } catch (error: any) {
            console.error('=== Google login error ===');
            console.error('Error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);

            if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === '12501') {
                showToast('Giriş iptal edildi', 'info');
            } else if (error.code === statusCodes.IN_PROGRESS || error.code === '12502') {
                showToast('Giriş işlemi devam ediyor', 'info');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                showToast('Google Play Hizmetleri kullanılamıyor', 'error');
            } else if (error.message?.includes('DEVELOPER_ERROR')) {
                showToast('Google yapılandırma hatası. Lütfen daha sonra tekrar deneyin.', 'error');
            } else {
                showToast(error.message || 'Google girişi yapılamadı', 'error');
            }
        } finally {
            setIsLoading(false);
            setProvider('');
        }
    };

    // Handle case where Google user's email already exists in Supabase with different provider
    const handleGoogleUserWithExistingEmail = async (googleUser: any) => {
        try {
            console.log('Checking if user exists with email:', googleUser.email);

            // Check if there's an existing user in our users table with this email
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('*')
                .eq('email', googleUser.email)
                .maybeSingle();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existingUser) {
                // User exists with this email - they need to login with their original method
                console.log('User exists with email, prompting for email login');
                showToast(
                    'Bu e-posta adresi zaten kayıtlı. Lütfen e-posta ve şifrenizle giriş yapın.',
                    'warning'
                );
                setShowEmailForm(true);
                setEmail(googleUser.email);
            } else {
                // No user with this email - this shouldn't happen normally
                // Try OAuth sign up flow
                console.log('No existing user found, attempting OAuth flow...');

                const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: 'denizmarket://auth/callback',
                        queryParams: {
                            access_type: 'offline',
                            prompt: 'consent',
                        },
                    },
                });

                if (oauthError) {
                    throw oauthError;
                }

                // OAuth will redirect, so we don't need to do anything here
                console.log('OAuth initiated:', oauthData);
            }
        } catch (error: any) {
            console.error('handleGoogleUserWithExistingEmail error:', error);
            showToast('Bir hata oluştu. Lütfen e-posta ile giriş yapın.', 'error');
            setShowEmailForm(true);
        }
    };

    // Generate a random nonce
    const generateNonce = (): string => {
        const array = new Uint8Array(32);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(array);
        } else {
            // Fallback for environments without crypto
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
        }
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    };

    const handleFacebookLogin = async () => {
        setIsLoading(true);
        setProvider('facebook');
        showToast('Facebook girişi yakında eklenecek', 'info');
        setIsLoading(false);
        setProvider('');
    };

    return (
        <LinearGradient
            colors={['#E8F5E9', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 }}>
                            {/* Logo */}
                            <View style={{ alignItems: 'center', marginBottom: 48 }}>
                                <View
                                    style={{
                                        width: 128,
                                        height: 128,
                                        borderRadius: 64,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: 24,
                                        backgroundColor: COLORS.primary + '20',
                                    }}
                                >
                                    <Ionicons name="bag-handle" size={64} color={COLORS.primary} />
                                </View>
                                <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: COLORS.dark }}>
                                    Deniz Market'e
                                </Text>
                                <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: COLORS.dark }}>
                                    Hoş Geldiniz
                                </Text>
                                <Text style={{ fontSize: 16, textAlign: 'center', color: COLORS.gray }}>
                                    Taze ürünler için giriş yapın
                                </Text>
                            </View>

                            {!showEmailForm ? (
                                <>
                                    {/* Google Login Button */}
                                    <TouchableOpacity
                                        onPress={handleGoogleLogin}
                                        disabled={isLoading}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 16,
                                            paddingVertical: 16,
                                            marginBottom: 16,
                                            backgroundColor: '#FFFFFF',
                                            borderWidth: 1,
                                            borderColor: '#E0E0E0',
                                            elevation: 3,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 4,
                                            opacity: isLoading && provider === 'google' ? 0.7 : 1,
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        {isLoading && provider === 'google' ? (
                                            <ActivityIndicator size="small" color={COLORS.primary} />
                                        ) : (
                                            <>
                                                <Ionicons name="logo-google" size={24} color="#DB4437" />
                                                <Text style={{ fontSize: 16, fontWeight: '600', marginLeft: 12, color: COLORS.dark }}>
                                                    Google ile Giriş Yap
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    {/* Facebook Login Button */}
                                    <TouchableOpacity
                                        onPress={handleFacebookLogin}
                                        disabled={isLoading}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 16,
                                            paddingVertical: 16,
                                            marginBottom: 32,
                                            backgroundColor: '#1877F2',
                                            elevation: 3,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 4,
                                            opacity: isLoading && provider === 'facebook' ? 0.7 : 1,
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        {isLoading && provider === 'facebook' ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <>
                                                <Ionicons name="logo-facebook" size={24} color="#FFFFFF" />
                                                <Text style={{ fontSize: 16, fontWeight: '600', marginLeft: 12, color: '#FFFFFF' }}>
                                                    Facebook ile Giriş Yap
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    {/* Divider */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
                                        <View style={{ flex: 1, height: 1, backgroundColor: COLORS.gray + '40' }} />
                                        <Text style={{ marginHorizontal: 16, color: COLORS.gray }}>veya</Text>
                                        <View style={{ flex: 1, height: 1, backgroundColor: COLORS.gray + '40' }} />
                                    </View>

                                    {/* Email Login Link */}
                                    <TouchableOpacity
                                        onPress={() => setShowEmailForm(true)}
                                        style={{ alignItems: 'center', paddingVertical: 12 }}
                                        disabled={isLoading}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name="mail" size={20} color={COLORS.primary} />
                                            <Text style={{ fontSize: 16, fontWeight: '500', marginLeft: 8, color: COLORS.primary }}>
                                                E-posta ile giriş yap
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    {/* Back to Social Login */}
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowEmailForm(false);
                                            setEmail('');
                                            setPassword('');
                                        }}
                                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}
                                        disabled={isLoading}
                                    >
                                        <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                                        <Text style={{ marginLeft: 8, fontSize: 16, color: COLORS.dark }}>
                                            Geri Dön
                                        </Text>
                                    </TouchableOpacity>

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
                                                placeholder="••••••••"
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry={!showPassword}
                                                style={{ flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.dark }}
                                                placeholderTextColor={COLORS.gray}
                                                editable={!isLoading}
                                            />
                                            <TouchableOpacity
                                                onPress={() => setShowPassword(!showPassword)}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Ionicons
                                                    name={showPassword ? 'eye-off' : 'eye'}
                                                    size={24}
                                                    color={COLORS.gray}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Forgot Password */}
                                    <TouchableOpacity
                                        onPress={() => router.push('/(auth)/forgot-password')}
                                        style={{ alignItems: 'flex-end', marginBottom: 24 }}
                                        disabled={isLoading}
                                    >
                                        <Text style={{ color: COLORS.primary, fontWeight: '500' }}>
                                            Şifremi unuttum
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Login Button */}
                                    <TouchableOpacity
                                        onPress={handleEmailLogin}
                                        disabled={isLoading}
                                        style={{
                                            borderRadius: 12,
                                            paddingVertical: 16,
                                            marginBottom: 16,
                                            backgroundColor: COLORS.primary,
                                            opacity: isLoading && provider === 'email' ? 0.7 : 1,
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        {isLoading && provider === 'email' ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <Text style={{ color: '#FFFFFF', textAlign: 'center', fontSize: 18, fontWeight: '600' }}>
                                                Giriş Yap
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}

                            {/* Sign Up Link */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: 'auto',
                                paddingTop: 32,
                            }}>
                                <Text style={{ color: COLORS.gray }}>Hesabınız yok mu? </Text>
                                <TouchableOpacity
                                    onPress={() => router.push('/(auth)/register')}
                                    disabled={isLoading}
                                >
                                    <Text style={{ color: COLORS.primary, fontWeight: '600' }}>
                                        Kayıt Ol
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