import React from "react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface IOSAlertDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

const IOSAlertDialog: React.FC<IOSAlertDialogProps> = ({
  visible,
  onClose,
  title,
  message,
  buttons,
}) => {
  const theme = useTheme();
  const isDark = theme.background === "#0f0f0f"; // Simple check for dark mode

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[75vw] max-w-[400px] overflow-hidden rounded-[14px]">
        <div
          className="pt-5"
          style={{
            backgroundColor: isDark ? "rgba(30,30,30)" : "rgba(255,255,255)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="flex flex-col items-center px-4 pb-5">
            <h2 className="mb-1 text-center text-[17px] font-semibold" style={{ color: theme.text }}>{title}</h2>
            {message && (
              <p className="text-center text-[13px] leading-[18px]" style={{ color: theme.text }}>
                {message}
              </p>
            )}
          </div>

          <div className="flex flex-col">
            {buttons.map((button, index) => {
              const isDestructive = button.style === "destructive";
              const isCancel = button.style === "cancel";

              return (
                <button
                  key={index}
                  type="button"
                  className="flex h-11 cursor-pointer items-center justify-center border-t transition-opacity hover:opacity-70"
                  style={{
                    borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                  }}
                  onClick={() => {
                    if (button.onPress) button.onPress();
                    onClose();
                  }}
                >
                  <span
                    className="text-[17px]"
                    style={{
                      color: isDestructive
                        ? "#FF3B30"
                        : isDark
                          ? "#0A84FF"
                          : "#007AFF", // iOS System Blue
                      fontWeight: isCancel ? "600" : "400",
                    }}
                  >
                    {button.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IOSAlertDialog;
