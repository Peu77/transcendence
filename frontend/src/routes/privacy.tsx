import { Link, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeftIcon } from 'lucide-react'

export default function PrivacyPolicy() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-8">
      <div className="max-w-4xl w-full bg-card p-8 rounded-lg shadow-lg border">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.history.back()}
            >
              <ArrowLeftIcon />
            </Button>
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          <Link to="/app" className={buttonVariants({ variant: 'ghost' })}>
            Home
          </Link>
        </div>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6 text-foreground/80">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                1. Introduction
              </h2>
              <p>
                Welcome to Transcendence. We respect your privacy and are
                committed to protecting your personal data. This privacy policy
                will inform you about how we look after your personal data when
                you visit our website and tell you about your privacy rights and
                how the law protects you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                2. The Data We Collect
              </h2>
              <p>
                We may collect, use, store and transfer different kinds of
                personal data about you which we have grouped together as
                follows:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>
                  <strong>Identity Data:</strong> includes username or similar
                  identifier.
                </li>
                <li>
                  <strong>Contact Data:</strong> includes email address.
                </li>
                <li>
                  <strong>Profile Data:</strong> includes your profile picture,
                  game settings, and achievements.
                </li>
                <li>
                  <strong>Usage Data:</strong> includes information about how
                  you use our website and service (e.g., game statistics, match
                  history).
                </li>
                <li>
                  <strong>Technical Data:</strong> includes internet protocol
                  (IP) address, your login data, browser type and version.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                3. How We Use Your Data
              </h2>
              <p>
                We will only use your personal data when the law allows us to.
                Most commonly, we will use your personal data in the following
                circumstances:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>To register you as a new user.</li>
                <li>
                  To provide the gaming service, including matchmaking and
                  leaderboard features.
                </li>
                <li>To manage our relationship with you.</li>
                <li>
                  To enable you to partake in a competition or complete a
                  survey.
                </li>
                <li>
                  To administer and protect our service (including
                  troubleshooting, data analysis, testing, system maintenance,
                  support, reporting and hosting of data).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                4. Data Security
              </h2>
              <p>
                We have put in place appropriate security measures to prevent
                your personal data from being accidentally lost, used or
                accessed in an unauthorized way, altered or disclosed. In
                addition, we limit access to your personal data to those project
                members who have a business need to know.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                5. Third-Party Links
              </h2>
              <p>
                This website may include links to third-party websites, plug-ins
                and applications (such as GitHub for OAuth). Clicking on those
                links or enabling those connections may allow third parties to
                collect or share data about you. We do not control these
                third-party websites and are not responsible for their privacy
                statements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                6. Cookies
              </h2>
              <p>
                We use cookies to manage your session. You can set your browser
                to refuse all or some browser cookies, or to alert you when
                websites set or access cookies. If you disable or refuse
                cookies, please note that some parts of this website may become
                inaccessible or not function properly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                7. Your Legal Rights
              </h2>
              <p>
                Under certain circumstances, you have rights under data
                protection laws in relation to your personal data, including the
                right to request access, correction, erasure, restriction,
                transfer, to object to processing, to withdraw consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                8. Contact Us
              </h2>
              <p>
                If you have any questions about this privacy policy or our
                privacy practices, please contact the project team through the
                official repository channels.
              </p>
            </section>
          </div>
        </ScrollArea>
      </div>
      <footer className="mt-8 text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Transcendence Project. All rights
        reserved.
      </footer>
    </div>
  )
}
