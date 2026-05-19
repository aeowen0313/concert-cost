import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  helper?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  helper,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-[11rem_minmax(0,1fr)] gap-1 sm:gap-x-4 sm:gap-y-1 sm:items-center ${className}`}
    >
      <label htmlFor={htmlFor} className="label py-0 sm:justify-end sm:text-right">
        <span className="label-text font-medium">{label}</span>
      </label>
      <div className="min-w-0">
        {children}
        {helper ? <p className="text-xs opacity-70 mt-1">{helper}</p> : null}
      </div>
    </div>
  );
}
