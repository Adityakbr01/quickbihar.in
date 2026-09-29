import React from 'react';
import { useTheme } from '@/src/theme/Provider/ThemeProvider';

interface DealProductSkeletonProps {
    width: number;
}

export const DealProductSkeleton = ({ width }: DealProductSkeletonProps) => {
    const theme = useTheme() as any;

    return (
        <div
            className="mb-3 animate-pulse overflow-hidden rounded-2xl border"
            style={{ width, borderColor: theme.border, backgroundColor: theme.background }}
        >
            <div className="h-40 w-full" style={{ backgroundColor: theme.border }} />
            <div className="p-3">
                <div className="h-3.5 w-15 rounded" style={{ backgroundColor: theme.border }} />
                <div className="mt-2">
                    <div className="h-4 w-full rounded" style={{ backgroundColor: theme.border }} />
                    <div className="mt-1 h-4 w-[70%] rounded" style={{ backgroundColor: theme.border }} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <div className="h-5 w-12.5 rounded" style={{ backgroundColor: theme.border }} />
                    <div className="h-4 w-10 rounded" style={{ backgroundColor: theme.border }} />
                </div>
                <div className="mt-2">
                    <div className="h-3.5 w-[60%] rounded" style={{ backgroundColor: theme.border }} />
                </div>
            </div>
        </div>
    );
};
