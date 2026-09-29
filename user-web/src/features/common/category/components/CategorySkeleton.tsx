import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import React from "react";

const CategorySkeleton = () => {
    const theme = useTheme() as any;

    return (
        <div className="flex w-[70px] shrink-0 flex-col items-center">
            <div
                className="mb-1 flex h-16 w-16 animate-pulse items-center justify-center overflow-hidden rounded-full border"
                style={{
                    backgroundColor: theme.tertiaryBackground,
                    borderColor: theme.border,
                }}
            />
            <div
                className="mt-1 h-2.5 w-[80%] animate-pulse rounded-[5px]"
                style={{ backgroundColor: theme.tertiaryBackground }}
            />
        </div>
    );
};

export default CategorySkeleton;
