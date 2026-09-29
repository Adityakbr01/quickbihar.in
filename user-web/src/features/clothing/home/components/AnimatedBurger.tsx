import React from "react";

interface AnimatedBurgerProps {
  isOpen: boolean;
  onPress: () => void;
  color?: string;
  size?: number;
}

const AnimatedBurger: React.FC<AnimatedBurgerProps> = ({
  isOpen,
  onPress,
  color = "#ffffff",
  size = 22,
}) => {
  const barHeight = 1.8;
  const gap = size * 0.26;
  const shift = gap + barHeight;

  const barTransition = "transform 0.3s ease-out, opacity 0.2s ease-out";

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      className="flex items-center justify-center"
      style={{ width: size + 12, height: size + 12 }}
    >
      <span className="flex flex-col items-center">
        <span
          className="rounded-sm"
          style={{
            width: size,
            height: barHeight,
            backgroundColor: color,
            transform: `translateY(${isOpen ? shift : 0}px) rotate(${isOpen ? 45 : 0}deg)`,
            transition: barTransition,
          }}
        />
        <span
          className="rounded-sm"
          style={{
            width: size,
            height: barHeight,
            backgroundColor: color,
            marginTop: gap,
            marginBottom: gap,
            opacity: isOpen ? 0 : 1,
            transform: `scaleX(${isOpen ? 0 : 1})`,
            transition: barTransition,
          }}
        />
        <span
          className="rounded-sm"
          style={{
            width: size,
            height: barHeight,
            backgroundColor: color,
            transform: `translateY(${isOpen ? -shift : 0}px) rotate(${isOpen ? -45 : 0}deg)`,
            transition: barTransition,
          }}
        />
      </span>
    </button>
  );
};

export default AnimatedBurger;
