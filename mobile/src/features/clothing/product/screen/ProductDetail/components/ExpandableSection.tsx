import React, { useState } from "react";
import { View, Text, TouchableOpacity, LayoutAnimation } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles as s } from "../styles";

interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  theme: any;
  defaultOpen?: boolean;
}

export const ExpandableSection = ({
  title,
  children,
  theme,
  defaultOpen = false,
}: ExpandableSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={[s.expandableContainer, { borderBottomColor: theme.border }]}>
      <TouchableOpacity
        style={s.expandableHeader}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen(!open);
        }}
        activeOpacity={0.6}
      >
        <Text style={[s.expandableTitle, { color: theme.text }]}>{title}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={theme.secondaryText}
        />
      </TouchableOpacity>
      {open && <View style={s.expandableBody}>{children}</View>}
    </View>
  );
};
