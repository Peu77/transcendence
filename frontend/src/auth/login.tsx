import { h, Link } from "refreshjs";
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";

export default function Login() {
  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-background">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>sign in into your account</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Input placeholder={"email"} autoFocus={true} />
          <Input placeholder={"password"} type="password" />
          <Button size={"sm"}>login</Button>
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
