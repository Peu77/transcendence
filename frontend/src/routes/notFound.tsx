import { Link, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const NotFound = () => {
  const router = useRouter()
  const [isRescanning, setIsRescanning] = useState(false)
  const [rescanKey, setRescanKey] = useState(0)

  const triggerRescan = () => {
    setIsRescanning(true)
    setRescanKey((k) => k + 1)

    globalThis.setTimeout(() => setIsRescanning(false), 950)
  }

  useEffect(() => {
    triggerRescan()
  }, [])

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(180_100%_70%/.20)_0%,transparent_55%),radial-gradient(circle_at_90%_20%,hsl(300_100%_70%/.18)_0%,transparent_55%),radial-gradient(circle_at_60%_90%,hsl(45_100%_70%/.14)_0%,transparent_55%)]"
      />

      {(isRescanning || rescanKey > 0) && (
        <div
          key={rescanKey}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 crt-rescan"
        />
      )}

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-8 md:flex-row md:gap-8 md:px-8 md:py-12 notfound-desat">
        <section className="relative flex w-full flex-col justify-center md:w-2/5">
          <Card className="relative overflow-hidden border-border/60 bg-card/70 p-6 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div aria-hidden className="crt-scanlines" />
            <div aria-hidden className="crt-flicker" />

            <div className="relative">
              <p className="text-sm tracking-[0.25em] text-muted-foreground">
                SYSTEM
              </p>
              <h1 className="mt-2 text-5xl leading-none tracking-widest md:text-6xl">
                4
                <span className="inline-block animate-[notfound-jitter_2.2s_ease-in-out_infinite]">
                  0
                </span>
                4
              </h1>

              <p className="mt-4 text-base text-foreground/90">
                That route doesn’t exist. The arcade cabinet ate it.
              </p>

              <div className="mt-6 rounded-md border border-border/70 bg-muted/40 px-4 py-3">
                <p className="text-xs tracking-[0.22em] text-muted-foreground">
                  DIAGNOSTICS
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                  <span className="text-primary">&gt;</span> Try a different
                  menu option
                  <span className="ml-2 inline-block w-[1ch] animate-[notfound-blink_1s_steps(1,end)_infinite] bg-foreground align-[-2px]">
                    &nbsp;
                  </span>
                </p>
              </div>

              <p className="mt-4 text-xs tracking-[0.25em] text-muted-foreground">
                TIP: lower saturation by changing{' '}
                <span className="text-foreground">.notfound-desat</span> in{' '}
                <span className="text-foreground">styles.css</span>.
              </p>
            </div>
          </Card>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="h-12 px-6 text-base">
              <Link to="/">INSERT COIN (HOME)</Link>
            </Button>
            <Button
              variant="outline"
              className="h-12 px-6 text-base"
              onClick={() => {
                triggerRescan()
                router.invalidate()
              }}
              type="button"
            >
              {isRescanning ? 'RESCANNING…' : 'RESCAN'}
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
