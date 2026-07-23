import { useState } from 'react';
import { Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { getFieldErrors, loginFormSchema } from '../../utils/validation';
import { loginRequest } from '../../services/api/auth';
import { getApiErrorMessage } from '../../utils/apiError';
import { useAuthStore } from '../../store/useAuthStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setFormError(null);

    const result = loginFormSchema.safeParse({ email, password });
    if (!result.success) {
      setFieldErrors(getFieldErrors(result.error));
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      const { user, tokens } = await loginRequest(result.data);
      await setSession(user, tokens);
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Giriş yapılamadı'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <View className="mt-16 mb-10">
        <Text className="text-3xl font-bold text-primary">Tekrar Hoş Geldin</Text>
        <Text className="mt-2 text-base text-textSecondary">
          Kahve puanlarını takip etmek için giriş yap
        </Text>
      </View>

      <TextField
        label="E-posta"
        placeholder="ornek@eposta.com"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
      />
      <TextField
        label="Şifre"
        placeholder="••••••••"
        isPassword
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
      />

      {formError ? <Text className="mb-3 text-sm text-red-500">{formError}</Text> : null}

      <Button label="Giriş Yap" onPress={handleSubmit} loading={isSubmitting} />

      <View className="mt-6 flex-row justify-center">
        <Text className="text-textSecondary">Hesabın yok mu? </Text>
        <Text className="font-semibold text-primary" onPress={() => navigation.navigate('Register')}>
          Kayıt Ol
        </Text>
      </View>
    </ScreenContainer>
  );
}
