import React from "react";
import { View } from "react-native";
import { styles as s } from "../styles";

import { useColorScheme } from "react-native";

export const SectionDivider = ({ theme }: { theme: any }) => {
  const isDark = useColorScheme() === "dark";

  return (
    <View
      style={[
        s.sectionDivider,
        { backgroundColor: isDark ? theme.background : theme.secondaryBackground },
      ]}
    />
  );
};
