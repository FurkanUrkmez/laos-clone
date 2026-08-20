import { Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolveAssetUrl } from '../../utils/assetUrl';
import type { MainStackParamList } from '../../navigation/MainNavigator';

type CampaignDetailRouteProp = RouteProp<MainStackParamList, 'CampaignDetail'>;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('tr-TR');
}

export function CampaignDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<CampaignDetailRouteProp>();
  const { campaign } = params;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center px-5 pt-2">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={26} color="#6B3E26" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        {campaign.imageUrl && (
          <Image
            source={{ uri: resolveAssetUrl(campaign.imageUrl) ?? undefined }}
            style={{ height: 180, width: '100%', borderRadius: 16, marginTop: 12 }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        )}
        <Text className="mt-4 text-2xl font-bold text-textPrimary">{campaign.title}</Text>
        <Text className="mt-1 text-sm text-textSecondary">
          {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
        </Text>
        {campaign.description && (
          <Text className="mt-4 text-base leading-6 text-textPrimary">{campaign.description}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
