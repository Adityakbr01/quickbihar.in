// components/ThemedText.tsx
import { Text, TextProps } from "react-native";
import { useTheme } from "../Provider/ThemeProvider";

export default function ThemedText(props: TextProps) {
  const theme = useTheme();

  return (
    <Text
      {...props}
      style={[
        { color: theme.text },
        props.style, // override allow karega
      ]}
    />
  );
}
