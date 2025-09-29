import { h } from "refreshjs";
import { cn } from "./utils";

export default function Input(props: {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: Event & { target: HTMLInputElement }) => void;
  className?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  readOnly?: boolean;
  required?: boolean;
}) {
  const {
    type = "text",
    placeholder,
    value,
    onChange,
    className,
    disabled = false,
    name,
    id,
    autoComplete,
    autoFocus,
    maxLength,
    minLength,
    pattern,
    readOnly,
    required,
  } = props;

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      name={name}
      id={id}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      maxLength={maxLength}
      minLength={minLength}
      pattern={pattern}
      readOnly={readOnly}
      required={required}
      className={cn(
        "retro-input clip-pixel-corners-btn",
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "h-9 w-full min-w-0 bg-input px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "border border-transparent",
        "aria-invalid:border-destructive",
        className,
      )}
    />
  );
}
