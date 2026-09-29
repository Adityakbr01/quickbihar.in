import React from "react";
import { Gradient } from "@/src/components/common/Gradient";
import { CAMPAIGNS } from "../lib/dealsConfig";
import { BREAKPOINTS, useWindowWidth } from "@/src/utils/responsive";

export const MoreDealsHeader = ({
  theme,
  activeCampaign,
  setActiveCampaign,
}: any) => {
  const [internalActiveId, setInternalActiveId] = React.useState(
    CAMPAIGNS[0]?.id || "1",
  );

  const activeId = activeCampaign ?? internalActiveId;
  const width = useWindowWidth();
  const isDesktop = width >= BREAKPOINTS.desktopMin;
  // festive active gradient is brand candy (same both modes);
  // only the idle-cream card adapts so it doesn't glow on dark.
  const isDark = theme?.isDark ?? theme?.text === "#ffffff";
  const idleGradient = (isDark
    ? [theme?.tertiaryBackground || "#2c2c2e", theme?.secondaryBackground || "#1c1c1e"]
    : ["#FDF3D1", "#FFFEFA"]) as [string, string];

  const handlePress = (id: string) => {
    if (setActiveCampaign) {
      setActiveCampaign(id);
    }
    setInternalActiveId(id);
  };

  const formatTitle = (title: string) => {
    const upper = title.toUpperCase();
    if (upper === "FOR YOU") return "FOR\nYOU";
    if (upper === "DEAL OF THE DAY") return "DEAL OF\nTHE DAY";

    // For other titles generally replace the middle space with a newline
    const words = upper.split(" ");
    if (words.length > 2) {
      const mid = Math.ceil(words.length / 2);
      return words.slice(0, mid).join(" ") + "\n" + words.slice(mid).join(" ");
    }
    return upper.split(" ").join("\n");
  };

  const list = CAMPAIGNS;

  const renderCard = (camp: (typeof CAMPAIGNS)[number]) => {
    const isActive = activeId === camp.id;
    const imageUri = typeof camp.image === "string" ? camp.image : undefined;
    return (
      <button
        key={camp.id}
        type="button"
        aria-label={`View ${camp.title} Deals`}
        title={`Explore ${camp.title} Deals on QuickBihar`}
        onClick={() => handlePress(camp.id)}
        className="cursor-pointer"
      >
        <Gradient
          colors={isActive ? ["#F15E48", "#FDCE7F"] : idleGradient}
          style={{
            width: isDesktop ? 196 : 120,
            height: isDesktop ? 132 : 100,
            borderRadius: isDesktop ? 18 : 14,
            overflow: "hidden",
            backgroundColor: "#FFF8E7",
            borderTopWidth: 0,
            borderBottomWidth: 3,
            borderLeftWidth: 0.5,
            borderRightWidth: 0.5,
            borderStyle: "solid",
            padding: 8,
            position: "relative",
            borderColor: isActive ? "#F15E48" : isDark ? "rgba(222,132,16,0.45)" : "#DE8410",
          }}
        >
          <span
            className="z-10 px-2 py-1.5 text-center font-black whitespace-pre-line"
            style={{
              fontSize: isDesktop ? 16 : 17,
              lineHeight: isDesktop ? "18px" : "16px",
              color: isActive ? "#FFFFFF" : isDark ? "#F5B04C" : "#E08616",
            }}
          >
            {formatTitle(camp.title)}
          </span>
          <img
            src={imageUri || camp.image}
            alt={`${camp.title} Deals in Bihar`}
            title={`${camp.title} | QuickBihar Deals`}
            className="absolute z-[11] opacity-80"
            style={
              isDesktop
                ? { width: 120, height: 120, bottom: -28, right: 22, objectFit: "contain" }
                : { width: 90, height: 90, bottom: -20, right: 16, objectFit: "contain" }
            }
          />
        </Gradient>
      </button>
    );
  };

  if (isDesktop) {
    return (
      <div className="mt-8 flex flex-col items-center pb-0">
        {/* Left-aligned heading block like mobile section headers. */}
        <div className="w-full max-w-[1080px] px-6 text-left">
          <h2
            className="mb-1.5 text-left text-[28px] font-extrabold tracking-tight"
            style={{ color: theme?.text || "#fff" }}
          >
            Explore More Deals
          </h2>
          <p className="mb-5.5 text-left text-sm font-medium" style={{ color: theme?.secondaryText }}>
            {"Curated festive picks from Bihar's top local stores"}
          </p>
        </div>
        <div className="flex max-w-[1080px] flex-row flex-wrap justify-center gap-4">
          {list.map((camp) => renderCard(camp))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 pb-0">
      <h2
        className="mb-5 text-center text-[22px] font-extrabold tracking-tight"
        style={{ color: theme?.text || "#fff" }}
      >
        Explore More Deals
      </h2>
      <div className="flex flex-row gap-3 overflow-x-auto px-3 py-2.5" style={{ scrollbarWidth: "none" }}>
        {CAMPAIGNS.map((camp) => renderCard(camp))}
      </div>
    </div>
  );
};

export default MoreDealsHeader;
