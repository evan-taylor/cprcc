import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || `input-${generatedId}`;

    return (
      <div className="w-full">
        {label && (
          <label
            className="mb-1.5 block font-medium text-slate-900 text-sm"
            htmlFor={inputId}
          >
            {label}
          </label>
        )}
        <input
          className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 text-sm shadow-sm transition-colors placeholder:text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : ""
          } ${className}`}
          id={inputId}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1.5 text-red-600 text-sm">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-slate-900 text-sm">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  helperText?: string;
  label?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || `textarea-${generatedId}`;

    return (
      <div className="w-full">
        {label && (
          <label
            className="mb-1.5 block font-medium text-slate-900 text-sm"
            htmlFor={textareaId}
          >
            {label}
          </label>
        )}
        <textarea
          className={`resize-vertical min-h-[6rem] w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 text-sm shadow-sm transition-colors placeholder:text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : ""
          } ${className}`}
          id={textareaId}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1.5 text-red-600 text-sm">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-slate-900 text-sm">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
