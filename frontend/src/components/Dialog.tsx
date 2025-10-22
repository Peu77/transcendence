import {
  h,
  Fragment,
  useEffect,
  useRef,
  useState,
  createPortal,
} from "refreshjs";
import { cn } from "./utils";
import { Icon } from "@/components/Icon";
import Button, { ButtonSize, ButtonVariant } from "@/components/Button";

function injectDialogProps(child: any, extra: any) {
  if (!child || typeof child !== "object") return child;
  const childType = child.type;
  if (childType === DialogTrigger || childType === DialogContent) {
    const nextProps = { ...(child.props || {}), ...(extra || {}) };
    return h(childType, nextProps, ...(child.props?.children || []));
  }
  return child;
}

let dialogIdSeq = 0;

export default function Dialog(props: { children: any }) {
  const [open, setOpen] = useState(false);
  const idRef = useRef<number>(0 as any);
  if (!idRef.current) idRef.current = ++dialogIdSeq;

  const enhanced = (props.children || []).map((c: any) =>
    injectDialogProps(c, { open, setOpen, __dialogId: idRef.current }),
  );

  return <span className="contents">{enhanced}</span>;
}

export function DialogTrigger(props: {
  children: any;
  className?: string;
  disabled?: boolean;
  open?: boolean;
  setOpen?: (v: boolean) => void;
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const { className, children, disabled, setOpen, asChild } = props as any;
  const onClick = () => {
    if (disabled) return;
    setOpen && setOpen(true);
  };

  if (asChild) {
    return (
      <span onClick={onClick} aria-haspopup="dialog">
        {children}
      </span>
    );
  }

  return (
    <Button
      variant={props.variant}
      size={props.size}
      onClick={onClick}
      className={className}
      disabled={disabled}
      aria-haspopup="dialog"
    >
      {children}
    </Button>
  );
}

export function DialogContent(props: {
  children: any;
  className?: string;
  overlayClassName?: string;
  open?: boolean;
  setOpen?: (v: boolean) => void;
  __dialogId?: number;
}) {
  const { children, className, overlayClassName, open, setOpen } = props as any;
  const contentRef = useRef<HTMLElement | null>(null as any);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen && setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null as any;

  const close = () => setOpen && setOpen(false);

  const overlay = (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
        overlayClassName,
      )}
      onClick={close}
    />
  );

  const panel = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        ref={contentRef as any}
        className={cn(
          "relative w-full max-w-lg clip-pixel-corners-btn bg-card text-card-foreground shadow-2xl",
          "border border-border",
          className,
        )}
        onClick={(e: any) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-offset-2"
          aria-label="Close"
        >
          <Icon name="X" />
        </button>
        {children}
      </div>
    </div>
  );

  return createPortal(
    <Fragment>
      {overlay}
      {panel}
    </Fragment>,
  );
}

export function DialogHeader(props: { children: any; className?: string }) {
  const { children, className } = props;
  return (
    <div className={cn("flex flex-col gap-1.5 p-6", className)}>{children}</div>
  );
}

export function DialogTitle(props: {
  children: any;
  className?: string;
  id?: string;
}) {
  const { children, className, id } = props;
  return (
    <h2
      className={cn(
        "text-xl font-semibold leading-none tracking-tight",
        className,
      )}
      id={id}
    >
      {children}
    </h2>
  );
}

export function DialogDescription(props: {
  children: any;
  className?: string;
  id?: string;
}) {
  const { children, className, id } = props;
  return (
    <p className={cn("text-sm text-muted-foreground", className)} id={id}>
      {children}
    </p>
  );
}
