import { h, Link } from "refreshjs";
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import toast from "../components/toast";

export default function Register() {
  function handleRegister() {
    toast.success("Account created!", { description: "You can now log in." });
  }
  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-background">
      <Card className="animate-scale-in">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>sign up to get started</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Input placeholder={"email"} autoFocus={true} />
          <Input placeholder={"password"} type="password" />
          <Input placeholder={"confirm password"} type="password" />
          <Button size={"sm"} onClick={handleRegister}>
            create account
          </Button>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
