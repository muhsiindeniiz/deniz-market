import { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import { COLORS } from "@/lib/constants";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Animations

    useEffect(() => {
        if (emailSent) {
            setCountdown(60);
            const interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [emailSent]);

    const handleResetPassword = async () => {
        if (!email) {
            showToast("Lütfen e-posta adresinizi girin", "warning");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast("Geçerli bir e-posta adresi girin", "warning");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: "denizmarket://reset-password",
            });

            if (error) throw error;

            setEmailSent(true);
            showToast("Şifre sıfırlama bağlantısı gönderildi", "success");
        } catch (error: any) {
            showToast(error.message || "Şifre sıfırlama başarısız", "error");
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <LinearGradient
                colors={["#F0FDF4", "#ECFDF5", "#FFFFFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ flex: 1 }}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    <View
                        style={{
                            flex: 1,
                            paddingHorizontal: 24,
                            justifyContent: "center",
                        }}
                    >
                        <View
                            style={{
                                alignItems: "center",
                            }}
                        >
                            {/* Success Icon */}
                            <View
                                style={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: 30,
                                    backgroundColor: "#DCFCE7",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 24,
                                }}
                            >
                                <Ionicons name="mail-open" size={50} color="#16A34A" />
                            </View>

                            <Text
                                style={{
                                    fontSize: 24,
                                    fontWeight: "800",
                                    color: COLORS.dark,
                                    marginBottom: 12,
                                    textAlign: "center",
                                }}
                            >
                                E-posta Gönderildi! ✉️
                            </Text>

                            <Text
                                style={{
                                    fontSize: 15,
                                    color: COLORS.gray,
                                    textAlign: "center",
                                    lineHeight: 22,
                                    marginBottom: 8,
                                }}
                            >
                                <Text style={{ fontWeight: "600", color: COLORS.dark }}>
                                    {email}
                                </Text>{" "}
                                adresine şifre sıfırlama bağlantısı gönderdik.
                            </Text>

                            <Text
                                style={{
                                    fontSize: 13,
                                    color: COLORS.gray,
                                    textAlign: "center",
                                    marginBottom: 32,
                                }}
                            >
                                E-postanızı kontrol edin ve bağlantıya tıklayın.
                            </Text>

                            {/* Back to Login Button */}
                            <TouchableOpacity
                                onPress={() => router.back()}
                                activeOpacity={0.8}
                                style={{
                                    width: "100%",
                                    borderRadius: 14,
                                    paddingVertical: 16,
                                    backgroundColor: COLORS.primary,
                                    shadowColor: COLORS.primary,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                    elevation: 4,
                                    marginBottom: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        color: "#FFFFFF",
                                        textAlign: "center",
                                        fontSize: 16,
                                        fontWeight: "700",
                                    }}
                                >
                                    Giriş Sayfasına Dön
                                </Text>
                            </TouchableOpacity>

                            {/* Resend Button */}
                            <TouchableOpacity
                                onPress={() => {
                                    if (countdown === 0) {
                                        setEmailSent(false);
                                    }
                                }}
                                disabled={countdown > 0}
                                style={{ paddingVertical: 12 }}
                            >
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontWeight: "600",
                                        color: countdown > 0 ? COLORS.gray : COLORS.primary,
                                    }}
                                >
                                    {countdown > 0
                                        ? `Tekrar gönder (${countdown}s)`
                                        : "Farklı e-posta ile dene"}
                                </Text>
                            </TouchableOpacity>

                            {/* Help Box */}
                            <View
                                style={{
                                    backgroundColor: "#FEF3C7",
                                    borderRadius: 12,
                                    padding: 14,
                                    marginTop: 24,
                                    flexDirection: "row",
                                    alignItems: "flex-start",
                                    borderWidth: 1,
                                    borderColor: "#FCD34D",
                                }}
                            >
                                <Ionicons name="help-circle" size={20} color="#D97706" />
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            fontWeight: "600",
                                            color: "#92400E",
                                            marginBottom: 4,
                                        }}
                                    >
                                        E-posta gelmediyse
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            color: "#B45309",
                                            lineHeight: 18,
                                        }}
                                    >
                                        Spam/Gereksiz klasörünü kontrol edin. Birkaç dakika bekleyin
                                        veya farklı e-posta deneyin.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={["#F0FDF4", "#ECFDF5", "#FFFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={{ flex: 1 }}>
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
                                paddingTop: 16,
                                paddingBottom: 24,
                            }}
                        >
                            {/* Back Button */}
                            <TouchableOpacity
                                onPress={() => router.back()}
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 12,
                                    backgroundColor: "#FFFFFF",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 32,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 4,
                                    elevation: 1,
                                }}
                            >
                                <Ionicons name="arrow-back" size={22} color={COLORS.dark} />
                            </TouchableOpacity>

                            {/* Header */}
                            <View style={{ alignItems: "center", marginBottom: 32 }}>
                                <View
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 24,
                                        backgroundColor: COLORS.primary + "15",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginBottom: 20,
                                    }}
                                >
                                    <Ionicons name="key" size={40} color={COLORS.primary} />
                                </View>

                                <Text
                                    style={{
                                        fontSize: 24,
                                        fontWeight: "800",
                                        color: COLORS.dark,
                                        marginBottom: 8,
                                    }}
                                >
                                    Şifremi Unuttum
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: COLORS.gray,
                                        textAlign: "center",
                                        lineHeight: 22,
                                    }}
                                >
                                    E-posta adresinizi girin, size şifre sıfırlama bağlantısı
                                    gönderelim.
                                </Text>
                            </View>

                            {/* Email Input */}
                            <View style={{ marginBottom: 24 }}>
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
                                        editable={!loading}
                                    />
                                </View>
                            </View>

                            {/* Reset Button */}
                            <TouchableOpacity
                                onPress={handleResetPassword}
                                disabled={loading}
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
                                    opacity: loading ? 0.7 : 1,
                                }}
                            >
                                <Text
                                    style={{
                                        color: "#FFFFFF",
                                        textAlign: "center",
                                        fontSize: 17,
                                        fontWeight: "700",
                                    }}
                                >
                                    {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
                                </Text>
                            </TouchableOpacity>

                            {/* Back to Login */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginTop: 24,
                                }}
                            >
                                <Text style={{ color: COLORS.gray, fontSize: 15 }}>
                                    Şifrenizi hatırladınız mı?{" "}
                                </Text>
                                <TouchableOpacity onPress={() => router.back()}>
                                    <Text
                                        style={{
                                            color: COLORS.primary,
                                            fontWeight: "700",
                                            fontSize: 15,
                                        }}
                                    >
                                        Giriş Yap
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Info Box */}
                            <View
                                style={{
                                    backgroundColor: "#EFF6FF",
                                    borderRadius: 12,
                                    padding: 14,
                                    marginTop: 32,
                                    flexDirection: "row",
                                    alignItems: "flex-start",
                                    borderWidth: 1,
                                    borderColor: "#BFDBFE",
                                }}
                            >
                                <Ionicons
                                    name="information-circle"
                                    size={20}
                                    color="#3B82F6"
                                />
                                <Text
                                    style={{
                                        flex: 1,
                                        marginLeft: 10,
                                        fontSize: 13,
                                        color: "#1E40AF",
                                        lineHeight: 18,
                                    }}
                                >
                                    Şifre sıfırlama bağlantısı 24 saat geçerlidir. E-postayı
                                    almadıysanız spam klasörünü kontrol edin.
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}