export const StatCard = ({
  value,
  label,
  size = 'lg',
}: {
  value: string
  label: string
  size?: 'sm' | 'lg'
}) => (
  <div
    className={`flex flex-col items-center rounded-md bg-muted ${size === 'lg' ? 'gap-1 px-6 py-3' : 'px-4 py-2'}`}
  >
    <span className={`font-bold ${size === 'lg' ? 'text-2xl' : 'text-lg'}`}>
      {value}
    </span>
    <span className="text-xs uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
  </div>
)
