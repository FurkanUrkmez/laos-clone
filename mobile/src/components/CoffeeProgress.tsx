import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CoffeeProgressProps {
  earned: number;
  target: number;
}

export function CoffeeProgress({ earned, target }: CoffeeProgressProps) {
  const cups = Array.from({ length: target }, (_, index) => index < earned);

  return (
    <View className="rounded-2xl bg-cardBackground p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-textPrimary">Kahve Puanın</Text>
        <Text className="text-sm font-medium text-accent">
          {earned}/{target} Kahve
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {cups.map((filled, index) => (
          <Ionicons
            key={index}
            name={filled ? 'cafe' : 'cafe-outline'}
            size={28}
            color={filled ? '#6B3E26' : '#C7B9AB'}
          />
        ))}
      </View>
    </View>
  );
}
