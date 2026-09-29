import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import React from "react";
import { cn } from "@/src/lib/utils";

import { Collection } from "@/src/features/Jewelery/data/collections";

function resolveSrc(source: any): string | undefined {
  if (!source) return undefined;
  if (typeof source === "string") return source;
  if (typeof source === "object" && typeof source.uri === "string") return source.uri;
  return source as any;
}

interface CollectionCardProps {
  collection: Collection;
  large?: boolean;
  style?: React.CSSProperties;
}

export function CollectionCard({
  collection,
  large = false,
  style,
}: CollectionCardProps) {
  const navigate = useNavigate();

  const handlePress = () => {
    goTo(navigate, "/jewelery/collections" as any);
  };

  const src = resolveSrc(collection.image);

  return (
    <button
      type="button"
      onClick={handlePress}
      aria-label={collection.name}
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-[2px] text-left transition-opacity active:opacity-92",
        large ? "h-[320px]" : "h-[152px]",
      )}
      style={style}
    >
      {src ? (
        <img
          src={src}
          alt={collection.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(26,22,20,0.28)" }} />
      <div className="absolute right-0 bottom-0 left-0 flex flex-col gap-0.5 p-3.5">
        <span
          className="leading-[30px]"
          style={{
            color: "#F7F3EC",
            fontFamily: "CormorantGaramond_500Medium_Italic",
            fontSize: large ? 26 : 20,
          }}
        >
          {collection.name}
        </span>
        {collection.pieceCount > 0 && (
          <span
            className="text-[11px] tracking-[0.3px]"
            style={{ color: "rgba(247,243,236,0.7)", fontFamily: "DMSans_400Regular" }}
          >
            {collection.pieceCount} pieces
          </span>
        )}
        <div className="mt-1">
          <span
            className="text-[11px] tracking-[1px]"
            style={{ color: "#D4A85A", fontFamily: "DMSans_400Regular" }}
          >
            Explore →
          </span>
        </div>
      </div>
    </button>
  );
}
