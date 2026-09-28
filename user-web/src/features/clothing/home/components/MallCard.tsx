import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

import { Gradient } from "@/src/components/common/Gradient";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createTopMallSectionStyles } from "../style/TopMallSection.style";
import type { TopMall } from "../api/mall.api";
import { AppIcon } from "@/src/components/common/AppIcon";
import { MapPin, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";

interface MallCardProps {
  mall: TopMall;
}

export const MallCard = ({ mall }: MallCardProps) => {
  const navigate = useNavigate();
  const theme = useTheme() as any;
  const styles = React.useMemo(() => createTopMallSectionStyles(theme), [theme]);

  const mallTitle = mall.name || "Shopping Mall";
  const mallLoc = mall.location || "Bihar";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.cardContainer}
      accessibilityRole="link"
      accessibilityLabel={`Visit ${mallTitle} in ${mallLoc}`}
      {...({ title: `Explore ${mallTitle} stores and offers in ${mallLoc}` } as any)}
      onPress={() => goTo(navigate, `/mall/${mall.id || mall._id}` as any)}
    >
      <img src={mall.image} alt={`${mallTitle} - Shopping Mall in ${mallLoc}`} aria-label={`${mallTitle} Mall`} style={Object.assign({}, styles.cardImage, { objectFit: "cover" as const })} {...({ title: `${mallTitle} | QuickBihar Local Mall` } as any)} />
      
      {/* Dynamic Rating Badge */}
      <View style={styles.ratingBadge}>
        <Star size={12} color="#facc15" fill="#facc15" />
        <Text style={styles.ratingText}>{mall.rating}</Text>
      </View>

      <Gradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.gradientOverlay}
      >
        <Text style={styles.mallName} numberOfLines={1}>
          {mall.name}
        </Text>
        <View style={styles.locationContainer}>
          <AppIcon icon={MapPin} size={12} color="rgba(255, 255, 255, 0.8)" />
          <Text style={styles.locationText} numberOfLines={1}>
            {mall.location}
          </Text>
        </View>
      </Gradient>
    </TouchableOpacity>
  );
};
