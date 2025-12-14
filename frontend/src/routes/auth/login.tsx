import {z} from "zod";
import {useAppForm} from "@/hooks/form.ts";
import {useMutation} from "@tanstack/react-query";
import {login} from "@/api/auth.ts";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {toast} from "sonner";
import {Link, useNavigate} from "@tanstack/react-router";
import {Button} from "@/components/ui/button.tsx";

const loginSchema = z.object({
    email: z.email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
    const navigate = useNavigate()

    const form = useAppForm({
        validators: {onChange: loginSchema},
        defaultValues: {
            email: "",
            password: "",
        },
        onSubmit: async (data) => {
            await handleSubmit(data.value);
        }
    })

    const loginMutation = useMutation({
        mutationFn: login,
        onSuccess: async (data, vars) => {
            if ((data as any)?.requires2FA) {
                toast.info("Two-factor authentication required", {
                    description: "2FA flow not implemented yet.",
                });
                return;
            }

            toast.success("Logged in!", {
                description: `Welcome back, ${vars.email}.`,
                duration: 3000,
            });
            await navigate({to: "/app"});
        },
        onError: (err: any) => {
            const description =
                err?.response?.data?.error ||
                err?.message ||
                "Invalid email or password.";
            toast.error("Login failed", {description, duration: 4000});
        },
    });

    async function handleSubmit(values: z.infer<typeof loginSchema>) {
        await loginMutation.mutateAsync(values);
    }

    const isBusy = loginMutation.isPending || form.state.isSubmitting;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
            <Card className="animate-scale-in">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>sign in into your account</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <form
                        onSubmit={async e => {
                            e.preventDefault();
                            await form.handleSubmit();
                        }}
                        noValidate
                        className="flex flex-col gap-3 w-72"
                    >
                        <form.AppField name={"email"}
                                       children={(field) =>
                                           <field.TextField label="Email" placeholder={"email"}/>}
                        />

                        <form.AppField name={"password"}
                                       children={(field) =>
                                           <field.TextField label="Password" placeholder={"password"} type={"password"}/>}
                        />

                        <Button size={"sm"} disabled={isBusy}>
                            {isBusy ? "logging in…" : "login"}
                        </Button>

                        <p className="text-sm text-muted-foreground mt-2 text-center">
                            Don’t have an account?{" "}
                            <Link to="/register" className="text-primary hover:underline">
                                Create one
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
