import type React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`editorial-card rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${className}`}
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
    <div
      className={`border-[color:var(--color-border)]/70 border-b px-6 py-5 ${className}`}
      {...props}
    >
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
      className={`rounded-b-2xl border-[color:var(--color-border)]/70 border-t bg-[color:var(--color-bg-subtle)]/70 px-6 py-4 ${className}`}
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
      className={`font-display font-semibold text-[color:var(--color-text-emphasis)] text-xl leading-tight ${className}`}
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
    <p
      className={`mt-1.5 text-[color:var(--color-text-muted)] text-sm leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}
