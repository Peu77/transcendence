import { h } from "refreshjs";
import { cn } from "./utils";

export default function Input(props: {
  type?: string;
  placeholder?: string;
  value?: string | number | undefined;
  onChange?: (e: Event & { target: HTMLInputElement }) => void;
  onBlur?: (e: FocusEvent & { target: HTMLInputElement }) => void;
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
  checked?: boolean;
  [key: string]: any;
}) {
  const {
    type = "text",
    placeholder,
    value,
    onChange,
    onBlur,
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
    checked,
    ...rest
  } = props as any;

  const ariaInvalid = (props as any)["aria-invalid"] as
    | boolean
    | "true"
    | "false"
    | undefined;
  const ariaDescribedBy = (props as any)["aria-describedby"] as
    | string
    | undefined;

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value as any}
      onInput={props.onChange as any}
      onBlur={onBlur as any}
      disabled={disabled}
      name={name}
      id={id}
      autoComplete={autoComplete || "off"}
      autoFocus={autoFocus}
      maxLength={maxLength}
      minLength={minLength}
      pattern={pattern}
      readOnly={readOnly}
      required={required}
      checked={checked}
      aria-invalid={ariaInvalid as any}
      aria-describedby={ariaDescribedBy}
      className={cn(
        "retro-input clip-pixel-corners-btn",
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "h-9 w-full min-w-0 bg-input px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "border border-transparent",
        "aria-invalid:border-destructive",
        className,
      )}
      {...rest}
    />
  );
}
