import { FlatList, Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { mockBranches } from '../../data/mockData';

export function BranchesScreen() {
  return (
    <ScreenContainer>
      <Text className="mb-4 mt-4 text-2xl font-bold text-primary">Şubeler</Text>
      <FlatList
        data={mockBranches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View className="rounded-2xl bg-cardBackground p-4">
            <Text className="text-lg font-semibold text-textPrimary">{item.name}</Text>
            <View className="mt-2 flex-row items-start gap-2">
              <Ionicons name="location-outline" size={18} color="#8A7563" />
              <Text className="flex-1 text-sm text-textSecondary">{item.address}</Text>
            </View>
            <View className="mt-1 flex-row items-center gap-2">
              <Ionicons name="time-outline" size={18} color="#8A7563" />
              <Text className="text-sm text-textSecondary">{item.hours}</Text>
            </View>
            <Pressable
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
              className="mt-3 flex-row items-center gap-2"
            >
              <Ionicons name="call-outline" size={18} color="#6B3E26" />
              <Text className="text-sm font-medium text-primary">{item.phone}</Text>
            </Pressable>
          </View>
        )}
      />
    </ScreenContainer>
  );
}
