import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Avatar } from '../../components/Avatar';
import { useAuthStore } from '../../store/useAuthStore';
import type { IconName } from '../../types';

const MENU_ITEMS: { label: string; icon: IconName }[] = [
  { label: 'Profili Düzenle', icon: 'person-outline' },
  { label: 'Ödeme Bilgileri', icon: 'card-outline' },
  { label: 'Hesap Hareketleri', icon: 'receipt-outline' },
  { label: 'Şifre Değiştir', icon: 'lock-closed-outline' },
  { label: 'İletişim & Sözleşmeler', icon: 'document-text-outline' },
];

export function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const memberSince = user
    ? new Date(user.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })
    : '';

  return (
    <ScreenContainer scroll>
      <View className="mb-6 mt-6 items-center">
        <Avatar fullName={user?.fullName ?? '?'} size={80} />
        <Text className="mt-3 text-xl font-semibold text-textPrimary">{user?.fullName}</Text>
        <Text className="mt-1 text-sm text-textSecondary">{memberSince} tarihinden beri üye</Text>
      </View>

      <View className="overflow-hidden rounded-2xl bg-cardBackground">
        {MENU_ITEMS.map((item, index) => (
          <Pressable
            key={item.label}
            onPress={() => Alert.alert(item.label, 'Bu özellik yakında eklenecek.')}
            className={`flex-row items-center px-4 py-4 ${
              index !== MENU_ITEMS.length - 1 ? 'border-b border-cream' : ''
            }`}
          >
            <Ionicons name={item.icon} size={20} color="#6B3E26" />
            <Text className="ml-3 flex-1 text-base text-textPrimary">{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#8A7563" />
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={logout}
        className="mt-4 flex-row items-center justify-center rounded-2xl bg-cardBackground px-4 py-4"
      >
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text className="ml-2 text-base font-medium text-red-600">Oturumu Kapat</Text>
      </Pressable>

      <Pressable
        onPress={() =>
          Alert.alert('Hesabı Sil', 'Bu işlem geri alınamaz. Devam etmek istiyor musunuz?', [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Hesabı Sil', style: 'destructive' },
          ])
        }
        className="mt-3 items-center px-4 py-3"
      >
        <Text className="text-sm text-textSecondary">Hesabı Sil</Text>
      </Pressable>
    </ScreenContainer>
  );
}
