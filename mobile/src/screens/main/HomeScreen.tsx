import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '../../types';
import { ScreenContainer } from '../../components/ScreenContainer';
import { CoffeeProgress } from '../../components/CoffeeProgress';
import { Button } from '../../components/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { myLoyaltyRequest, MyLoyalty } from '../../services/api/loyalty';
import { campaignsRequest } from '../../services/api/campaigns';
import { blogPostsRequest } from '../../services/api/blog';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'İyi Geceler';
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi Günler';
  return 'İyi Akşamlar';
}

interface FeedItem {
  id: string;
  icon: IconName;
  title: string;
  description: string;
}

const BLOG_EXCERPT_LENGTH = 80;

function excerpt(text: string): string {
  return text.length > BLOG_EXCERPT_LENGTH ? `${text.slice(0, BLOG_EXCERPT_LENGTH)}…` : text;
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

  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([campaignsRequest(), blogPostsRequest()])
      .then(([campaigns, posts]) => {
        if (cancelled) return;
        const campaignItems: FeedItem[] = campaigns.map((c) => ({
          id: `campaign-${c.id}`,
          icon: 'pricetag-outline',
          title: c.title,
          description: c.description ?? '',
        }));
        const postItems: FeedItem[] = posts.map((p) => ({
          id: `blog-${p.id}`,
          icon: 'book-outline',
          title: p.title,
          description: excerpt(p.content),
        }));
        setFeed([...campaignItems, ...postItems]);
      })
      .catch((err) => {
        console.warn('Kampanyalar/bloglar yüklenemedi', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

      <Text className="mb-3 mt-6 text-lg font-semibold text-textPrimary">
        Kampanyalar ve Bloglar
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {feed.map((item) => (
          <View key={item.id} className="mr-3 w-60 rounded-2xl bg-cardBackground p-4">
            <View className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-cream">
              <Ionicons name={item.icon} size={20} color="#6B3E26" />
            </View>
            <Text className="text-base font-semibold text-textPrimary">{item.title}</Text>
            <Text className="mt-1 text-sm text-textSecondary">{item.description}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
