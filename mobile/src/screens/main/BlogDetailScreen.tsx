import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { blogPostRequest, BlogPostDetail } from '../../services/api/blog';
import { resolveAssetUrl } from '../../utils/assetUrl';
import type { MainStackParamList } from '../../navigation/MainNavigator';

type BlogDetailRouteProp = RouteProp<MainStackParamList, 'BlogDetail'>;

export function BlogDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<BlogDetailRouteProp>();

  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    blogPostRequest(params.postId)
      .then((data) => {
        if (!cancelled) setPost(data);
      })
      .catch((err) => {
        console.warn('Blog yazısı yüklenemedi', err);
        if (!cancelled) setError('Yazı yüklenemedi');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.postId]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center px-5 pt-2">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={26} color="#6B3E26" />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#6B3E26" />
        </View>
      ) : error || !post ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-textSecondary">{error ?? 'Yazı bulunamadı'}</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
          {post.coverImageUrl && (
            <Image
              source={{ uri: resolveAssetUrl(post.coverImageUrl) ?? undefined }}
              style={{ height: 180, width: '100%', borderRadius: 16, marginTop: 12 }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
            />
          )}
          <Text className="mt-4 text-2xl font-bold text-textPrimary">{post.title}</Text>
          {post.publishedAt && (
            <Text className="mt-1 text-sm text-textSecondary">
              {new Date(post.publishedAt).toLocaleDateString('tr-TR')}
            </Text>
          )}
          <Text className="mt-4 text-base leading-6 text-textPrimary">{post.content}</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
