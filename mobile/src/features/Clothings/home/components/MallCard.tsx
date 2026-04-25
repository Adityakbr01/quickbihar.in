import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createTopMallSectionStyles } from "../style/TopMallSection.style";
import { Mall } from "../lib/mockData";
import { StarIcon, Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";

interface MallCardProps {
  mall: Mall;
}

export const MallCard = ({ mall }: MallCardProps) => {
  const theme = useTheme() as any;
  const styles = React.useMemo(() => createTopMallSectionStyles(theme), [theme]);

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.cardContainer}>
      <Image source={{ uri: mall.image }} style={styles.cardImage} resizeMode="cover" />
      
      {/* Dynamic Rating Badge */}
      <View style={styles.ratingBadge}>
        <HugeiconsIcon icon={StarIcon} size={12} color="#facc15" />
        <Text style={styles.ratingText}>{mall.rating}</Text>
      </View>

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.gradientOverlay}
      >
        <Text style={styles.mallName} numberOfLines={1}>
          {mall.name}
        </Text>
        <View style={styles.locationContainer}>
          <HugeiconsIcon icon={Location01Icon} size={12} color="rgba(255, 255, 255, 0.8)" />
          <Text style={styles.locationText} numberOfLines={1}>
            {mall.location}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};
