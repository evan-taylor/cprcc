import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHeader({
  className = "",
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div className={`px-6 py-5 border-b border-slate-100 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContent({
  className = "",
  children,
  ...props
}: CardContentProps) {
  return (
    <div className={`px-6 py-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({
  className = "",
  children,
  ...props
}: CardFooterProps) {
  return (
    <div
      className={`px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function CardTitle({
  className = "",
  children,
  ...props
}: CardTitleProps) {
  return (
    <h3
      className={`font-display font-semibold text-xl text-slate-900 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function CardDescription({
  className = "",
  children,
  ...props
}: CardDescriptionProps) {
  return (
    <p className={`text-sm text-slate-900 mt-1.5 ${className}`} {...props}>
      {children}
    </p>
  );
}
