import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { CoffeeProgress } from '../../components/CoffeeProgress';
import { Button } from '../../components/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { myLoyaltyRequest, MyLoyalty } from '../../services/api/loyalty';
import { campaignsRequest, Campaign } from '../../services/api/campaigns';
import { blogPostsRequest, BlogPost } from '../../services/api/blog';
import { usePaginatedList } from '../../hooks/usePaginatedList';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'İyi Geceler';
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi Günler';
  return 'İyi Akşamlar';
}

const CARD_LIST_STYLE = { gap: 12, paddingRight: 16 };

function FeedCard({
  imageUrl,
  fallbackIcon,
  title,
  description,
}: {
  imageUrl: string | null;
  fallbackIcon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
}) {
  return (
    <View className="w-60 rounded-2xl bg-cardBackground p-4">
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ height: 96, width: '100%', borderRadius: 16, marginBottom: 12 }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
      ) : (
        <View className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-cream">
          <Ionicons name={fallbackIcon} size={20} color="#6B3E26" />
        </View>
      )}
      <Text className="text-base font-semibold text-textPrimary" numberOfLines={1}>
        {title}
      </Text>
      <Text className="mt-1 text-sm text-textSecondary" numberOfLines={2}>
        {description}
      </Text>
    </View>
  );
}

function LoadMoreFooter({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <View className="w-10 items-center justify-center">
      <ActivityIndicator color="#6B3E26" />
    </View>
  );
}

export function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const greeting = useMemo(getGreeting, []);
  const firstName = user?.fullName?.split(' ')[0] ?? '';

  const [loyalty, setLoyalty] = useState<MyLoyalty | null>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    myLoyaltyRequest()
      .then((data) => {
        if (!cancelled) setLoyalty(data);
      })
      .catch((err) => {
        console.warn('Kahve puanı yüklenemedi', err);
      })
      .finally(() => {
        if (!cancelled) setLoyaltyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const campaigns = usePaginatedList<Campaign>((page) =>
    campaignsRequest(page).then(({ campaigns: items, hasMore }) => ({ items, hasMore })),
  );
  const blogPosts = usePaginatedList<BlogPost>((page) =>
    blogPostsRequest(page).then(({ posts: items, hasMore }) => ({ items, hasMore })),
  );

  return (
    <ScreenContainer scroll>
      <View className="mb-6 mt-4">
        <Text className="text-2xl font-bold text-primary">
          {greeting}, {firstName}
        </Text>
        <Text className="mt-1 text-textSecondary">Bugün bir kahveye ne dersin?</Text>
      </View>

      {loyaltyLoading ? (
        <View className="items-center rounded-2xl bg-cardBackground p-4">
          <ActivityIndicator color="#6B3E26" />
        </View>
      ) : (
        loyalty && <CoffeeProgress earned={loyalty.pointsBalance} target={loyalty.threshold} />
      )}

      <View className="mt-4 rounded-2xl bg-primary p-5">
        <Text className="text-sm text-cream">Kart Bakiyesi</Text>
        <Text className="mt-1 text-3xl font-bold text-white">0.0₺</Text>
        <View className="mt-4">
          <Button
            label="Para Yükle"
            variant="secondary"
            onPress={() => Alert.alert('Yakında', 'Para yükleme özelliği yakında eklenecek.')}
          />
        </View>
      </View>

      <Text className="mb-3 mt-6 text-lg font-semibold text-textPrimary">Kampanyalar</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={campaigns.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={CARD_LIST_STYLE}
        onEndReachedThreshold={0.5}
        onEndReached={campaigns.loadMore}
        ListFooterComponent={<LoadMoreFooter loading={campaigns.loading} />}
        renderItem={({ item }) => (
          <FeedCard
            imageUrl={item.imageUrl}
            fallbackIcon="pricetag-outline"
            title={item.title}
            description={item.description ?? ''}
          />
        )}
      />

      <Text className="mb-3 mt-6 text-lg font-semibold text-textPrimary">Bloglar</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={blogPosts.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={CARD_LIST_STYLE}
        onEndReachedThreshold={0.5}
        onEndReached={blogPosts.loadMore}
        ListFooterComponent={<LoadMoreFooter loading={blogPosts.loading} />}
        renderItem={({ item }) => (
          <FeedCard
            imageUrl={item.coverImageUrl}
            fallbackIcon="book-outline"
            title={item.title}
            description={item.excerpt}
          />
        )}
      />
    </ScreenContainer>
  );
}
