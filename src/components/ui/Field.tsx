import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-fg placeholder:text-subtle transition outline-none hover:border-line-strong focus:border-accent focus:ring-4 focus:ring-accent/15";

export function Field({
  label,
  hint,
  error,
  optional,
  children,
  htmlFor,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium text-fg">
        {label}
        {optional && <span className="text-xs font-normal text-subtle">optionnel</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  suffix,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { suffix?: string }) {
  return (
    <div className="relative">
      <input className={cn(base, "h-11", suffix && "pr-10", className)} {...rest} />
      {suffix && (
        <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-subtle">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(base, "min-h-28 resize-y py-3 leading-relaxed", className)} {...rest} />
  );
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(base, "h-11 appearance-none pr-10", className)} {...rest}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
    </div>
  );
}

/** Input with an auto-generated id wired to its label. */
export function LabeledInput({
  label,
  hint,
  error,
  optional,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  suffix?: string;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} optional={optional} htmlFor={id}>
      <Input id={id} aria-invalid={!!error} {...rest} />
    </Field>
  );
}
