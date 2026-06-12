import { Link, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeftIcon } from 'lucide-react'

export default function TermsOfService() {
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
            <h1 className="text-3xl font-bold">Terms of Service</h1>
          </div>
          <Link to="/" className={buttonVariants({ variant: 'ghost' })}>
            Home
          </Link>
        </div>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6 text-foreground/80">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">1. Agreement to Terms</h2>
              <p>
                By accessing or using Transcendence, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">2. Description of Service</h2>
              <p>
                Transcendence is a web-based multiplayer gaming platform developed as an educational project. It provides features such as real-time gaming, matchmaking, social interaction, and performance tracking.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">3. User Accounts</h2>
              <p>
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.
              </p>
              <p className="mt-2">
                You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">4. User Conduct</h2>
              <p>
                You agree not to use the service for any purpose that is prohibited by these Terms. You are responsible for all of your activity in connection with the service.
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>No cheating or using unauthorized third-party software to gain an advantage in games.</li>
                <li>No harassment, bullying, or abuse of other users.</li>
                <li>No posting of offensive, inappropriate, or illegal content.</li>
                <li>No attempt to circumvent security measures or exploit vulnerabilities.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">5. Intellectual Property</h2>
              <p>
                The service and its original content, features, and functionality are and will remain the exclusive property of the Transcendence project team and its licensors.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">6. Termination</h2>
              <p>
                We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">7. Limitation of Liability</h2>
              <p>
                In no event shall the Transcendence project team be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">8. Governing Law</h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which the project members reside, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">9. Changes to Terms</h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>
          </div>
        </ScrollArea>
      </div>
      <footer className="mt-8 text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Transcendence Project. All rights reserved.
      </footer>
    </div>
  )
}
