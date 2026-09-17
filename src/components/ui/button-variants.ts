import { cva } from "class-variance-authority";

/** 全站按钮变体：细边框为主，唯一实心深色块只留给主操作 */
export const btn = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[13px] font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/88",
        accent: "bg-accent text-accent-foreground hover:bg-accent/88",
        outline: "border border-border bg-card text-foreground hover:bg-surface",
        ghost: "text-muted-foreground hover:bg-surface hover:text-foreground",
        subtle: "bg-surface text-secondary-foreground hover:bg-border/60",
        danger: "border border-destructive/30 text-destructive hover:bg-destructive/8",
        link: "text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
      },
      size: {
        sm: "h-7 px-2.5 text-[12px]",
        md: "h-9 px-3.5",
        lg: "h-10 px-5",
        icon: "h-9 w-9",
        iconSm: "h-7 w-7",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

/** 表单控件统一皮肤：白底、1px 细边框、聚焦时深蓝细线 */
export const field =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-[13px] text-foreground outline-none transition-colors placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/15";
