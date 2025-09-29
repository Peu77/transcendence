import { h } from "refreshjs";

export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";
export type ButtonSize = "default" | "sm" | "lg" | "icon";

export function buttonClasses(
  variant: ButtonVariant = "default",
  size: ButtonSize = "default",
) {
  const baseClasses =
    "font-semibold clip-pixel-corners-btn inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  const variantClasses: Record<ButtonVariant, string> = {
    default:
      "bg-primary text-primary-foreground transition-transform duration-200 ease-in-out transform hover:scale-105",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline:
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary:
      "bg-secondary text-secondary-foreground transition-transform duration-200 ease-in-out transform hover:scale-105",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  };
  const sizeClasses: Record<ButtonSize, string> = {
    default: "px-6 py-2",
    sm: "p-1 px-6 rounded-md text-sm",
    lg: "h-11 px-8 rounded-md",
    icon: "h-10 w-10",
  };

  return [baseClasses, variantClasses[variant], sizeClasses[size]].join(" ");
}

export default function Button(props: {
  onClick?: (e: PointerEvent) => void;
  className?: string;
  disabled?: boolean;
  variant?: ButtonVariant;
  children: any;
  size?: ButtonSize;
}) {
  return (
    <button
      onClick={props.onClick}
      className={
        buttonClasses(props.variant, props.size) +
        (props.className ? ` ${props.className}` : "")
      }
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}
