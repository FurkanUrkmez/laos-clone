import { useState } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export function TextField({ label, error, isPassword = false, ...inputProps }: TextFieldProps) {
  const [isSecure, setIsSecure] = useState(isPassword);

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-medium text-textPrimary">{label}</Text>
      <View
        className={`flex-row items-center rounded-xl border bg-cardBackground px-4 ${
          error ? 'border-red-400' : 'border-cream'
        }`}
      >
        <TextInput
          className="h-12 flex-1 text-base text-textPrimary"
          placeholderTextColor="#8A7563"
          secureTextEntry={isSecure}
          autoCapitalize="none"
          {...inputProps}
        />
        {isPassword ? (
          <Pressable onPress={() => setIsSecure((prev) => !prev)} hitSlop={8}>
            <Ionicons name={isSecure ? 'eye-off-outline' : 'eye-outline'} size={20} color="#8A7563" />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="mt-1 text-xs text-red-500">{error}</Text> : null}
    </View>
  );
}
