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

const Settings = () => {
  const { data: user } = useGetUser()
  const router = useRouter()
  const uploadMutation = useUploadProfilePicture()

  if (!user) return null

  return (
    <div className="container mx-auto p-6 max-w-2xl">
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

      <Accordion type="multiple" defaultValue={['user-settings']}>
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
        <AccordionItem value="game-controls">
          <AccordionTrigger>Game controls</AccordionTrigger>
          <AccordionContent>
            <GameControlsAccordion controls={user.gameControls} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="tetris-handling">
          <AccordionTrigger>handling</AccordionTrigger>
          <AccordionContent>
            <TetrisHandlingAccordion settings={user.tetrisHandlingSettings} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export const SettingsRoute = createRoute({
  getParentRoute: () => AppRoute,
  path: '/settings',
  component: Settings,
})
