import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ImageAdd01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

import LottieView from "lottie-react-native";

interface ProductMediaProps {
  theme: Theme;
  styles: any;
  images: any[];
  pickImage: () => void;
  removeImage: (index: number) => void;
  errors?: any;
}

const ProductMedia = ({
  theme,
  styles,
  images,
  pickImage,
  removeImage,
  errors,
}: ProductMediaProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Media (Max 5)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
        {images.map((img, i) => (
          <View key={i} style={styles.imagePreview}>
            <Image source={{ uri: img.uri || img.url }} style={styles.image} />
            <TouchableOpacity onPress={() => removeImage(i)} style={styles.removeImageBtn}>
              <HugeiconsIcon icon={Delete02Icon} size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
        {images.length < 5 && (
          <TouchableOpacity onPress={pickImage} style={[styles.addImageBtn, errors?.images && { borderColor: theme.error }]}>
            <LottieView
              source={require("@/assets/lottie/Upload.json")}
              autoPlay
              loop
              style={{ width: 60, height: 60 }}
            />
          </TouchableOpacity>
        )}
      </ScrollView>
      {errors?.images && <Text style={[styles.errorText, { marginTop: 0 }]}>{errors.images}</Text>}
    </View>
  );
};

export default ProductMedia;
