import type React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "relative inline-flex items-center justify-center rounded-full font-semibold transition-all duration-[250ms] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary:
      "bg-red-600 text-white shadow-md shadow-red-600/25 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 focus-visible:ring-red-500 active:translate-y-0 active:scale-[0.98]",
    secondary:
      "border border-[color:var(--color-border)] bg-[color:var(--color-bg-subtle)] text-[color:var(--color-text)] hover:-translate-y-0.5 hover:border-[color:var(--color-border-hover)] hover:bg-white hover:shadow-sm focus-visible:ring-slate-500 active:translate-y-0 active:scale-[0.98]",
    ghost:
      "text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-bg-subtle)] hover:text-[color:var(--color-text-emphasis)] focus-visible:ring-slate-500 active:scale-[0.98]",
    destructive:
      "bg-rose-600 text-white shadow-md shadow-rose-600/25 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-600/30 focus-visible:ring-rose-500 active:translate-y-0 active:scale-[0.98]",
    outline:
      "border border-[color:var(--color-border)] bg-white text-[color:var(--color-text)] hover:-translate-y-0.5 hover:border-[color:var(--color-border-hover)] hover:bg-[color:var(--color-bg-subtle)] hover:shadow-sm focus-visible:ring-slate-500 active:translate-y-0 active:scale-[0.98]",
  };

  const sizes = {
    sm: "gap-1.5 px-4 py-2 text-sm",
    md: "gap-2 px-6 py-2.5 text-sm",
    lg: "gap-2.5 px-8 py-3 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
