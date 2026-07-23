import { useMemo } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { CoffeeProgress } from '../../components/CoffeeProgress';
import { Button } from '../../components/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { mockCampaigns } from '../../data/mockData';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'İyi Geceler';
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi Günler';
  return 'İyi Akşamlar';
}

export function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const greeting = useMemo(getGreeting, []);
  const firstName = user?.fullName?.split(' ')[0] ?? '';

  return (
    <ScreenContainer scroll>
      <View className="mb-6 mt-4">
        <Text className="text-2xl font-bold text-primary">
          {greeting}, {firstName}
        </Text>
        <Text className="mt-1 text-textSecondary">Bugün bir kahveye ne dersin?</Text>
      </View>

      <CoffeeProgress earned={3} target={6} />

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
        {mockCampaigns.map((campaign) => (
          <View key={campaign.id} className="mr-3 w-60 rounded-2xl bg-cardBackground p-4">
            <View className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-cream">
              <Ionicons name={campaign.icon} size={20} color="#6B3E26" />
            </View>
            <Text className="text-base font-semibold text-textPrimary">{campaign.title}</Text>
            <Text className="mt-1 text-sm text-textSecondary">{campaign.description}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
