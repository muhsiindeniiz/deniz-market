import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';

export default function TermsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                </TouchableOpacity>
                <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                    Kullanım Koşulları
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="bg-white mx-4 my-4 rounded-3xl p-6">
                    <Text className="text-sm mb-2" style={{ color: COLORS.gray }}>
                        Son Güncelleme: 14 Kasım 2025
                    </Text>

                    <Text className="text-2xl font-bold mb-6" style={{ color: COLORS.dark }}>
                        Deniz Market Kullanım Koşulları
                    </Text>

                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Bu kullanım koşulları, Deniz Market mobil uygulamasını kullanımınızı düzenler.
                        Uygulamayı kullanarak bu koşulları kabul etmiş sayılırsınız.
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        1. Genel Hükümler
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Deniz Market, kullanıcılarına çevrimiçi market alışverişi hizmeti sunan bir platformdur.
                        Kullanıcılar, 18 yaşından büyük olmalı veya yasal bir vasinin izni ile platformu kullanmalıdır.
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        2. Hesap Oluşturma
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Platformu kullanmak için geçerli bir e-posta adresi ve telefon numarası ile hesap oluşturmalısınız.
                        Hesap bilgilerinizin güvenliğinden siz sorumlusunuz.
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        3. Sipariş ve Teslimat
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Siparişler, stok durumuna göre kabul edilir. Teslimat süreleri tahminidir ve garanti edilmez.
                        500 TL ve üzeri siparişlerde kargo ücretsizdir.
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        4. Ödeme
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Ödemeler kapıda nakit veya kredi kartı ile yapılabilir. Fiyatlar değişiklik gösterebilir ve
                        KDV dahildir.
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        5. İptal ve İade
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Siparişler, hazırlanma sürecine girmeden iptal edilebilir. Bozuk veya hatalı ürünler için
                        teslimat sırasında veya 24 saat içinde bildirimde bulunulmalıdır.
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        6. Fikri Mülkiyet
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Platformdaki tüm içerik, tasarım ve yazılım Deniz Market'in mülkiyetindedir ve
                        telif hakkı yasaları ile korunmaktadır.
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        7. Sorumluluk Sınırlaması
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Deniz Market, hizmet kesintilerinden, veri kayıplarından veya dolaylı zararlardan
                        sorumlu tutulamaz.
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        8. Değişiklikler
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Bu koşullar herhangi bir zamanda güncellenebilir. Güncellemeler, uygulama üzerinden
                        duyurulacaktır.
                    </Text>

                    <Text className="text-lg font-bold mb-3" style={{ color: COLORS.dark }}>
                        9. İletişim
                    </Text>
                    <Text className="text-base leading-7 mb-6" style={{ color: COLORS.gray }}>
                        Sorularınız için destek@denizmarket.com adresinden bize ulaşabilirsiniz.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}