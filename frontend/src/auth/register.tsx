import { h, Link, navigate } from "refreshjs";
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
import { useMutation } from "../query/hooks";
import { register as apiRegister } from "../api/auth";

const registerSchema = z
  .object({
    email: z.email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export default function Register() {
  const form = useForm({
    schema: registerSchema,
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const registerMutation = useMutation({
    mutationFn: async (values: z.infer<typeof registerSchema>) =>
      apiRegister({ email: values.email, password: values.password }),
    onSuccess: (data, vars) => {
      toast.success("Account created!", {
        description: `Welcome, ${vars.email}.`,
        duration: 3000,
      });
      navigate("/app");
    },
    onError: (err: any) => {
      const description =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Could not create account.";
      toast.error("Registration failed", { description, duration: 4000 });
    },
  });

  async function handleSubmit(values: z.infer<typeof registerSchema>) {
    await registerMutation.mutateAsync(values);
  }

  const isBusy = registerMutation.isPending || form.formState.isSubmitting;

  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-background">
      <Card className="animate-scale-in">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>sign up to get started</CardDescription>
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
                  <Input {...field} autoFocus={true} placeholder="enter email" />
                  <FormMessage form={form} name="email" />
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

            <FormField
              form={form}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor={field.id}>Confirm password</FormLabel>
                  <Input {...field} type="password" placeholder="confirm password" />
                  <FormMessage form={form} name="confirmPassword" />
                </FormItem>
              )}
            />

            <Button size={"sm"} disabled={isBusy}>
              {isBusy ? "creating…" : "create account"}
            </Button>

            <p className="text-sm text-muted-foreground mt-2 text-center">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
