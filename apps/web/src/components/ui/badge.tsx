import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200",
        premium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
        free: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
        gradientTeal: "bg-gradient-to-r from-[#04757B] to-[#05D6DD] text-white rounded-lg text-xs",
        gradientYellow: "bg-gradient-to-r from-[#EDB730] to-[#F0E651] text-[#3b2f00] rounded-lg text-xs",
        outline: "border border-border text-muted-foreground",
        danger: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
        info: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
