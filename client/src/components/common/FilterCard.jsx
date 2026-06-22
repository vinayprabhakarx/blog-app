import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

export const FilterCard = ({
  isOpen,
  onClear,
  onApply,
  disableApply = false,
  className = "mb-6",
  children,
}) => {
  if (!isOpen) return null;

  return (
    <Card className={cn(className)}>
      <CardContent className="p-4">
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            {children}
          </div>

          <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-3 border-t border-border mt-4 pt-4">
            <Button
              variant="outline"
              size="sm"
              className="text-sm h-10 sm:h-9 w-full sm:w-auto"
              onClick={onClear}
            >
              Clear Filters
            </Button>
            <Button
              size="sm"
              className="text-sm h-10 sm:h-9 w-full sm:w-auto"
              onClick={onApply}
              disabled={disableApply}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
