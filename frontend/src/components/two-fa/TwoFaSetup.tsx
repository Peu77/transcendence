import { QRCodeCanvas } from "qrcode.react";
import { z } from "zod";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";

interface TwoFaSetupProps {
    twoFaData: { otpauthUrl: string; base32: string };
    form: any;
    isPending: boolean;
    onCancel: () => void;
}

export const TwoFaSetup = ({ twoFaData, form, isPending, onCancel }: TwoFaSetupProps) => {
    return (
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
                    {(field: any) => (
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
                        disabled={isPending || form.state.isSubmitting}
                    >
                        {isPending ? "Verifying..." : "Verify and Enable"}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
};
