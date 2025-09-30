import { h, useEffect, useRef, useState } from "refreshjs";
import type { z } from "zod";
import { cn } from "./utils";

function getIn(obj: any, path: string, fallback?: any) {
  const parts = path.split(".").filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return fallback;
    cur = cur[p];
  }
  return cur === undefined ? fallback : cur;
}

function setIn(obj: any, path: string, value: any): any {
  const parts = path.split(".").filter(Boolean);
  if (parts.length === 0) return value;
  const out = Array.isArray(obj) ? obj.slice() : { ...(obj || {}) };
  let cur: any = out;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = cur[key];
    cur[key] =
      typeof next === "object" && next !== null
        ? Array.isArray(next)
          ? next.slice()
          : { ...next }
        : {};
    cur = cur[key];
  }
  cur[parts[parts.length - 1]] = value;
  return out;
}

function sanitizeId(s: string) {
  return s.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function extractErrors(err: any): Record<string, string> {
  if (!err || typeof err !== "object" || typeof err.flatten !== "function")
    return {};
  const flat = err.flatten();
  const out: Record<string, string> = {};
  const fieldErrors = (flat.fieldErrors || {}) as Record<string, string[]>;
  for (const k in fieldErrors) {
    if (!fieldErrors[k] || fieldErrors[k].length === 0) continue;
    out[k] = fieldErrors[k][0];
  }
  if (flat.formErrors && flat.formErrors[0]) {
    out["_root"] = flat.formErrors[0];
  }
  return out;
}

let formIdCounter = 0;

export type FieldError = { message: string };
export type FormErrors = Record<string, FieldError | undefined>;

export type RegisterOptions = {
  type?:
    | "text"
    | "password"
    | "email"
    | "number"
    | "checkbox"
    | "date"
    | "datetime-local";
  valueAsNumber?: boolean;
  valueAsDate?: boolean;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export type RegisteredFieldProps = {
  name: string;
  id: string;
  value?: any;
  checked?: boolean;
  onChange: (
    e: Event & { target: HTMLInputElement | HTMLTextAreaElement },
  ) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
};

export type UseFormOptions<S extends z.ZodTypeAny> = {
  schema: S;
  defaultValues?: Partial<z.infer<S>>;
};

export type UseFormReturn<S extends z.ZodTypeAny> = {
  register: (name: string, opts?: RegisterOptions) => RegisteredFieldProps;
  handleSubmit: (
    fn: (values: z.infer<S>) => void | Promise<void>,
  ) => (e?: Event) => Promise<void>;
  setValue: (name: string, value: any) => void;
  getValues: () => z.infer<S>;
  reset: (next?: Partial<z.infer<S>>) => void;
  getFieldState: (name: string) => { invalid: boolean; error?: FieldError };
  formState: {
    errors: FormErrors;
    isSubmitting: boolean;
    isSubmitted: boolean;
  };
  _internals: {
    values: any;
    errors: Record<string, string>;
    setErrors: (e: Record<string, string>) => void;
    validateAll: (next?: any) => Record<string, string>;
    formId: string;
  };
};

export function useForm<S extends z.ZodTypeAny>(
  opts: UseFormOptions<S>,
): UseFormReturn<S> {
  const { schema, defaultValues } = opts;
  const [values, setValues] = useState<any>(defaultValues || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false as boolean);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const formIdRef = useRef<string>(`f_${++formIdCounter}`);

  useEffect(() => {
    if (defaultValues) setValues(defaultValues as any);
  }, []);

  function validateAll(nextValues = values): Record<string, string> {
    const res = (schema as any).safeParse
      ? (schema as any).safeParse(nextValues)
      : { success: true };
    if (res.success) return {};
    return extractErrors(res.error);
  }

  function validateField(
    name: string,
    nextValues = values,
  ): string | undefined {
    const res = (schema as any).safeParse
      ? (schema as any).safeParse(nextValues)
      : { success: true };
    if ((res as any).success) return undefined;
    const flat = (res as any).error.flatten();
    const fieldMsg = (flat.fieldErrors || {})[name]?.[0];
    return fieldMsg;
  }

  function setValue(name: string, value: any) {
    const next = setIn(values, name, value);
    setValues(next);
    const msg = validateField(name, next);
    const nextErrors = { ...errors };
    if (msg) nextErrors[name] = msg;
    else delete nextErrors[name];
    setErrors(nextErrors);
  }

  function register(
    name: string,
    opts?: RegisterOptions,
  ): RegisteredFieldProps {
    const id = (opts && opts.id) || `${formIdRef.current}-${sanitizeId(name)}`;
    const type = (opts && opts.type) || "text";
    const valueAsNumber = Boolean(opts?.valueAsNumber);
    const valueAsDate = Boolean(opts?.valueAsDate);

    const val = getIn(values, name, type === "checkbox" ? false : "");
    const hasError = Boolean(errors[name]);
    const errorId = hasError ? `${id}-error` : undefined;

    const onChange = (
      e: Event & { target: HTMLInputElement | HTMLTextAreaElement },
    ) => {
      const t = e.target as HTMLInputElement;
      let nextVal: any;
      if (type === "checkbox") nextVal = t.checked;
      else if (valueAsNumber)
        nextVal = t.value === "" ? undefined : Number(t.value);
      else if (valueAsDate) nextVal = t.value ? new Date(t.value) : undefined;
      else nextVal = t.value;
      setValue(name, nextVal);
    };

    return {
      name,
      id,
      value: type === "checkbox" ? undefined : val,
      checked: type === "checkbox" ? Boolean(val) : undefined,
      onChange,
      disabled: opts?.disabled,
      required: opts?.required,
      placeholder: opts?.placeholder,
      "aria-invalid": hasError ? ("true" as const) : ("false" as const),
      "aria-describedby": errorId,
    };
  }

  function getValues() {
    return values as z.infer<S>;
  }

  function reset(next?: Partial<z.infer<S>>) {
    setValues(next || (defaultValues as any) || {});
    setErrors({});
  }

  function getFieldState(name: string) {
    const msg = errors[name];
    return { invalid: Boolean(msg), error: msg ? { message: msg } : undefined };
  }

  function handleSubmit(fn: (values: z.infer<S>) => void | Promise<void>) {
    return async (e?: Event) => {
      if (e && typeof e.preventDefault === "function") e.preventDefault();
      const all = validateAll(values);
      setErrors(all);
      setIsSubmitted(true);
      if (Object.keys(all).length > 0) return;
      try {
        setIsSubmitting(true);
        await fn(values as z.infer<S>);
      } finally {
        setIsSubmitting(false);
      }
    };
  }

  return {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    getFieldState,
    formState: {
      errors: Object.fromEntries(
        Object.entries(errors).map(([k, v]) => [
          k,
          v ? { message: v } : undefined,
        ]),
      ) as any,
      isSubmitting,
      isSubmitted,
    },
    _internals: {
      values,
      errors,
      setErrors,
      formId: formIdRef.current,
    },
  } as any;
}

export function FormField(props: {
  form: UseFormReturn<any>;
  name: string;
  render: (ctx: {
    field: RegisteredFieldProps;
    fieldState: { invalid: boolean; error?: FieldError };
    formState: UseFormReturn<any>["formState"];
  }) => any;
}) {
  const { form, name, render } = props;
  const field = form.register(name);
  const fieldState = form.getFieldState(name);
  return render({ field, fieldState, formState: form.formState });
}

export function FormItem(props: { children: any; className?: string }) {
  return (
    <div className={cn(props.className, "flex flex-col gap-1.5")}>
      {props.children}
    </div>
  );
}

export function FormLabel(props: {
  htmlFor?: string;
  children: any;
  className?: string;
}) {
  return (
    <label
      for={props.htmlFor}
      className={cn(props.className, "text-sm font-medium")}
    >
      {props.children}
    </label>
  );
}

export function FormMessage(props: {
  form: UseFormReturn<any>;
  name: string;
  className?: string;
}) {
  const state = props.form.getFieldState(props.name);
  if (!state.error) return null;
  const id = `${props.form._internals.formId}-${sanitizeId(props.name)}-error`;
  return (
    <p id={id} className={cn(props.className, "text-sm text-destructive")}>
      {state.error.message}
    </p>
  );
}
