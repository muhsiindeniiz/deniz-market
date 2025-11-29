// app/(auth)/login.tsx
import { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/useToast";
import { COLORS } from "@/lib/constants";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    GoogleSignin,
    statusCodes,
    isSuccessResponse,
    isErrorWithCode,
} from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
const logo = require("@/assets/images/logo.png");

const BENEFITS = [
    {
        icon: "rocket",
        title: "Hızlı Teslimat",
        subtitle: "Siparişin kısa sürede kapında",
        color: "#FF6B6B",
    },
    {
        icon: "pricetag",
        title: "Yeni İndirimler",
        subtitle: "Fırsat ürünleri",
        color: "#4ECDC4",
    },
    {
        icon: "grid",
        title: "Yüzlerce Ürün",
        subtitle: "Aradığın her şey tek yerde",
        color: "#9B59B6",
    },
    {
        icon: "refresh",
        title: "Kolay İade",
        subtitle: "Sorunsuz değişim ve iade",
        color: "#3498DB",
    },
];

export default function LoginScreen() {
    const router = useRouter();
    const { setUser } = useAuthStore();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [provider, setProvider] = useState<string>("");
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [currentBenefit, setCurrentBenefit] = useState(0);

    useEffect(() => {
        configureGoogleSignIn();
        const interval = setInterval(() => {
            setCurrentBenefit((prev) => (prev + 1) % BENEFITS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const configureGoogleSignIn = async () => {
        try {
            await GoogleSignin.configure({
                webClientId: "491979314052-0usbel7amqladm9c0nl6549b70fb48u6.apps.googleusercontent.com",
                iosClientId: "491979314052-k2kna9glv0phkhbjf59tiaikfmugd2nu.apps.googleusercontent.com",
                offlineAccess: true,
                scopes: ["profile", "email"],
            });
        } catch (error) {
            console.error("Google Sign-In configuration error:", error);
        }
    };

    const checkUserAndNavigate = async (
        userId: string,
        userEmail: string,
        fullName?: string
    ) => {
        try {
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)
                .maybeSingle();

            if (userError && userError.code !== "PGRST116") {
                throw userError;
            }

            if (!userData) {
                const { data: newUser, error: insertError } = await supabase
                    .from("users")
                    .insert([
                        {
                            id: userId,
                            email: userEmail,
                            full_name: fullName || "",
                            phone: null,
                            birth_date: null,
                        },
                    ])
                    .select()
                    .single();

                if (insertError) {
                    if (insertError.code === "23505") {
                        const { data: existingUser } = await supabase
                            .from("users")
                            .select("*")
                            .eq("id", userId)
                            .single();

                        if (existingUser) {
                            return await handleExistingUser(existingUser);
                        }
                    }
                    throw insertError;
                }

                router.replace("/(auth)/complete-profile");
                return;
            }

            await handleExistingUser(userData);
        } catch (error: any) {
            console.error("checkUserAndNavigate error:", error);
            throw error;
        }
    };

    const handleExistingUser = async (userData: any) => {
        const isProfileComplete =
            userData.phone && userData.phone.trim() !== "" && userData.birth_date;

        if (!isProfileComplete) {
            router.replace("/(auth)/complete-profile");
        } else {
            setUser(userData);
            showToast("Hoş geldiniz! 🎉", "success");
            router.replace("/(tabs)");
        }
    };

    const handleEmailLogin = async () => {
        if (!email.trim() || !password.trim()) {
            showToast("Lütfen tüm alanları doldurun", "warning");
            return;
        }

        setIsLoading(true);
        setProvider("email");

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                if (error.message.includes("Invalid login credentials")) {
                    showToast("E-posta veya şifre hatalı", "error");
                } else {
                    showToast(error.message || "Giriş yapılamadı", "error");
                }
                return;
            }

            if (data.user) {
                await checkUserAndNavigate(
                    data.user.id,
                    data.user.email!,
                    data.user.user_metadata?.full_name
                );
            }
        } catch (error: any) {
            showToast(error.message || "Giriş yapılamadı", "error");
        } finally {
            setIsLoading(false);
            setProvider("");
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            setProvider("google");

            try {
                await GoogleSignin.signOut();
            } catch (e) {
                // No previous session
            }

            await GoogleSignin.hasPlayServices({
                showPlayServicesUpdateDialog: true,
            });

            const response = await GoogleSignin.signIn();

            if (!isSuccessResponse(response)) {
                showToast("Giriş iptal edildi", "info");
                return;
            }

            const { idToken, user: googleUser } = response.data;

            if (!googleUser || !googleUser.email) {
                throw new Error("Google kullanıcı bilgileri alınamadı");
            }

            if (!idToken) {
                await handleGoogleUserWithoutToken(googleUser);
                return;
            }

            const { data: authData, error: authError } =
                await supabase.auth.signInWithIdToken({
                    provider: "google",
                    token: idToken,
                });

            if (authError) {
                if (
                    authError.message.includes("Network") ||
                    authError.message.includes("fetch")
                ) {
                    showToast("İnternet bağlantınızı kontrol edin", "error");
                    return;
                }

                if (
                    authError.message.includes("token") ||
                    authError.message.includes("nonce")
                ) {
                    await handleGoogleUserWithoutToken(googleUser);
                    return;
                }

                throw authError;
            }

            if (authData?.user) {
                await checkUserAndNavigate(
                    authData.user.id,
                    googleUser.email,
                    googleUser.name || undefined
                );
            }
        } catch (error: any) {
            if (isErrorWithCode(error)) {
                switch (error.code) {
                    case statusCodes.SIGN_IN_CANCELLED:
                        showToast("Giriş iptal edildi", "info");
                        break;
                    case statusCodes.IN_PROGRESS:
                        showToast("Giriş işlemi devam ediyor", "info");
                        break;
                    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                        showToast("Google Play Hizmetleri kullanılamıyor", "error");
                        break;
                    default:
                        handleGenericGoogleError(error);
                }
            } else if (error?.message?.includes("Network request failed")) {
                showToast("İnternet bağlantınızı kontrol edin", "error");
            } else {
                handleGenericGoogleError(error);
            }
        } finally {
            setIsLoading(false);
            setProvider("");
        }
    };

    const handleGenericGoogleError = (error: any) => {
        const message = error?.message || "Google girişi yapılamadı";
        if (message.includes("Network")) {
            showToast("İnternet bağlantı hatası", "error");
        } else if (message.includes("timeout")) {
            showToast("Bağlantı zaman aşımına uğradı", "error");
        } else {
            showToast("Google girişi başarısız. E-posta ile deneyin.", "error");
            setShowEmailForm(true);
        }
    };

    const handleGoogleUserWithoutToken = async (googleUser: any) => {
        try {
            const { data: existingUser, error: checkError } = await supabase
                .from("users")
                .select("*")
                .eq("email", googleUser.email)
                .maybeSingle();

            if (checkError && checkError.code !== "PGRST116") {
                throw checkError;
            }

            if (existingUser) {
                showToast(
                    "Bu e-posta kayıtlı. Lütfen şifrenizle giriş yapın.",
                    "warning"
                );
                setShowEmailForm(true);
                setEmail(googleUser.email);
                return;
            }

            showToast("Hesabınız bulunamadı. Kayıt olun!", "info");
            router.push({
                pathname: "/(auth)/register",
                params: {
                    email: googleUser.email,
                    fullName: googleUser.name || "",
                },
            });
        } catch (error: any) {
            showToast("Bir hata oluştu. E-posta ile giriş yapın.", "error");
            setShowEmailForm(true);
        }
    };

    const handleAppleLogin = async () => {
        try {
            setIsLoading(true);
            setProvider("apple");

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (!credential.identityToken) {
                throw new Error("Apple kimlik doğrulama başarısız");
            }

            const { data: authData, error: authError } =
                await supabase.auth.signInWithIdToken({
                    provider: "apple",
                    token: credential.identityToken,
                });

            if (authError) {
                throw authError;
            }

            if (authData?.user) {
                let fullName = "";
                if (credential.fullName) {
                    const nameParts: string[] = [];
                    if (credential.fullName.givenName)
                        nameParts.push(credential.fullName.givenName);
                    if (credential.fullName.middleName)
                        nameParts.push(credential.fullName.middleName);
                    if (credential.fullName.familyName)
                        nameParts.push(credential.fullName.familyName);
                    fullName = nameParts.join(" ");

                    if (fullName) {
                        await supabase.auth.updateUser({
                            data: {
                                full_name: fullName,
                                given_name: credential.fullName.givenName,
                                family_name: credential.fullName.familyName,
                            },
                        });
                    }
                }

                await checkUserAndNavigate(
                    authData.user.id,
                    authData.user.email || credential.email || "",
                    fullName || authData.user.user_metadata?.full_name
                );
            }
        } catch (error: any) {
            if (error.code === "ERR_REQUEST_CANCELED") {
                showToast("Giriş iptal edildi", "info");
            } else {
                console.error("Apple login error:", error);
                showToast("Apple girişi başarısız. E-posta ile deneyin.", "error");
                setShowEmailForm(true);
            }
        } finally {
            setIsLoading(false);
            setProvider("");
        }
    };

    const handleFacebookLogin = async () => {
        try {
            setIsLoading(true);
            setProvider("facebook");

            const { error } = await supabase.auth.signInWithOAuth({
                provider: "facebook",
                options: {
                    redirectTo: "denizmarket://auth/callback",
                    skipBrowserRedirect: false,
                },
            });

            if (error) {
                throw error;
            }
        } catch (error: any) {
            console.error("Facebook login error:", error);
            showToast("Facebook girişi başarısız. E-posta ile deneyin.", "error");
            setShowEmailForm(true);
        } finally {
            setIsLoading(false);
            setProvider("");
        }
    };

    const currentBenefitData = BENEFITS[currentBenefit];

    return (
        <LinearGradient
            colors={["#F0FDF4", "#ECFDF5", "#FFFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                        bounces={false}
                    >
                        <View
                            style={{
                                flex: 1,
                                paddingHorizontal: 24,
                                paddingTop: 20,
                                paddingBottom: 24,
                            }}
                        >
                            {/* Logo & Brand Section */}
                            <View style={{ alignItems: "center", marginBottom: 24 }}>
                                <Image
                                    source={logo}
                                    style={{ width: 96, height: 96, marginBottom: 20 }}
                                    resizeMode="contain"
                                />

                                <Text
                                    style={{
                                        fontSize: 26,
                                        fontWeight: "800",
                                        color: COLORS.dark,
                                        letterSpacing: -0.5,
                                    }}
                                >
                                    Deniz Market
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: COLORS.gray,
                                        marginTop: 4,
                                    }}
                                >
                                    Taze • Hızlı • Uygun Fiyatlı
                                </Text>
                            </View>

                            {/* Benefit Carousel */}
                            <View
                                style={{
                                    backgroundColor: currentBenefitData.color + "15",
                                    borderRadius: 16,
                                    padding: 16,
                                    marginBottom: 24,
                                    borderWidth: 1,
                                    borderColor: currentBenefitData.color + "30",
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 14,
                                            backgroundColor: currentBenefitData.color + "20",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Ionicons
                                            name={currentBenefitData.icon as any}
                                            size={24}
                                            color={currentBenefitData.color}
                                        />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                fontWeight: "700",
                                                color: COLORS.dark,
                                            }}
                                        >
                                            {currentBenefitData.title}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                color: COLORS.gray,
                                                marginTop: 2,
                                            }}
                                        >
                                            {currentBenefitData.subtitle}
                                        </Text>
                                    </View>
                                </View>

                                {/* Carousel Dots */}
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "center",
                                        marginTop: 12,
                                        gap: 6,
                                    }}
                                >
                                    {BENEFITS.map((_, index) => (
                                        <View
                                            key={index}
                                            style={{
                                                width: index === currentBenefit ? 20 : 6,
                                                height: 6,
                                                borderRadius: 3,
                                                backgroundColor:
                                                    index === currentBenefit
                                                        ? currentBenefitData.color
                                                        : currentBenefitData.color + "40",
                                            }}
                                        />
                                    ))}
                                </View>
                            </View>

                            {!showEmailForm ? (
                                <>
                                    {/* Social Login Buttons */}
                                    <View style={{ gap: 12 }}>
                                        {/* Google Button */}
                                        <TouchableOpacity
                                            onPress={handleGoogleLogin}
                                            disabled={isLoading}
                                            activeOpacity={0.8}
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                borderRadius: 14,
                                                paddingVertical: 15,
                                                backgroundColor: "#FFFFFF",
                                                borderWidth: 1.5,
                                                borderColor: "#E5E7EB",
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.06,
                                                shadowRadius: 8,
                                                elevation: 2,
                                                opacity: isLoading && provider === "google" ? 0.7 : 1,
                                            }}
                                        >
                                            {isLoading && provider === "google" ? (
                                                <ActivityIndicator size="small" color={COLORS.primary} />
                                            ) : (
                                                <>
                                                    <View
                                                        style={{
                                                            width: 24,
                                                            height: 24,
                                                            marginRight: 12,
                                                        }}
                                                    >
                                                        <Ionicons
                                                            name="logo-google"
                                                            size={24}
                                                            color="#EA4335"
                                                        />
                                                    </View>
                                                    <Text
                                                        style={{
                                                            fontSize: 16,
                                                            fontWeight: "600",
                                                            color: COLORS.dark,
                                                        }}
                                                    >
                                                        Google ile devam et
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>

                                        {/* Apple Button - iOS Only */}
                                        {Platform.OS === "ios" && (
                                            <TouchableOpacity
                                                onPress={handleAppleLogin}
                                                disabled={isLoading}
                                                activeOpacity={0.8}
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderRadius: 14,
                                                    paddingVertical: 15,
                                                    backgroundColor: "#000000",
                                                    shadowColor: "#000",
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.15,
                                                    shadowRadius: 8,
                                                    elevation: 3,
                                                    opacity: isLoading && provider === "apple" ? 0.7 : 1,
                                                }}
                                            >
                                                {isLoading && provider === "apple" ? (
                                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                                ) : (
                                                    <>
                                                        <Ionicons
                                                            name="logo-apple"
                                                            size={22}
                                                            color="#FFFFFF"
                                                        />
                                                        <Text
                                                            style={{
                                                                fontSize: 16,
                                                                fontWeight: "600",
                                                                marginLeft: 10,
                                                                color: "#FFFFFF",
                                                            }}
                                                        >
                                                            Apple ile devam et
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        )}

                                        {/* Facebook Button - Android Only */}
                                        {Platform.OS === "android" && (
                                            <TouchableOpacity
                                                onPress={handleFacebookLogin}
                                                disabled={isLoading}
                                                activeOpacity={0.8}
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderRadius: 14,
                                                    paddingVertical: 15,
                                                    backgroundColor: "#1877F2",
                                                    shadowColor: "#1877F2",
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.25,
                                                    shadowRadius: 8,
                                                    elevation: 3,
                                                    opacity: isLoading && provider === "facebook" ? 0.7 : 1,
                                                }}
                                            >
                                                {isLoading && provider === "facebook" ? (
                                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                                ) : (
                                                    <>
                                                        <Ionicons
                                                            name="logo-facebook"
                                                            size={22}
                                                            color="#FFFFFF"
                                                        />
                                                        <Text
                                                            style={{
                                                                fontSize: 16,
                                                                fontWeight: "600",
                                                                marginLeft: 10,
                                                                color: "#FFFFFF",
                                                            }}
                                                        >
                                                            Facebook ile devam et
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {/* Divider */}
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            marginVertical: 24,
                                        }}
                                    >
                                        <View
                                            style={{
                                                flex: 1,
                                                height: 1,
                                                backgroundColor: "#E5E7EB",
                                            }}
                                        />
                                        <Text
                                            style={{
                                                marginHorizontal: 16,
                                                color: COLORS.gray,
                                                fontSize: 13,
                                            }}
                                        >
                                            veya
                                        </Text>
                                        <View
                                            style={{
                                                flex: 1,
                                                height: 1,
                                                backgroundColor: "#E5E7EB",
                                            }}
                                        />
                                    </View>

                                    {/* Email Login Button */}
                                    <TouchableOpacity
                                        onPress={() => setShowEmailForm(true)}
                                        disabled={isLoading}
                                        activeOpacity={0.8}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderRadius: 14,
                                            paddingVertical: 15,
                                            backgroundColor: COLORS.primary + "10",
                                            borderWidth: 1.5,
                                            borderColor: COLORS.primary + "30",
                                        }}
                                    >
                                        <Ionicons name="mail" size={20} color={COLORS.primary} />
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                fontWeight: "600",
                                                marginLeft: 10,
                                                color: COLORS.primary,
                                            }}
                                        >
                                            E-posta ile giriş yap
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    {/* Back to Social Login */}
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowEmailForm(false);
                                            setEmail("");
                                            setPassword("");
                                        }}
                                        disabled={isLoading}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            marginBottom: 20,
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 12,
                                                backgroundColor: "#F3F4F6",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <Ionicons
                                                name="arrow-back"
                                                size={20}
                                                color={COLORS.dark}
                                            />
                                        </View>
                                        <Text
                                            style={{
                                                marginLeft: 12,
                                                fontSize: 15,
                                                fontWeight: "500",
                                                color: COLORS.dark,
                                            }}
                                        >
                                            Diğer seçeneklere dön
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Email Input */}
                                    <View style={{ marginBottom: 14 }}>
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                fontWeight: "600",
                                                marginBottom: 8,
                                                color: COLORS.dark,
                                            }}
                                        >
                                            E-posta Adresi
                                        </Text>
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                backgroundColor: "#FFFFFF",
                                                borderRadius: 12,
                                                paddingHorizontal: 14,
                                                paddingVertical: 14,
                                                borderWidth: 1.5,
                                                borderColor: "#E5E7EB",
                                            }}
                                        >
                                            <Ionicons
                                                name="mail-outline"
                                                size={20}
                                                color={COLORS.gray}
                                            />
                                            <TextInput
                                                placeholder="ornek@email.com"
                                                value={email}
                                                onChangeText={setEmail}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                autoComplete="email"
                                                style={{
                                                    flex: 1,
                                                    marginLeft: 12,
                                                    fontSize: 16,
                                                    color: COLORS.dark,
                                                }}
                                                placeholderTextColor="#9CA3AF"
                                                editable={!isLoading}
                                            />
                                        </View>
                                    </View>

                                    {/* Password Input */}
                                    <View style={{ marginBottom: 14 }}>
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                fontWeight: "600",
                                                marginBottom: 8,
                                                color: COLORS.dark,
                                            }}
                                        >
                                            Şifre
                                        </Text>
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                backgroundColor: "#FFFFFF",
                                                borderRadius: 12,
                                                paddingHorizontal: 14,
                                                paddingVertical: 14,
                                                borderWidth: 1.5,
                                                borderColor: "#E5E7EB",
                                            }}
                                        >
                                            <Ionicons
                                                name="lock-closed-outline"
                                                size={20}
                                                color={COLORS.gray}
                                            />
                                            <TextInput
                                                placeholder="••••••••"
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry={!showPassword}
                                                autoComplete="password"
                                                style={{
                                                    flex: 1,
                                                    marginLeft: 12,
                                                    fontSize: 16,
                                                    color: COLORS.dark,
                                                }}
                                                placeholderTextColor="#9CA3AF"
                                                editable={!isLoading}
                                            />
                                            <TouchableOpacity
                                                onPress={() => setShowPassword(!showPassword)}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Ionicons
                                                    name={showPassword ? "eye-off" : "eye"}
                                                    size={22}
                                                    color={COLORS.gray}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Forgot Password */}
                                    <TouchableOpacity
                                        onPress={() => router.push("/(auth)/forgot-password")}
                                        disabled={isLoading}
                                        style={{
                                            alignSelf: "flex-end",
                                            marginBottom: 20,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: COLORS.primary,
                                                fontWeight: "600",
                                                fontSize: 14,
                                            }}
                                        >
                                            Şifremi unuttum
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Login Button */}
                                    <TouchableOpacity
                                        onPress={handleEmailLogin}
                                        disabled={isLoading}
                                        activeOpacity={0.8}
                                        style={{
                                            borderRadius: 14,
                                            paddingVertical: 16,
                                            backgroundColor: COLORS.primary,
                                            shadowColor: COLORS.primary,
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 8,
                                            elevation: 4,
                                            opacity: isLoading && provider === "email" ? 0.7 : 1,
                                        }}
                                    >
                                        {isLoading && provider === "email" ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <Text
                                                style={{
                                                    color: "#FFFFFF",
                                                    textAlign: "center",
                                                    fontSize: 17,
                                                    fontWeight: "700",
                                                }}
                                            >
                                                Giriş Yap
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}

                            {/* Sign Up Section */}
                            <View
                                style={{
                                    marginTop: "auto",
                                    paddingBottom: 28,
                                    alignItems: "center",
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                    }}
                                >
                                    <Text style={{ color: COLORS.gray, fontSize: 15 }}>
                                        Hesabınız yok mu?{" "}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => router.push("/(auth)/register")}
                                        disabled={isLoading}
                                    >
                                        <Text
                                            style={{
                                                color: COLORS.primary,
                                                fontWeight: "700",
                                                fontSize: 15,
                                            }}
                                        >
                                            Hemen Kayıt Ol
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}