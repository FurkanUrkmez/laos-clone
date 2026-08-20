import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';

export function QrCodeScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);

  const qrValue = user ? `laos-clone:user:${user.id}` : 'laos-clone:guest';

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-row justify-end px-5 pt-2">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>
      </View>
      <View className="flex-1 items-center justify-center px-8">
        <View className="rounded-3xl bg-white p-6">
          <QRCode value={qrValue} size={220} color="#6B3E26" backgroundColor="#FFFFFF" />
        </View>
        <Text className="mt-6 text-center text-lg font-semibold text-white">
          {user?.fullName ?? 'Misafir'}
        </Text>
        <Text className="mt-1 text-center text-sm text-cream">
          Kodunu kasada okutarak puan kazan
        </Text>
        {user?.loyaltyCode && (
          <View className="mt-4 items-center rounded-2xl bg-white/10 px-5 py-2">
            <Text className="text-xs text-cream">Kamera çalışmıyorsa bu kodu söyle</Text>
            <Text className="mt-1 text-2xl font-bold tracking-[6px] text-white">
              {user.loyaltyCode}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
