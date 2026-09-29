import React, { useState } from "react";
import { Square, SquareCheckBig } from "lucide-react";
import { useTheme } from "../Provider/ThemeProvider";
import ThemedText from "./ThemedText";


interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  style?: React.CSSProperties;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  style,
}) => {
  const theme = useTheme() as any;
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className="my-2 flex cursor-pointer flex-row items-center"
      style={style}
    >
      <span
        className="mr-2 block transition-transform duration-150"
        style={{ transform: pressed ? "scale(0.9)" : undefined }}
      >
        {checked ? (
          <SquareCheckBig size={24} color={theme.primary} />
        ) : (
          <Square size={24} color={theme.secondaryText} />
        )}
      </span>
      <ThemedText className="text-sm" style={{ color: theme.text }}>{label}</ThemedText>
    </button>
  );
};
