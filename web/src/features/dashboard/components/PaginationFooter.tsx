import { Button } from "@/components/ui/button";

export function PaginationFooter({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#1c1c1c] px-4 py-3">
      <div className="text-sm text-gray-400">
        Page {page} of {Math.max(totalPages, 1)}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
