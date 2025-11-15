import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';

interface FAQItem {
    question: string;
    answer: string;
}

export default function HelpScreen() {
    const router = useRouter();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const faqCategories = [
        {
            category: 'Sipariş ve Teslimat',
            items: [
                {
                    question: 'Minimum sipariş tutarı nedir?',
                    answer: 'Minimum sipariş tutarı bulunmamaktadır. Ancak 500 TL ve üzeri siparişlerde kargo ücretsizdir.',
                },
                {
                    question: 'Teslimat süresi ne kadar?',
                    answer: 'Siparişleriniz genellikle 30-45 dakika içerisinde adresinize teslim edilir. Sipariş yoğunluğuna göre bu süre değişebilir.',
                },
                {
                    question: 'Hangi bölgelere teslimat yapılıyor?',
                    answer: 'Şu anda İstanbul\'un tüm ilçelerine teslimat yapmaktayız. Yakında yeni şehirler eklenecektir.',
                },
                {
                    question: 'Siparişimi iptal edebilir miyim?',
                    answer: 'Siparişiniz hazırlanmaya başlanmadan önce iptal edebilirsiniz. Sipariş durumunu kontrol ederek iptal işlemi yapabilirsiniz.',
                },
            ],
        },
        {
            category: 'Ödeme',
            items: [
                {
                    question: 'Hangi ödeme yöntemleri kabul ediliyor?',
                    answer: 'Kapıda nakit ve kapıda kredi kartı ile ödeme yapabilirsiniz.',
                },
                {
                    question: 'Fatura alabilir miyim?',
                    answer: 'Evet, sipariş tamamlandıktan sonra e-posta adresinize fatura gönderilir.',
                },
            ],
        },
        {
            category: 'Ürünler',
            items: [
                {
                    question: 'Ürünler taze mi?',
                    answer: 'Tüm ürünlerimiz günlük olarak tedarik edilir ve tazeliği garanti edilir.',
                },
                {
                    question: 'Organik ürünler var mı?',
                    answer: 'Evet, kategorilerimizde organik ürünler bulunmaktadır ve özel olarak işaretlenmiştir.',
                },
                {
                    question: 'Ürün iade edebilir miyim?',
                    answer: 'Bozuk veya eksik ürünler için teslimat sırasında kurye ile iletişime geçebilir veya 24 saat içinde müşteri hizmetlerimizle iletişime geçebilirsiniz.',
                },
            ],
        },
        {
            category: 'Hesap ve Güvenlik',
            items: [
                {
                    question: 'Hesabımı nasıl silebilirim?',
                    answer: 'Hesap silme işlemi için müşteri hizmetlerimizle iletişime geçmeniz gerekmektedir.',
                },
                {
                    question: 'Şifremi unuttum, ne yapmalıyım?',
                    answer: 'Giriş ekranında "Şifremi Unuttum" seçeneğine tıklayarak şifrenizi sıfırlayabilirsiniz.',
                },
            ],
        },
    ];

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
            {/* Header */}
            <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                </TouchableOpacity>
                <Text className="text-xl font-bold" style={{ color: COLORS.dark }}>
                    Yardım / SSS
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Contact Support Card */}
                <View className="bg-white mx-4 mt-4 rounded-3xl p-6">
                    <View className="flex-row items-center mb-3">
                        <View
                            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                            style={{ backgroundColor: COLORS.primary + '20' }}
                        >
                            <Ionicons name="chatbubbles" size={24} color={COLORS.primary} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-lg font-bold mb-1" style={{ color: COLORS.dark }}>
                                Destek Ekibi
                            </Text>
                            <Text className="text-sm" style={{ color: COLORS.gray }}>
                                7/24 hizmetinizdeyiz
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push('/contact')}
                        className="rounded-xl py-3"
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        <Text className="text-white text-center font-semibold">
                            Bize Ulaşın
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* FAQ */}
                {faqCategories.map((category, categoryIndex) => (
                    <View key={categoryIndex} className="mt-6">
                        <Text className="px-6 mb-3 text-base font-bold" style={{ color: COLORS.dark }}>
                            {category.category}
                        </Text>

                        <View className="bg-white mx-4 rounded-3xl overflow-hidden">
                            {category.items.map((item, itemIndex) => {
                                const globalIndex = categoryIndex * 100 + itemIndex;
                                const isExpanded = expandedIndex === globalIndex;

                                return (
                                    <View
                                        key={itemIndex}
                                        style={{
                                            borderBottomWidth: itemIndex < category.items.length - 1 ? 1 : 0,
                                            borderBottomColor: '#F0F0F0',
                                        }}
                                    >
                                        <TouchableOpacity
                                            onPress={() => setExpandedIndex(isExpanded ? null : globalIndex)}
                                            className="px-6 py-4"
                                        >
                                            <View className="flex-row items-center justify-between">
                                                <Text
                                                    className="flex-1 text-base font-semibold mr-3"
                                                    style={{ color: COLORS.dark }}
                                                >
                                                    {item.question}
                                                </Text>
                                                <Ionicons
                                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                                    size={20}
                                                    color={COLORS.gray}
                                                />
                                            </View>

                                            {isExpanded && (
                                                <Text className="mt-3 text-sm leading-6" style={{ color: COLORS.gray }}>
                                                    {item.answer}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ))}

                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
}