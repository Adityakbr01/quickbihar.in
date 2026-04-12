import React from 'react';
import { View, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CarouselItem } from '../../lib/data';

interface CarouselSlideProps {
  item: CarouselItem;
  index: number;
}

const CarouselSlide = ({ item }: CarouselSlideProps) => {
  const router = useRouter();

  return (
    <View style={styles.slide}>
      <Pressable
        onPress={() => {
          if (item.link) {
            router.push(item.link as any);
          }
        }}
        style={({ pressed }) => [
          { width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden' },
          pressed && { opacity: 0.85 }
        ]}
      >
        <Image source={item.image} style={styles.slideImage} />
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
