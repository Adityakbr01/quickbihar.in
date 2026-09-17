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
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
      <div className="text-sm text-muted-foreground">
        Page {page} of {Math.max(totalPages, 1)}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="border-border bg-muted text-foreground hover:bg-muted"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          className="border-border bg-muted text-foreground hover:bg-muted"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
