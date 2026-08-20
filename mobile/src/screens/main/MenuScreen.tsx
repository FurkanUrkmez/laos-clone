import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { productsRequest, Product } from '../../services/api/products';
import { resolveAssetUrl } from '../../utils/assetUrl';

interface Category {
  id: string;
  name: string;
}

export function MenuScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    productsRequest()
      .then((items) => {
        if (cancelled) return;
        setProducts(items);
        setActiveCategory((current) => current ?? items[0]?.categoryId ?? null);
      })
      .catch((err) => {
        console.warn('Ürünler yüklenemedi', err);
        if (!cancelled) setError('Menü yüklenemedi');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Categories come from the products themselves (server already orders
  // them by category sortOrder then name), so tabs stay in sync with
  // whatever the admin panel manages without a separate categories fetch.
  const categories = useMemo<Category[]>(() => {
    const seen = new Map<string, Category>();
    for (const product of products) {
      if (!seen.has(product.categoryId)) {
        seen.set(product.categoryId, { id: product.categoryId, name: product.categoryName });
      }
    }
    return Array.from(seen.values());
  }, [products]);

  const visibleProducts = useMemo(
    () => products.filter((product) => product.categoryId === activeCategory),
    [products, activeCategory],
  );

  return (
    <ScreenContainer>
      <Text className="mb-4 mt-4 text-2xl font-bold text-primary">Menü</Text>

      {loading ? (
        <View className="items-center py-10">
          <ActivityIndicator color="#6B3E26" />
        </View>
      ) : error ? (
        <Text className="text-textSecondary">{error}</Text>
      ) : categories.length === 0 ? (
        <Text className="text-textSecondary">Henüz ürün eklenmemiş.</Text>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 max-h-12">
            {categories.map((category) => (
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
            data={visibleProducts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperClassName="gap-3"
            contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
            renderItem={({ item }) => (
              <View className="flex-1 rounded-2xl bg-cardBackground p-4">
                {item.imageUrl ? (
                  <Image
                    source={{ uri: resolveAssetUrl(item.imageUrl) ?? undefined }}
                    style={{ height: 64, width: 64, borderRadius: 16, marginBottom: 12 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={150}
                  />
                ) : (
                  <View className="mb-3 h-16 w-16 items-center justify-center rounded-2xl bg-cream">
                    <Ionicons name="cafe-outline" size={28} color="#6B3E26" />
                  </View>
                )}
                <Text className="text-base font-semibold text-textPrimary">{item.name}</Text>
                <Text className="mt-1 text-sm text-accent">{item.pointsReward} Puan</Text>
              </View>
            )}
          />
        </>
      )}
    </ScreenContainer>
  );
}
