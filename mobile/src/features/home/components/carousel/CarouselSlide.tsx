import React from 'react';
import { View, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { Banner } from '@/src/features/banner/types/banner.types';
import { useTrackClick } from '@/src/features/banner/hooks/useBanners';

interface CarouselSlideProps {
  item: Banner;
  index: number;
}

const CarouselSlide = ({ item }: CarouselSlideProps) => {
  const router = useRouter();
  const trackClick = useTrackClick();

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Track click analytics
    trackClick.mutate(item._id);

    // Real-world redirection logic
    switch (item.redirectType) {
      case 'category':
      case 'collection':
        router.push({
          pathname: '/(tabs)/search',
          params: { query: item.title || '' }
        });
        break;
      case 'product':
        // Simulated product search
        router.push({
          pathname: '/(tabs)/search',
          params: { query: item.title || '' }
        });
        break;
      case 'external':
        if (item.externalUrl) {
          await WebBrowser.openBrowserAsync(item.externalUrl);
        }
        break;
      default:
        console.warn(`Unhandled redirection type: ${item.redirectType}`);
    }
  };

  return (
    <View style={styles.slide}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          { width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden' },
          pressed && { opacity: 0.85 }
        ]}
      >
        <Image source={{ uri: item.image }} style={styles.slideImage} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 16,
  },
});

export default CarouselSlide;
