
import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm ring-offset-background placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
            error && "border-status-error focus:ring-status-error",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
