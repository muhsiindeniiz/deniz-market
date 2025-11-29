// app/(auth)/register.tsx
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import { COLORS } from "@/lib/constants";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Markdown from "react-native-markdown-display";

// Password strength checker
const getPasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
};

const getStrengthColor = (strength: number): string => {
    if (strength <= 1) return "#EF4444";
    if (strength <= 2) return "#F59E0B";
    if (strength <= 3) return "#10B981";
    return "#059669";
};

const getStrengthText = (strength: number): string => {
    if (strength <= 1) return "Zayıf";
    if (strength <= 2) return "Orta";
    if (strength <= 3) return "İyi";
    return "Güçlü";
};

type SheetType = "terms" | "privacy" | null;

export default function RegisterScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { showToast } = useToast();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // BottomSheet states
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [sheetType, setSheetType] = useState<SheetType>(null);
    const [sheetContent, setSheetContent] = useState<string>("");
    const [sheetTitle, setSheetTitle] = useState<string>("");
    const [sheetLoading, setSheetLoading] = useState(false);

    const snapPoints = useMemo(() => ["75%", "90%"], []);

    // Pre-fill from Google signup attempt
    useEffect(() => {
        if (params.email) setEmail(params.email as string);
        if (params.fullName) setFullName(params.fullName as string);
    }, [params]);

    // Validation states
    const isNameValid = fullName.trim().split(/\s+/).length >= 2;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const isPasswordValid = password.length >= 6;
    const isConfirmValid = confirmPassword === password && confirmPassword.length > 0;
    const passwordStrength = getPasswordStrength(password);

    // Calculate form completion
    const completedSteps = [
        isNameValid,
        isEmailValid,
        isPasswordValid,
        isConfirmValid,
        agreedToTerms,
    ].filter(Boolean).length;

    const completionPercentage = (completedSteps / 5) * 100;
    const isFormComplete = completedSteps === 5;

    // Load terms from Supabase
    const loadTerms = async () => {
        setSheetLoading(true);
        try {
            const { data, error } = await supabase
                .from("terms_and_conditions")
                .select("content")
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            setSheetContent(data?.content || "İçerik bulunamadı.");
        } catch (error) {
            console.error("Error loading terms:", error);
            setSheetContent("İçerik yüklenirken bir hata oluştu.");
        } finally {
            setSheetLoading(false);
        }
    };

    // Load privacy policy from Supabase
    const loadPrivacy = async () => {
        setSheetLoading(true);
        try {
            const { data, error } = await supabase
                .from("privacy_policies")
                .select("content")
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            setSheetContent(data?.content || "İçerik bulunamadı.");
        } catch (error) {
            console.error("Error loading privacy:", error);
            setSheetContent("İçerik yüklenirken bir hata oluştu.");
        } finally {
            setSheetLoading(false);
        }
    };

    // Open bottom sheet
    const openSheet = useCallback((type: SheetType) => {
        setSheetType(type);
        setSheetContent("");

        if (type === "terms") {
            setSheetTitle("Kullanım Şartları");
            loadTerms();
        } else if (type === "privacy") {
            setSheetTitle("Gizlilik Politikası");
            loadPrivacy();
        }

        bottomSheetRef.current?.expand();
    }, []);

    // Close bottom sheet
    const closeSheet = useCallback(() => {
        bottomSheetRef.current?.close();
    }, []);

    // Handle sheet changes
    const handleSheetChanges = useCallback((index: number) => {
        if (index === -1) {
            setSheetType(null);
            setSheetContent("");
        }
    }, []);

    // Render backdrop
    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    const validateForm = (): boolean => {
        if (!fullName.trim()) {
            showToast("Lütfen adınızı girin", "warning");
            return false;
        }

        if (!isNameValid) {
            showToast("Lütfen ad ve soyadınızı girin", "warning");
            return false;
        }

        if (!email.trim()) {
            showToast("Lütfen e-posta adresinizi girin", "warning");
            return false;
        }

        if (!isEmailValid) {
            showToast("Geçerli bir e-posta adresi girin", "warning");
            return false;
        }

        if (!isPasswordValid) {
            showToast("Şifre en az 6 karakter olmalıdır", "warning");
            return false;
        }

        if (password !== confirmPassword) {
            showToast("Şifreler eşleşmiyor", "error");
            return false;
        }

        if (!agreedToTerms) {
            showToast("Kullanım şartlarını kabul etmelisiniz", "warning");
            return false;
        }

        return true;
    };

    const handleRegister = async () => {
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                    },
                },
            });

            if (authError) {
                if (authError.message.includes("already registered")) {
                    showToast("Bu e-posta adresi zaten kayıtlı", "error");
                } else {
                    showToast(authError.message || "Kayıt olunamadı", "error");
                }
                return;
            }

            if (!authData.user) {
                showToast("Kullanıcı oluşturulamadı", "error");
                return;
            }

            // Wait for trigger
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Check if profile was created
            const { data: existingProfile } = await supabase
                .from("users")
                .select("id")
                .eq("id", authData.user.id)
                .maybeSingle();

            if (!existingProfile) {
                await supabase.from("users").insert([
                    {
                        id: authData.user.id,
                        email: email.trim(),
                        full_name: fullName.trim(),
                        phone: null,
                        birth_date: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                ]);
            }

            showToast("Harika! 🎉 Profilinizi tamamlayın.", "success");
            router.replace("/(auth)/complete-profile");
        } catch (error: any) {
            showToast(error.message || "Kayıt olunamadı", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Markdown styles
    const markdownStyles = {
        body: { color: COLORS.dark, fontSize: 15, lineHeight: 24 },
        heading1: {
            fontSize: 22,
            fontWeight: "bold" as const,
            color: COLORS.dark,
            marginBottom: 12,
            marginTop: 8,
        },
        heading2: {
            fontSize: 18,
            fontWeight: "bold" as const,
            color: COLORS.dark,
            marginBottom: 10,
            marginTop: 16,
        },
        heading3: {
            fontSize: 16,
            fontWeight: "600" as const,
            color: COLORS.dark,
            marginBottom: 8,
            marginTop: 12,
        },
        paragraph: {
            fontSize: 15,
            color: COLORS.gray,
            lineHeight: 24,
            marginBottom: 12,
        },
        listItem: {
            fontSize: 15,
            color: COLORS.gray,
            lineHeight: 22,
        },
        bullet_list: {
            marginBottom: 12,
        },
        ordered_list: {
            marginBottom: 12,
        },
        link: {
            color: COLORS.primary,
        },
        strong: {
            fontWeight: "bold" as const,
            color: COLORS.dark,
        },
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
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
                                {/* Header */}
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginBottom: 24,
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={() => router.back()}
                                        disabled={isLoading}
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 12,
                                            backgroundColor: "#FFFFFF",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.05,
                                            shadowRadius: 4,
                                            elevation: 1,
                                        }}
                                    >
                                        <Ionicons name="arrow-back" size={22} color={COLORS.dark} />
                                    </TouchableOpacity>
                                </View>

                                {/* Title & Progress */}
                                <View style={{ marginBottom: 24 }}>
                                    <Text
                                        style={{
                                            fontSize: 26,
                                            fontWeight: "800",
                                            color: COLORS.dark,
                                            marginBottom: 6,
                                        }}
                                    >
                                        Hesap Oluştur
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            color: COLORS.gray,
                                            marginBottom: 16,
                                        }}
                                    >
                                        Hemen üye ol, %25 indirim kazan! 🎁
                                    </Text>

                                    {/* Progress Bar */}
                                    <View
                                        style={{
                                            height: 6,
                                            backgroundColor: "#E5E7EB",
                                            borderRadius: 3,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <View
                                            style={{
                                                height: "100%",
                                                backgroundColor: COLORS.primary,
                                                borderRadius: 3,
                                                width: `${completionPercentage}%`,
                                            }}
                                        />
                                    </View>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            color: COLORS.gray,
                                            marginTop: 6,
                                            textAlign: "right",
                                        }}
                                    >
                                        {completedSteps}/5 tamamlandı
                                    </Text>
                                </View>

                                {/* Full Name Input */}
                                <View style={{ marginBottom: 14 }}>
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            fontWeight: "600",
                                            marginBottom: 8,
                                            color: COLORS.dark,
                                        }}
                                    >
                                        Ad Soyad
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
                                            borderColor: isNameValid ? COLORS.primary + "50" : "#E5E7EB",
                                        }}
                                    >
                                        <Ionicons name="person-outline" size={20} color={COLORS.gray} />
                                        <TextInput
                                            placeholder="Adınız Soyadınız"
                                            value={fullName}
                                            onChangeText={setFullName}
                                            autoCapitalize="words"
                                            autoComplete="name"
                                            style={{
                                                flex: 1,
                                                marginLeft: 12,
                                                fontSize: 16,
                                                color: COLORS.dark,
                                            }}
                                            placeholderTextColor="#9CA3AF"
                                            editable={!isLoading}
                                        />
                                        {isNameValid && (
                                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                        )}
                                    </View>
                                </View>

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
                                            borderColor: isEmailValid ? COLORS.primary + "50" : "#E5E7EB",
                                        }}
                                    >
                                        <Ionicons name="mail-outline" size={20} color={COLORS.gray} />
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
                                        {isEmailValid && (
                                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                        )}
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
                                            borderColor: isPasswordValid ? COLORS.primary + "50" : "#E5E7EB",
                                        }}
                                    >
                                        <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} />
                                        <TextInput
                                            placeholder="En az 6 karakter"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            autoComplete="password-new"
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

                                    {/* Password Strength Indicator */}
                                    {password.length > 0 && (
                                        <View style={{ marginTop: 8 }}>
                                            <View
                                                style={{
                                                    flexDirection: "row",
                                                    gap: 4,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                {[1, 2, 3, 4].map((level) => (
                                                    <View
                                                        key={level}
                                                        style={{
                                                            flex: 1,
                                                            height: 4,
                                                            borderRadius: 2,
                                                            backgroundColor:
                                                                passwordStrength >= level
                                                                    ? getStrengthColor(passwordStrength)
                                                                    : "#E5E7EB",
                                                        }}
                                                    />
                                                ))}
                                            </View>
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    color: getStrengthColor(passwordStrength),
                                                    fontWeight: "500",
                                                }}
                                            >
                                                Şifre Gücü: {getStrengthText(passwordStrength)}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Confirm Password Input */}
                                <View style={{ marginBottom: 18 }}>
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            fontWeight: "600",
                                            marginBottom: 8,
                                            color: COLORS.dark,
                                        }}
                                    >
                                        Şifre Tekrar
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
                                            borderColor: isConfirmValid
                                                ? "#10B981"
                                                : confirmPassword.length > 0 && !isConfirmValid
                                                    ? "#EF4444"
                                                    : "#E5E7EB",
                                        }}
                                    >
                                        <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} />
                                        <TextInput
                                            placeholder="Şifrenizi tekrar girin"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry={!showConfirmPassword}
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
                                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Ionicons
                                                name={showConfirmPassword ? "eye-off" : "eye"}
                                                size={22}
                                                color={COLORS.gray}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    {confirmPassword.length > 0 && !isConfirmValid && (
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                color: "#EF4444",
                                                marginTop: 4,
                                            }}
                                        >
                                            Şifreler eşleşmiyor
                                        </Text>
                                    )}
                                </View>

                                {/* Terms Checkbox */}
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "flex-start",
                                        marginBottom: 20,
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={() => setAgreedToTerms(!agreedToTerms)}
                                        disabled={isLoading}
                                        activeOpacity={0.7}
                                        style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: 6,
                                            borderWidth: 2,
                                            borderColor: agreedToTerms ? COLORS.primary : "#D1D5DB",
                                            backgroundColor: agreedToTerms ? COLORS.primary : "#FFFFFF",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            marginRight: 10,
                                            marginTop: 1,
                                        }}
                                    >
                                        {agreedToTerms && (
                                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                        )}
                                    </TouchableOpacity>
                                    <Text
                                        style={{
                                            flex: 1,
                                            fontSize: 13,
                                            color: COLORS.gray,
                                            lineHeight: 18,
                                        }}
                                    >
                                        <TouchableOpacity
                                            onPress={() => openSheet("terms")}
                                            disabled={isLoading}
                                        >
                                            <Text
                                                style={{
                                                    color: COLORS.primary,
                                                    fontWeight: "600",
                                                    fontSize: 13,
                                                    textDecorationLine: "underline",
                                                }}
                                            >
                                                Kullanım Şartları
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={{ color: COLORS.gray, fontSize: 13 }}> ve </Text>
                                        <TouchableOpacity
                                            onPress={() => openSheet("privacy")}
                                            disabled={isLoading}
                                        >
                                            <Text
                                                style={{
                                                    color: COLORS.primary,
                                                    fontWeight: "600",
                                                    fontSize: 13,
                                                    textDecorationLine: "underline",
                                                }}
                                            >
                                                Gizlilik Politikası
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={{ color: COLORS.gray, fontSize: 13 }}>
                                            'nı okudum, kabul ediyorum.
                                        </Text>
                                    </Text>
                                </View>

                                {/* Register Button */}
                                <TouchableOpacity
                                    onPress={handleRegister}
                                    disabled={isLoading || !isFormComplete}
                                    activeOpacity={0.8}
                                    style={{
                                        borderRadius: 14,
                                        paddingVertical: 16,
                                        backgroundColor: isFormComplete ? COLORS.primary : "#D1D5DB",
                                        shadowColor: isFormComplete ? COLORS.primary : "#000",
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: isFormComplete ? 0.3 : 0.1,
                                        shadowRadius: 8,
                                        elevation: isFormComplete ? 4 : 1,
                                        opacity: isLoading ? 0.7 : 1,
                                    }}
                                >
                                    {isLoading ? (
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
                                            Ücretsiz Kayıt Ol
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                {/* Sign In Link */}
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginTop: 24,
                                    }}
                                >
                                    <Text style={{ color: COLORS.gray, fontSize: 15 }}>
                                        Zaten hesabınız var mı?{" "}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => router.push("/(auth)/login")}
                                        disabled={isLoading}
                                    >
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
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>

                {/* Bottom Sheet */}
                <BottomSheet
                    ref={bottomSheetRef}
                    index={-1}
                    snapPoints={snapPoints}
                    onChange={handleSheetChanges}
                    enablePanDownToClose
                    backdropComponent={renderBackdrop}
                    backgroundStyle={{
                        backgroundColor: "#FFFFFF",
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                    }}
                    handleIndicatorStyle={{
                        backgroundColor: "#D1D5DB",
                        width: 40,
                    }}
                >
                    {/* Sheet Header */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingHorizontal: 20,
                            paddingBottom: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: "#F3F4F6",
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: "700",
                                color: COLORS.dark,
                            }}
                        >
                            {sheetTitle}
                        </Text>
                        <TouchableOpacity
                            onPress={closeSheet}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: "#F3F4F6",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Ionicons name="close" size={20} color={COLORS.dark} />
                        </TouchableOpacity>
                    </View>

                    {/* Sheet Content */}
                    <BottomSheetScrollView
                        contentContainerStyle={{
                            padding: 20,
                            paddingBottom: 40,
                        }}
                        showsVerticalScrollIndicator={false}
                    >
                        {sheetLoading ? (
                            <View
                                style={{
                                    paddingVertical: 60,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text
                                    style={{
                                        marginTop: 12,
                                        fontSize: 14,
                                        color: COLORS.gray,
                                    }}
                                >
                                    Yükleniyor...
                                </Text>
                            </View>
                        ) : (
                            <Markdown style={markdownStyles}>{sheetContent}</Markdown>
                        )}
                    </BottomSheetScrollView>
                </BottomSheet>
            </LinearGradient>
        </GestureHandlerRootView>
    );
}