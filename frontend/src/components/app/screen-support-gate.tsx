import type { ReactNode } from 'react'
import {
  MIN_SUPPORTED_SCREEN_HEIGHT,
  MIN_SUPPORTED_SCREEN_WIDTH,
  useScreenSupport,
} from '@/hooks/use-screen-support.ts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'

type ScreenSupportGateProps = {
  children: ReactNode
}

export function ScreenSupportGate({ children }: ScreenSupportGateProps) {
  const { isSupported, isMobileDevice, isTooSmall, width, height } =
    useScreenSupport()

  if (isSupported) return children

  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-background px-6 py-10 text-foreground">
      <Card className="w-full max-w-xl border-border/80 bg-card/95 shadow-2xl">
        <CardHeader className="gap-3 text-center">
          <div className="mx-auto clip-pixel-corners-btn border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Desktop only
          </div>
          <CardTitle className="text-3xl font-black tracking-tight">
            Bigger screen required
          </CardTitle>
          <CardDescription className="text-base leading-7">
            Transcendence is built for keyboard play and larger displays. Please
            switch to a desktop or resize your browser window.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="clip-pixel-corners-btn border border-border bg-muted/40 p-4">
              <div className="font-semibold text-foreground">Required</div>
              <div>
                {MIN_SUPPORTED_SCREEN_WIDTH} × {MIN_SUPPORTED_SCREEN_HEIGHT}px
              </div>
            </div>
            <div className="clip-pixel-corners-btn border border-border bg-muted/40 p-4">
              <div className="font-semibold text-foreground">Current</div>
              <div>
                {width} × {height}px
              </div>
            </div>
          </div>

          <ul className="list-disc space-y-2 pl-5">
            {isMobileDevice ? <li>Mobile devices are not supported.</li> : null}
            {isTooSmall ? (
              <li>Your viewport is below the supported size.</li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </main>
  )
}
