import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';

export default function PrivacyScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                </TouchableOpacity>
                <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                    Gizlilik Politikası
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="bg-white mx-4 my-4 rounded-3xl p-6">
                    <Text className="text-sm mb-2" style={{ color: COLORS.gray }}>
                        Son Güncelleme: 14 Kasım 2025
                    </Text>

                    <Text className="text-2xl font-bold mb-6" style={{ color: COLORS.dark }}>
                        Gizlilik Politikası
                    </Text>

                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Deniz Market olarak, gizliliğinize önem veriyoruz. Bu politika, kişisel verilerinizin
                        nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        1. Toplanan Bilgiler
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Aşağıdaki kişisel bilgileri topluyoruz:{'\n'}
                        • Ad, soyad{'\n'}
                        • E-posta adresi{'\n'}
                        • Telefon numarası{'\n'}
                        • Teslimat adresi{'\n'}
                        • Sipariş geçmişi{'\n'}
                        • Ödeme bilgileri (şifrelenmiş)
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        2. Bilgilerin Kullanımı
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Topladığımız bilgileri şu amaçlarla kullanırız:{'\n'}
                        • Siparişlerinizi işlemek ve teslim etmek{'\n'}
                        • Müşteri desteği sağlamak{'\n'}
                        • Hizmetlerimizi geliştirmek{'\n'}
                        • Promosyon ve kampanyalar hakkında bilgilendirmek{'\n'}
                        • Yasal yükümlülüklerimizi yerine getirmek
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        3. Bilgi Güvenliği
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Kişisel verilerinizi korumak için endüstri standardı güvenlik önlemleri kullanıyoruz.
                        Tüm hassas bilgiler şifrelenir ve güvenli sunucularda saklanır.
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        4. Bilgi Paylaşımı
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Kişisel bilgilerinizi üçüncü taraflarla paylaşmıyoruz, ancak aşağıdaki durumlar istisnadır:{'\n'}
                        • Teslimat hizmetleri için kargo şirketleri{'\n'}
                        • Ödeme işlemleri için ödeme sağlayıcıları{'\n'}
                        • Yasal gereklilikler
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        5. Çerezler (Cookies)
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Uygulamamız, deneyiminizi geliştirmek için çerezler kullanır. Çerezleri ayarlardan
                        yönetebilirsiniz.
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        6. Haklarınız
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        KVKK kapsamında aşağıdaki haklara sahipsiniz:{'\n'}
                        • Kişisel verilerinize erişim{'\n'}
                        • Düzeltme talep etme{'\n'}
                        • Silme talep etme{'\n'}
                        • İşlemeye itiraz etme{'\n'}
                        • Veri taşınabilirliği
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        7. Çocukların Gizliliği
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Hizmetlerimiz 18 yaş altı kullanıcılara yönelik değildir. Bilerek çocuklardan
                        kişisel bilgi toplamıyoruz.
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        8. Değişiklikler
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler
                        uygulama üzerinden bildirilecektir.
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        9. İletişim
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Gizlilik ile ilgili sorularınız için:{'\n'}
                        E-posta: gizlilik@denizmarket.com{'\n'}
                        Telefon: +90 555 123 4567
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}