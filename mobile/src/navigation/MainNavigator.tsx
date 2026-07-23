import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { QrCodeScreen } from '../screens/main/QrCodeScreen';

export type MainStackParamList = {
  Tabs: undefined;
  QrModal: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabNavigator} />
      <Stack.Screen name="QrModal" component={QrCodeScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
