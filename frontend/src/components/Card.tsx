import { h } from "refreshjs";
import { cn } from "./utils";

export default function Card(props: { children: any; className?: string }) {
  const { children, className } = props;
  return (
    <div class="drop-shadow">
      <div
        className={cn(
          " bg-card text-card-foreground shadow-2xl clip-pixel-corners-btn",
          "overflow-hidden",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function CardHeader(props: { children: any; className?: string }) {
  const { children, className } = props;
  return (
    <div className={cn("flex flex-col gap-1.5 p-6", className)}>{children}</div>
  );
}

export function CardTitle(props: { children: any; className?: string }) {
  const { children, className } = props;
  return (
    <h3
      className={cn(
        "text-xl font-semibold leading-none tracking-tight",
        className,
      )}
    >
      {children}
    </h3>
  );
}

export function CardDescription(props: { children: any; className?: string }) {
  const { children, className } = props;
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
  );
}

export function CardContent(props: { children: any; className?: string }) {
  const { children, className } = props;
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}

export function CardFooter(props: { children: any; className?: string }) {
  const { children, className } = props;
  return (
    <div className={cn("flex items-center p-6 pt-0", className)}>
      {children}
    </div>
  );
}
