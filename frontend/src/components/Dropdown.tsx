import {
  h,
  Fragment,
  useEffect,
  useRef,
  useState,
  createPortal,
} from "refreshjs";
import { cn } from "./utils";
import Button, { ButtonSize, ButtonVariant } from "@/components/Button";

function injectDropdownProps(child: any, extra: any) {
  if (!child || typeof child !== "object") return child;
  const childType = child.type;
  if (
    childType === DropdownTrigger ||
    childType === DropdownContent ||
    childType === DropdownItem ||
    childType === DropdownLabel ||
    childType === DropdownSeparator
  ) {
    const nextProps = { ...(child.props || {}), ...(extra || {}) };
    return h(childType, nextProps, ...(child.props?.children || []));
  }
  return child;
}

let dropdownIdSeq = 0;

export default function Dropdown(props: { children: any }) {
  const [open, setOpen] = useState(false);
  const idRef = useRef<number>(0 as any);
  if (!idRef.current) idRef.current = ++dropdownIdSeq;

  const childrenArray = props.children
    ? Array.isArray(props.children)
      ? props.children
      : [props.children]
    : [];

  const enhanced = childrenArray.map((c: any) =>
    injectDropdownProps(c, { open, setOpen, __dropdownId: idRef.current }),
  );

  return <span className="contents">{enhanced}</span>;
}

export function DropdownTrigger(props: {
  children: any;
  className?: string;
  disabled?: boolean;
  open?: boolean;
  setOpen?: (v: boolean) => void;
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  __dropdownId?: number;
}) {
  const {
    className,
    children,
    disabled,
    setOpen,
    asChild,
    open,
    __dropdownId,
  } = props as any;
  const onClick = (e?: any) => {
    if (disabled) return;
    setOpen && setOpen(!open);
  };

  const dataAttrs: any = { "data-dropdown-id": __dropdownId };

  if (asChild) {
    return (
      <span
        {...dataAttrs}
        onClick={onClick}
        aria-haspopup="menu"
        aria-expanded={!!open}
      >
        {children}
      </span>
    );
  }

  return (
    <Button
      {...dataAttrs}
      variant={props.variant}
      size={props.size}
      onClick={onClick}
      className={className}
      disabled={disabled}
      aria-haspopup="menu"
      aria-expanded={!!open}
    >
      {children}
    </Button>
  );
}

export function DropdownContent(props: {
  children: any;
  className?: string;
  sideOffset?: number;
  align?: "start" | "center" | "end";
  open?: boolean;
  setOpen?: (v: boolean) => void;
  __dropdownId?: number;
}) {
  const {
    children,
    className,
    sideOffset = 6,
    align = "start",
    open,
    setOpen,
    __dropdownId,
  } = props as any;
  const panelRef = useRef<HTMLElement | null>(null as any);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: -9999, left: -9999, width: 0 });

  const updatePosition = () => {
    const trigger = document.querySelector(
      `[data-dropdown-id="${__dropdownId}"]`,
    ) as HTMLElement | null;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const panel = panelRef.current as HTMLElement | null;
    let left = rect.left;
    if (align === "center" && panel) {
      left = rect.left + rect.width / 2 - panel.offsetWidth / 2;
    } else if (align === "end" && panel) {
      left = rect.right - panel.offsetWidth;
    }
    // keep within viewport with basic collision handling
    const clampedLeft = Math.max(
      8,
      Math.min(left, vw - 8 - (panel?.offsetWidth || 0)),
    );
    const top = rect.bottom + sideOffset;
    setCoords({ top, left: clampedLeft, width: rect.width });
  };

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
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize, true);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(updatePosition, 0);
    return () => clearTimeout(t);
  }, [open, align]);

  if (!open) return null as any;

  const close = () => setOpen && setOpen(false);

  const overlay = <div className="fixed inset-0 z-40" onClick={close} />;

  const panel = (
    <div className="fixed inset-0 z-50" onClick={close}>
      <div
        role="menu"
        ref={panelRef as any}
        className={cn(
          "absolute min-w-[10rem] rounded-md border border-border bg-card text-card-foreground shadow-md focus:outline-none",
          className,
        )}
        style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
        onClick={(e: any) => e.stopPropagation()}
      >
        <MenuKeyboardScope onClose={close}>{children}</MenuKeyboardScope>
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

function MenuKeyboardScope(props: { children: any; onClose: () => void }) {
  const containerRef = useRef<HTMLElement | null>(null as any);

  useEffect(() => {
    const container = containerRef.current as any;
    if (!container) return;
    const items = Array.from(
      container.querySelectorAll(
        '[role="menuitem"]:not([aria-disabled="true"])',
      ),
    ) as HTMLElement[];
    if (items[0]) items[0].focus();
  }, []);

  const onKeyDown = (e: KeyboardEvent & { target: any }) => {
    const container = containerRef.current as any;
    if (!container) return;
    const items = Array.from(
      container.querySelectorAll(
        '[role="menuitem"]:not([aria-disabled="true"])',
      ),
    ) as HTMLElement[];

    const currentIndex = items.indexOf(e.target as any);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = items[(currentIndex + 1) % items.length];
      next && next.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = items[(currentIndex - 1 + items.length) % items.length];
      next && next.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0] && items[0].focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1] && items[items.length - 1].focus();
    }
  };

  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const item = target.closest('[role="menuitem"]') as HTMLElement | null;
    const disabled = item?.getAttribute("aria-disabled") === "true";
    if (item && !disabled) {
      queueMicrotask(() => props.onClose());
    }
  };

  return (
    <div ref={containerRef as any} onKeyDown={onKeyDown as any} onClick={onClick as any}>
      {props.children}
    </div>
  );
}

export function DropdownItem(props: {
  children: any;
  className?: string;
  disabled?: boolean;
  inset?: boolean;
  onSelect?: () => void;
  setOpen?: (v: boolean) => void;
}) {
  const { children, className, disabled, inset, onSelect, setOpen } =
    props as any;
  const handle = (e: any) => {
    e.preventDefault();
    if (disabled) return;
    onSelect && onSelect();
    setOpen && setOpen(false);
  };
  return (
    <button
      role="menuitem"
      aria-disabled={disabled ? "true" : undefined}
      tabIndex={disabled ? -1 : 0}
      onClick={handle}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2 px-3 py-2 text-left text-sm outline-none data-[disabled=true]:opacity-50 hover:bg-accent hover:text-accent-foreground",
        inset && "pl-8",
        className,
      )}
      data-disabled={disabled ? "true" : undefined}
    >
      {children}
    </button>
  );
}

export function DropdownLabel(props: {
  children: any;
  className?: string;
  inset?: boolean;
}) {
  const { children, className, inset } = props as any;
  return (
    <div
      className={cn(
        "px-3 py-1.5 text-xs font-medium text-muted-foreground",
        inset && "pl-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownSeparator(props: { className?: string }) {
  const { className } = props as any;
  return <div className={cn("-mx-1 my-1 h-px bg-border", className)} />;
}
