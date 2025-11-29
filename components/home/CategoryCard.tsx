// components/home/CategoryCard.tsx
import { TouchableOpacity, Text, Image, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '@/lib/types';
import { COLORS } from '@/lib/constants';

interface CategoryCardProps {
    category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
    const router = useRouter();

    // Supabase Storage URL kontrolü
    const getImageSource = () => {
        if (category.image_url) {
            return { uri: category.image_url };
        }
        return null;
    };

    const imageSource = getImageSource();

    return (
        <TouchableOpacity
            onPress={() => router.push(`/category/${category.id}`)}
            className="items-center"
            activeOpacity={0.7}
        >
            <View
                className="w-16 h-16 rounded-2xl items-center justify-center overflow-hidden mb-2"
                style={{ backgroundColor: category.color + '20' }}
            >
                {imageSource ? (
                    <Image
                        source={imageSource}
                        className="w-14 h-14"
                        resizeMode="contain"
                    />
                ) : (
                    <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: category.color + '40' }}
                    >
                        <Ionicons
                            name={(category.icon as any) || 'grid-outline'}
                            size={24}
                            color={category.color}
                        />
                    </View>
                )}
            </View>
            <Text
                className="text-xs text-center font-medium"
                style={{ color: COLORS.dark }}
                numberOfLines={2}
            >
                {category.name}
            </Text>
            {category.item_count > 0 && (
                <Text
                    className="text-xs text-center"
                    style={{ color: COLORS.gray }}
                >
                    {category.item_count} ürün
                </Text>
            )}
        </TouchableOpacity>
    );
}