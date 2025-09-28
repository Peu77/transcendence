import { h, Link } from "refreshjs";
import { z } from "zod";
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import toast from "../store/toast";
import {
  useForm,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/Form";

const loginSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const form = useForm({
    schema: loginSchema,
    defaultValues: { email: "", password: "" },
  });

  async function handleSubmit(values: z.infer<typeof loginSchema>) {
    toast.success("Logged in!", {
      description: `Welcome back, ${values.email}.`,
    });
  }

  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-background">
      <Card className="animate-scale-in">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>sign in into your account</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              noValidate
              className="flex flex-col gap-3 w-72"
            >
              <FormField
                form={form}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor={field.id}>Email</FormLabel>
                      <Input {...field} autoFocus={true} placeholder="enter email"/>
                    <FormMessage form={form} name="email"/>
                  </FormItem>
                )}
              />

              <FormField
                form={form}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor={field.id}>Password</FormLabel>
                    <Input {...field} type="password" placeholder="enter password" />
                    <FormMessage form={form} name="password" />
                  </FormItem>
                )}
              />

              <Button size={"sm"} disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "logging in…" : "login"}
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
