import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { mockCategories, mockProducts } from '../../data/mockData';

export function MenuScreen() {
  const [activeCategory, setActiveCategory] = useState(mockCategories[0].id);

  const products = useMemo(
    () => mockProducts.filter((product) => product.categoryId === activeCategory),
    [activeCategory],
  );

  return (
    <ScreenContainer>
      <Text className="mb-4 mt-4 text-2xl font-bold text-primary">Menü</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 max-h-12">
        {mockCategories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => setActiveCategory(category.id)}
            className={`mr-2 h-10 justify-center rounded-full px-4 ${
              activeCategory === category.id ? 'bg-primary' : 'bg-cream'
            }`}
          >
            <Text className={activeCategory === category.id ? 'text-white' : 'text-textPrimary'}>
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperClassName="gap-3"
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View className="flex-1 rounded-2xl bg-cardBackground p-4">
            <View className="mb-3 h-16 w-16 items-center justify-center rounded-2xl bg-cream">
              <Ionicons name={item.icon} size={28} color="#6B3E26" />
            </View>
            <Text className="text-base font-semibold text-textPrimary">{item.name}</Text>
            <Text className="mt-1 text-sm text-accent">{item.pointsReward} Puan</Text>
          </View>
        )}
      />
    </ScreenContainer>
  );
}
