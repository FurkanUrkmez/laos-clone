import { Text, View } from 'react-native';

interface AvatarProps {
  fullName: string;
  size?: number;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase());
  return initials.join('') || '?';
}

export function Avatar({ fullName, size = 64 }: AvatarProps) {
  return (
    <View
      className="items-center justify-center rounded-full bg-primary"
      style={{ width: size, height: size }}
    >
      <Text className="font-semibold text-white" style={{ fontSize: size * 0.36 }}>
        {getInitials(fullName)}
      </Text>
    </View>
  );
}
