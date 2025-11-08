import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
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
    "inline-flex items-center justify-center font-semibold rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500 active:scale-[0.98]",
    secondary:
      "bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200 focus-visible:ring-slate-500 active:scale-[0.98]",
    ghost:
      "text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-500",
    destructive:
      "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500 active:scale-[0.98]",
    outline:
      "border-2 border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-500",
  };

  const sizes = {
    sm: "text-sm px-4 py-2 gap-1.5",
    md: "text-sm px-6 py-2.5 gap-2",
    lg: "text-base px-8 py-3 gap-2.5",
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
