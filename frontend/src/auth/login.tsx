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

export default function Login() {
  function handleLogin() {
    toast.success("Logged in!", { description: "Welcome back." });
  }
  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-background">
      <Card className="animate-scale-in">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>sign in into your account</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Input placeholder={"email"} autoFocus={true} />
          <Input placeholder={"password"} type="password" />
          <Button size={"sm"} onClick={handleLogin}>
            login
          </Button>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Don’t have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
