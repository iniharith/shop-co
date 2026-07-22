/**
 * Coded by Harith
 * Kampungcetak ®
 */
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@heroui/button";
import { useSearchParams } from "next/navigation";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function PaginationDemo({ totalPages, onPageChange }: PaginationProps) {
  const current = useSearchParams();
  const page = current.get("page");
  const currentPage = page ? parseInt(page) : 1;
  const hrefForPage = (nextPage: number) => {
    const params = new URLSearchParams(current.toString());
    params.set("page", String(nextPage));
    return `?${params.toString()}`;
  };
  return (
    <Pagination className="w-full">
      <PaginationContent className="flex w-full items-center justify-between">
        <PaginationItem>
          <Button isDisabled={currentPage <= 1} className="bg-muted rounded-full hover:scale-105 transition-all duration-300 border-input p-1">
            <PaginationPrevious
              className="w-full rounded-full hover:bg-transparent"
              href={hrefForPage(Math.max(1, currentPage - 1))}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            />
          </Button>
        </PaginationItem>
        <div className="md:flex hidden items-center gap-2">
          {Array.from({ length: totalPages }, (_, index) => (
            <PaginationItem className="" key={index}>
              <PaginationLink
                href={hrefForPage(index + 1)}
                isActive={index + 1 === currentPage}
                onClick={() => onPageChange(index + 1)}
              >
                {index + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
        </div>
        <div className="md:hidden flex items-center gap-2">
          <PaginationItem>
            <PaginationLink href={hrefForPage(currentPage)} isActive={true}>
              {currentPage}
            </PaginationLink>
          </PaginationItem>
        </div>
        <PaginationItem>
          <Button isDisabled={currentPage >= totalPages} className="bg-muted rounded-full hover:scale-105 transition-all duration-300 border-input p-1">
            <PaginationNext
              className="w-full rounded-full hover:bg-transparent"
              href={hrefForPage(Math.min(totalPages, currentPage + 1))}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
