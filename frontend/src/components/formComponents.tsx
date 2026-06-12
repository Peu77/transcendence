import { useEffect, useRef, useState } from 'react'
import { useStore } from '@tanstack/react-form'

import { useFieldContext, useFormContext } from '@/hooks/form-context.ts'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea as ShadcnTextarea } from '@/components/ui/textarea'
import * as ShadcnSelect from '@/components/ui/select'
import { Slider as ShadcnSlider } from '@/components/ui/slider'
import { Switch as ShadcnSwitch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { NumberBadgeInput } from '@/components/ui/number-badge-input'

export function SubscribeButton({ label }: { label: string }) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={isSubmitting}>
          {label}
        </Button>
      )}
    </form.Subscribe>
  )
}

export function ErrorMessages({
  errors,
}: {
  errors: Array<string | { message: string }>
}) {
  return (
    <>
      {errors.map((error) => (
        <div
          key={typeof error === 'string' ? error : error.message}
          className="text-red-400 text-sm mt-1 font-bold"
        >
          {typeof error === 'string' ? error : error.message}
        </div>
      ))}
    </>
  )
}

export function TextField({
  label,
  type = 'text',
  placeholder,
  disabled,
}: {
  label: string
  type?: string
  placeholder?: string
  disabled?: boolean
}) {
  const field = useFieldContext<any>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <Label htmlFor={label} className="mb-2 font-bold">
        {label}
      </Label>
      <Input
        type={type}
        value={field.state.value}
        placeholder={placeholder}
        disabled={disabled}
        onBlur={field.handleBlur}
        onChange={(e) => {
          const val =
            type === 'number' ? e.target.valueAsNumber : e.target.value
          field.handleChange(val as any)
        }}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function TextArea({
  label,
  rows = 3,
}: {
  label: string
  rows?: number
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <Label htmlFor={label} className="mb-2 font-bold">
        {label}
      </Label>
      <ShadcnTextarea
        id={label}
        value={field.state.value}
        onBlur={field.handleBlur}
        rows={rows}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function Select({
  label,
  values,
  placeholder,
  disabled,
}: {
  label: string
  values: Array<{ label: string; value: string }>
  placeholder?: string
  disabled?: boolean
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <ShadcnSelect.Select
        name={field.name}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
        disabled={disabled}
      >
        <ShadcnSelect.SelectTrigger className="w-full">
          <ShadcnSelect.SelectValue placeholder={placeholder} />
        </ShadcnSelect.SelectTrigger>
        <ShadcnSelect.SelectContent>
          <ShadcnSelect.SelectGroup>
            <ShadcnSelect.SelectLabel>{label}</ShadcnSelect.SelectLabel>
            {values.map((value) => (
              <ShadcnSelect.SelectItem key={value.value} value={value.value}>
                {value.label}
              </ShadcnSelect.SelectItem>
            ))}
          </ShadcnSelect.SelectGroup>
        </ShadcnSelect.SelectContent>
      </ShadcnSelect.Select>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function Slider({
  label,
  min = 0,
  max = 100,
  step = 1,
  disabled,
}: {
  label: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}) {
  const field = useFieldContext<number>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <Label htmlFor={label} className="font-bold">
          {label}
        </Label>
        <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded border border-border">
          {field.state.value}
        </span>
      </div>
      <ShadcnSlider
        id={label}
        onBlur={field.handleBlur}
        value={[field.state.value]}
        onValueChange={(value) => field.handleChange(value[0])}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function NumberField({
  label,
  min,
  max,
  step,
  defaultValue,
  disabled,
}: {
  label: string
  min?: number
  max?: number
  step?: number
  defaultValue?: number
  disabled?: boolean
}) {
  const field = useFieldContext<number>()
  const errors = useStore(field.store, (state) => state.meta.errors)
  const [display, setDisplay] = useState(() => field.state.value?.toString() ?? '')
  const focusedRef = useRef(false)

  const fieldValue = field.state.value
  useEffect(() => {
    if (!focusedRef.current) setDisplay(fieldValue?.toString() ?? '')
  }, [fieldValue])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center gap-3">
        <Label htmlFor={label} className="font-bold">
          {label}
        </Label>
        <NumberBadgeInput
          id={label}
          type="text"
          inputMode="decimal"
          value={display}
          disabled={disabled}
          onFocus={() => { focusedRef.current = true }}
          onBlur={(e) => {
            focusedRef.current = false
            field.handleBlur()
            const parsed = parseFloat(display.replace(',', '.'))
            if (isNaN(parsed) || display.trim() === '') {
              const fallback = defaultValue ?? fieldValue ?? 0
              setDisplay(String(fallback))
              field.handleChange(fallback)
            } else {
              setDisplay(String(parsed))
            }
          }}
          onChange={(e) => {
            const raw = e.target.value
            setDisplay(raw)
            if (raw === '' || raw === '.' || raw === '-' || raw === '-.') return
            const parsed = parseFloat(raw.replace(',', '.'))
            if (!isNaN(parsed)) field.handleChange(parsed)
          }}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
            e.preventDefault()
            const current = field.state.value ?? 0
            const s = step ?? 1
            const dec = (String(s).split('.')[1] ?? '').length
            const raw = e.key === 'ArrowUp' ? current + s : current - s
            const clamped = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, raw))
            const next = parseFloat(clamped.toFixed(dec))
            field.handleChange(next)
            setDisplay(String(next))
          }}
        />
      </div>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function Switch({
  label,
  disabled,
}: {
  label: string
  disabled?: boolean
}) {
  const field = useFieldContext<boolean>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <div className="flex items-center gap-2">
        <ShadcnSwitch
          id={label}
          onBlur={field.handleBlur}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked)}
          disabled={disabled}
        />
        <Label htmlFor={label}>{label}</Label>
      </div>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}
