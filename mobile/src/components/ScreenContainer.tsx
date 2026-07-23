import { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenContainerProps extends PropsWithChildren {
  scroll?: boolean;
  className?: string;
}

export function ScreenContainer({ children, scroll = false, className }: ScreenContainerProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          className={className ?? 'flex-1 px-5'}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {children}
        </ScrollView>
      ) : (
        <View className={className ?? 'flex-1 px-5'}>{children}</View>
      )}
    </SafeAreaView>
  );
}
