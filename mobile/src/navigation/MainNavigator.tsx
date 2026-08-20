import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { QrCodeScreen } from '../screens/main/QrCodeScreen';
import { BlogDetailScreen } from '../screens/main/BlogDetailScreen';
import { CampaignDetailScreen } from '../screens/main/CampaignDetailScreen';
import type { Campaign } from '../services/api/campaigns';

export type MainStackParamList = {
  Tabs: undefined;
  QrModal: undefined;
  BlogDetail: { postId: string };
  CampaignDetail: { campaign: Campaign };
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabNavigator} />
      <Stack.Screen name="QrModal" component={QrCodeScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
      <Stack.Screen name="CampaignDetail" component={CampaignDetailScreen} />
    </Stack.Navigator>
  );
}
