import type React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info";
}

export function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em]";

  const variants = {
    default: "border-slate-200 bg-slate-100 text-slate-600",
    primary: "border-red-200 bg-red-50 text-red-700",
    secondary: "border-violet-200 bg-violet-50 text-violet-700",
    success: "border-green-200 bg-green-50 text-green-700",
    warning: "border-orange-200 bg-orange-50 text-orange-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
