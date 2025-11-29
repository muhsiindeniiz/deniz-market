import { TouchableOpacity, Text, Image, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Category } from '@/lib/types';
import { COLORS } from '@/lib/constants';

interface CategoryCardProps {
    category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
    const router = useRouter();

    return (
        <TouchableOpacity
            onPress={() => router.push(`/category/${category.id}`)}
            className="items-center mr-4"
            style={{ width: 80 }}
        >
            <View
                className="w-16 h-16 rounded-2xl items-center justify-center overflow-hidden mb-2"
                style={{ backgroundColor: category.color + '20' }}
            >
                {category.image_url ? (
                    <Image
                        source={{ uri: category.image_url }}
                        className="w-14 h-14"
                        resizeMode="contain"
                    />
                ) : (
                    <View
                        className="w-10 h-10 rounded-full"
                        style={{ backgroundColor: category.color + '40' }}
                    />
                )}
            </View>
            <Text
                className="text-xs text-center font-medium"
                style={{ color: COLORS.dark }}
                numberOfLines={2}
            >
                {category.name}
            </Text>
        </TouchableOpacity>
    );
}