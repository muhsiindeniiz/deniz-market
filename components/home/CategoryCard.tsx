import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
        >
            <View
                className="w-20 h-20 rounded-2xl items-center justify-center mb-2"
                style={{ backgroundColor: category.color + '20' }}
            >
                <Ionicons name={category.icon as any} size={32} color={category.color} />
            </View>
            <Text className="text-sm font-medium text-center" style={{ color: COLORS.dark }}>
                {category.name}
            </Text>
            <Text className="text-xs" style={{ color: COLORS.gray }}>
                {category.item_count} ürün
            </Text>
        </TouchableOpacity>
    );
}