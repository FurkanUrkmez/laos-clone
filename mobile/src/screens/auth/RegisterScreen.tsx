import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { getFieldErrors, registerFormSchema } from '../../utils/validation';
import { registerRequest } from '../../services/api/auth';
import { getApiErrorMessage } from '../../utils/apiError';
import { useAuthStore } from '../../store/useAuthStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const GENDER_OPTIONS: { label: string; value: 'FEMALE' | 'MALE' | 'OTHER' | 'UNSPECIFIED' }[] = [
  { label: 'Kadın', value: 'FEMALE' },
  { label: 'Erkek', value: 'MALE' },
  { label: 'Diğer', value: 'OTHER' },
  { label: 'Belirtmek istemiyorum', value: 'UNSPECIFIED' },
];

export function RegisterScreen({ navigation }: Props) {
  const setSession = useAuthStore((state) => state.setSession);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<(typeof GENDER_OPTIONS)[number]['value']>('UNSPECIFIED');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setFormError(null);

    const result = registerFormSchema.safeParse({ fullName, email, phone, password, gender });
    if (!result.success) {
      setFieldErrors(getFieldErrors(result.error));
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      const { user, tokens } = await registerRequest(result.data);
      await setSession(user, tokens);
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Kayıt oluşturulamadı'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <View className="mt-16 mb-8">
        <Text className="text-3xl font-bold text-primary">Hesap Oluştur</Text>
        <Text className="mt-2 text-base text-textSecondary">
          Kahve puanı kazanmaya hemen başla
        </Text>
      </View>

      <TextField
        label="Ad Soyad"
        placeholder="Ad Soyad"
        value={fullName}
        onChangeText={setFullName}
        error={fieldErrors.fullName}
      />
      <TextField
        label="E-posta"
        placeholder="ornek@eposta.com"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
      />
      <TextField
        label="Telefon Numarası"
        placeholder="05XX XXX XX XX"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        error={fieldErrors.phone}
      />
      <TextField
        label="Şifre"
        placeholder="En az 8 karakter, 1 rakam"
        isPassword
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
      />

      <Text className="mb-1.5 text-sm font-medium text-textPrimary">Cinsiyet</Text>
      <View className="mb-5 flex-row flex-wrap gap-2">
        {GENDER_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setGender(option.value)}
            className={`rounded-full border px-4 py-2 ${
              gender === option.value ? 'border-primary bg-primary' : 'border-cream bg-cardBackground'
            }`}
          >
            <Text className={gender === option.value ? 'text-white' : 'text-textPrimary'}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {formError ? <Text className="mb-3 text-sm text-red-500">{formError}</Text> : null}

      <Button label="Kayıt Ol" onPress={handleSubmit} loading={isSubmitting} />

      <View className="mt-6 flex-row justify-center">
        <Text className="text-textSecondary">Zaten hesabın var mı? </Text>
        <Text className="font-semibold text-primary" onPress={() => navigation.navigate('Login')}>
          Giriş Yap
        </Text>
      </View>
    </ScreenContainer>
  );
}
