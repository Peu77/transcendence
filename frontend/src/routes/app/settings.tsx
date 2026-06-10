import { createRoute, useRouter } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { useGetUser, useUploadProfilePicture } from '@/api/user.ts'
import { Button } from '@/components/ui/button.tsx'
import { ArrowLeftIcon } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion.tsx'
import { UserSettingsAccordion } from '@/components/settings/UserSettingsAccordion.tsx'
import { GameControlsAccordion } from '@/components/settings/GameControlsAccordion.tsx'
import { TetrisHandlingAccordion } from '@/components/settings/TetrisHandlingAccordion.tsx'
import { PublicApiSettingsAccordion } from '@/components/settings/PublicApiSettingsAccordion.tsx'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'

const Settings = () => {
  const { data: user } = useGetUser()
  const router = useRouter()
  const uploadMutation = useUploadProfilePicture()

  if (!user) return null

  return (
    <div className="container mx-auto p-6 flex flex-col h-full min-h-0 max-w-4xl">
      <div className="flex items-center gap-2 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.history.back()}
        >
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <Accordion type="multiple">
          <AccordionItem value="user-settings">
            <AccordionTrigger>User settings</AccordionTrigger>
            <AccordionContent>
              <UserSettingsAccordion
                user={user}
                isUploading={uploadMutation.isPending}
                onUpload={uploadMutation.mutateAsync}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="public-api">
            <AccordionTrigger>Public API</AccordionTrigger>
            <AccordionContent>
              <PublicApiSettingsAccordion />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="game-controls">
            <AccordionTrigger>Game controls</AccordionTrigger>
            <AccordionContent>
              <GameControlsAccordion controls={user.gameControls} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="tetris-handling">
            <AccordionTrigger>Handling</AccordionTrigger>
            <AccordionContent>
              <TetrisHandlingAccordion settings={user.tetrisHandlingSettings} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </div>
  )
}

export const SettingsRoute = createRoute({
  getParentRoute: () => AppRoute,
  path: '/settings',
  component: Settings,
})
