import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalItems: number;
}

export default function Pagination({ page, totalPages, onPageChange, pageSize, onPageSizeChange, totalItems }: PaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Showing {start}–{end} of {totalItems}</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="ml-2 bg-muted rounded px-2 py-1 text-xs border-0 outline-none"
        >
          {[10, 25, 50].map(s => <option key={s} value={s}>{s} / page</option>)}
        </select>
      </div>
      <div className="flex gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => (
          <Button
            key={i}
            variant={page === i + 1 ? "default" : "outline"}
            size="icon"
            className="h-8 w-8 text-xs"
            onClick={() => onPageChange(i + 1)}
          >
            {i + 1}
          </Button>
        )).slice(0, 5)}
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
