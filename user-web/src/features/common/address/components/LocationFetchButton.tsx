import React from "react";
import { AppIcon } from "@/src/components/common/AppIcon";
import { Navigation as NavigationIcon } from "lucide-react";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface LocationFetchButtonProps {
  isLocating: boolean;
  onFetch: () => void;
  latitude?: number;
  longitude?: number;
  theme: Theme;
  styles?: any;
}

const LocationFetchButton: React.FC<LocationFetchButtonProps> = ({
  isLocating,
  onFetch,
  latitude,
  longitude,
  theme,
}) => {
  const t = theme as any;
  return (
    <div>
      <button
        type="button"
        onClick={onFetch}
        disabled={isLocating}
        className="mb-6 flex w-full cursor-pointer flex-row items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-dashed py-3 disabled:opacity-70"
        style={{
          backgroundColor: "rgba(0, 122, 255, 0.1)",
          borderColor: "rgba(0, 122, 255, 0.3)",
          opacity: isLocating ? 0.7 : 1,
        }}
      >
        {isLocating ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2"
            style={{
              borderColor: `${t.primary}33`,
              borderTopColor: t.primary,
            }}
          />
        ) : (
          <>
            <AppIcon icon={NavigationIcon} size={20} color={t.primary} />
            <span
              className="text-[15px] font-bold"
              style={{ color: t.primary }}
            >
              Use My Current Location
            </span>
          </>
        )}
      </button>

      {latitude !== 0 && longitude !== 0 && (
        <p
          className="-mt-4 mb-5 text-center font-mono text-xs"
          style={{ color: t.tertiaryText }}
        >
          GPS: {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
        </p>
      )}
    </div>
  );
};

export default LocationFetchButton;
