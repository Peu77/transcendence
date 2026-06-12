import { createRoute, Link, useRouter } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { Button } from '@/components/ui/button.tsx'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  GithubIcon,
  ShieldCheckIcon,
} from 'lucide-react'

const TEAM = [
  {
    name: 'Charlotte Gerlinger',
    github: 'cgerlinger',
    avatar: 'https://avatars.githubusercontent.com/u/149407644?v=4',
  },
  {
    name: 'Emil Ebert',
    github: 'Peu77',
    avatar: 'https://avatars.githubusercontent.com/u/60301119?v=4',
  },
  {
    name: 'Jonas Götz',
    github: 'JonasGoetz01',
    avatar: 'https://avatars.githubusercontent.com/u/65551807?v=4',
  },
  {
    name: 'Konrad Mühlbauer',
    github: 'Komu211',
    avatar: 'https://avatars.githubusercontent.com/u/75761278?v=4',
  },
  {
    name: 'Theo Paesch',
    github: 'TheoPaesch',
    avatar: 'https://avatars.githubusercontent.com/u/147173090?v=4',
  },
]

const About = () => {
  const router = useRouter()

  return (
    <ScrollArea className="h-full">
      <div className="container mx-auto flex max-w-2xl flex-col p-6">
        <div className="mb-8 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.history.back()}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-3xl font-bold">About</h1>
        </div>

        {/* Project description */}
        <div className="mb-8 rounded-lg border bg-card p-6">
          <h2 className="mb-3 text-xl font-bold text-foreground">
            ft_transcendence
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
            A real-time multiplayer Tetris game built as the final project of
            the 42 school common core curriculum.
          </p>
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
            ft_transcendence challenges students to build a full-stack web
            application from scratch. The project requires real-time multiplayer
            gameplay, user authentication, matchmaking, a ranking system, and a
            responsive single-page frontend — all containerized with Docker.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Our take on the project is a competitive Tetris experience featuring
            live 1v1 battles, solo mode, player profiles with statistics, an
            achievement system, a friends list with real-time presence, and a
            retro-inspired pixel UI.
          </p>
        </div>

        {/* Repository link */}
        <a
          href="https://github.com/Peu77/transcendence"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
            <GithubIcon className="h-5 w-5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">Peu77/transcendence</div>
            <div className="text-xs text-muted-foreground">
              Source code on GitHub
            </div>
          </div>
          <ExternalLinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        </a>

        {/* Team */}
        <h2 className="mb-4 text-xl font-bold text-foreground">The Team</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TEAM.map((member) => (
            <a
              key={member.github}
              href={`https://github.com/${member.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
            >
              <img
                src={member.avatar}
                alt={member.name}
                className="h-10 w-10 shrink-0 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {member.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  @{member.github}
                </div>
              </div>
              <ExternalLinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            </a>
          ))}
        </div>

        {/* Legal links */}
        <h2 className="mb-4 mt-8 text-xl font-bold text-foreground">Legal</h2>
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            to="/privacy"
            className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
              <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Privacy Policy</div>
              <div className="text-xs text-muted-foreground">
                How we handle your data
              </div>
            </div>
            <ExternalLinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
          <Link
            to="/terms"
            className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/20">
              <ShieldCheckIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Terms of Service</div>
              <div className="text-xs text-muted-foreground">
                Rules of using our service
              </div>
            </div>
            <ExternalLinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        </div>

        {/* 42 badge */}
        <div className="mt-8 mb-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Built at</span>
          <span className="font-bold text-foreground">42 Heilbronn</span>
        </div>
      </div>
    </ScrollArea>
  )
}

export const AboutRoute = createRoute({
  getParentRoute: () => AppRoute,
  component: About,
  path: '/about',
})
