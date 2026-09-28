import React, { useState } from "react";
import { View, Text, TouchableOpacity, LayoutAnimation } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react";
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
    <View style={s.expandableContainer}>
      <TouchableOpacity style={s.expandableHeader}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen(!open);
        }}
        activeOpacity={0.6}
      >
        <Text style={[s.expandableTitle, { color: theme.text }]}>{title}</Text>
        {open ? (
          <ChevronUp size={18} color={theme.secondaryText} />
        ) : (
          <ChevronDown size={18} color={theme.secondaryText} />
        )}
      </TouchableOpacity>
      {open && <View style={s.expandableBody}>{children}</View>}
    </View>
  );
};
