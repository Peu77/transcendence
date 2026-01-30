import { createRoute } from "@tanstack/react-router";
import { AppRoute } from "@/routes/app/layout.tsx";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUser } from "@/api/user.ts";
import { generateTwoFa, enableTwoFa, disableTwoFa } from "@/api/twofa.ts";
import { useState } from "react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";

const Settings = () => {
    const queryClient = useQueryClient();
    const { data: user } = useQuery({
        queryKey: ["user"],
        queryFn: getUser,
    });

    const [twoFaData, setTwoFaData] = useState<{ otpauthUrl: string; base32: string } | null>(null);
    const [isDisabling, setIsDisabling] = useState(false);

    const generateMutation = useMutation({
        mutationFn: generateTwoFa,
        onSuccess: (data) => {
            setTwoFaData(data);
            toast.success("2FA Secret generated. Please scan the QR code or enter the secret in your authenticator app.");
        },
        onError: () => {
            toast.error("Failed to generate 2FA secret");
        },
    });

    const enableMutation = useMutation({
        mutationFn: enableTwoFa,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["user"] });
            setTwoFaData(null);
            toast.success("2FA enabled successfully");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || error.message || "Failed to enable 2FA";
            toast.error(typeof message === "string" ? message : JSON.stringify(message));
        },
    });

    const disableMutation = useMutation({
        mutationFn: disableTwoFa,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["user"] });
            setIsDisabling(false);
            toast.success("2FA disabled successfully");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || error.message || "Failed to disable 2FA";
            toast.error(typeof message === "string" ? message : JSON.stringify(message));
        },
    });

    const form = useForm({
        defaultValues: {
            code: "",
        },
        onSubmit: async ({ value }) => {
            if (isDisabling) {
                disableMutation.mutate(value.code);
            } else {
                enableMutation.mutate(value.code);
            }
        },
    });

    if (!user) return null;

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <section className="bg-card p-6 rounded-lg border shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication (2FA)</h2>
                {user.twoFaEnabled ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                            <span className="size-2 bg-green-600 rounded-full animate-pulse" />
                            2FA is currently enabled on your account.
                        </div>
                        {isDisabling ? (
                            <div className="space-y-6 pt-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    To disable 2FA, please enter the 6-digit code from your authenticator app.
                                </p>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        form.handleSubmit();
                                    }}
                                    className="space-y-4"
                                >
                                    <form.Field
                                        name="code"
                                        validators={{
                                            onChange: z.string().length(6, "OTP code must be 6 digits"),
                                        }}
                                    >
                                        {(field) => (
                                            <div className="space-y-2">
                                                <Label htmlFor={field.name}>Verification Code</Label>
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder="123456"
                                                    maxLength={6}
                                                    autoFocus
                                                />
                                                {field.state.meta.errors ? (
                                                    <em className="text-destructive text-xs not-italic">
                                                        {field.state.meta.errors.join(", ")}
                                                    </em>
                                                ) : null}
                                            </div>
                                        )}
                                    </form.Field>

                                    <div className="flex gap-2">
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={disableMutation.isPending || form.state.isSubmitting}
                                        >
                                            {disableMutation.isPending ? "Disabling..." : "Verify and Disable"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setIsDisabling(false);
                                                form.reset();
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <Button
                                variant="destructive"
                                onClick={() => setIsDisabling(true)}
                            >
                                Disable 2FA
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-muted-foreground text-sm">
                            Enhance your account security by enabling two-factor authentication.
                        </p>
                        {!twoFaData ? (
                            <Button
                                onClick={() => generateMutation.mutate()}
                                disabled={generateMutation.isPending}
                            >
                                {generateMutation.isPending ? "Generating..." : "Enable 2FA"}
                            </Button>
                        ) : (
                            <div className="space-y-6 pt-4 border-t">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-4 bg-white rounded-lg">
                                        <QRCodeCanvas
                                            value={twoFaData.otpauthUrl}
                                            size={200}
                                            level="H"
                                        />
                                    </div>
                                    <p className="text-sm text-center text-muted-foreground">
                                        Scan this QR code with your authenticator app.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Your 2FA Secret</Label>
                                    <div className="p-3 bg-muted rounded font-mono text-center break-all select-all">
                                        {twoFaData.base32}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Or enter this secret manually if you cannot scan the QR code.
                                    </p>
                                </div>

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        form.handleSubmit();
                                    }}
                                    className="space-y-4"
                                >
                                    <form.Field
                                        name="code"
                                        validators={{
                                            onChange: z.string().length(6, "OTP code must be 6 digits"),
                                        }}
                                    >
                                        {(field) => (
                                            <div className="space-y-2">
                                                <Label htmlFor={field.name}>Verification Code</Label>
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder="123456"
                                                    maxLength={6}
                                                />
                                                {field.state.meta.errors ? (
                                                    <em className="text-destructive text-xs not-italic">
                                                        {field.state.meta.errors.join(", ")}
                                                    </em>
                                                ) : null}
                                            </div>
                                        )}
                                    </form.Field>

                                    <div className="flex gap-2">
                                        <Button
                                            type="submit"
                                            disabled={enableMutation.isPending || form.state.isSubmitting}
                                        >
                                            {enableMutation.isPending ? "Verifying..." : "Verify and Enable"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setTwoFaData(null)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export const SettingsRoute = createRoute({
    getParentRoute: () => AppRoute,
    path: "/settings",
    component: Settings,
});
