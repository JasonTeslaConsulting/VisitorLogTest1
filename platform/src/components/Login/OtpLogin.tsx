import { useState } from "react";
import { PiSpinner } from "react-icons/pi";
import { Button } from "@framework/components/ui/button";
import { Input } from "@framework/components/ui/input";
import { Field, FieldLabel } from "@framework/components/ui/field";
import { useAuth } from "@framework/contexts/AuthContext";
import { toast } from "@framework/components/ui/toast";

type Step = "email" | "otp";

export const OtpLogin = () => {
  const { login, verifyOtp } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email.trim()) return;
    setIsLoading(true);
    setError(null);
    const result = await login(email.trim());
    setIsLoading(false);

    if (result && result.error) {
      return;
    }

    setStep("otp");
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    setIsLoading(true);
    setError(null);
    const { error } = await verifyOtp(email.trim(), otp.trim());
    if (error) {
      setError("Invalid or expired code. Please try again.");
      setIsLoading(false);
      return;
    }
    // onAuthStateChange → loadUser() takes over from here
  };

  const handleReset = () => {
    setStep("email");
    setOtp("");
    setError(null);
  };

  if (step === "email") {
    return (
      <div className="space-y-4">
        <Field>
          <FieldLabel htmlFor="email">Email address</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
            disabled={isLoading}
          />
        </Field>
        <Button
          onClick={handleSendOtp}
          disabled={isLoading || !email.trim()}
          className="w-full h-11"
        >
          {isLoading ? (
            <PiSpinner className="h-4 w-4 animate-spin" />
          ) : (
            "Send login code"
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        A 6-digit code was sent to{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>
      <Field>
        <FieldLabel htmlFor="otp">Verification code</FieldLabel>
        <Input
          id="otp"
          type="text"
          inputMode="numeric"
          placeholder="000000"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
          disabled={isLoading}
          className="text-center tracking-widest text-lg"
        />
      </Field>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
      <Button
        onClick={handleVerifyOtp}
        disabled={isLoading || otp.length < 6}
        className="w-full h-11"
      >
        {isLoading ? (
          <PiSpinner className="h-4 w-4 animate-spin" />
        ) : (
          "Verify code"
        )}
      </Button>
      <button
        onClick={handleReset}
        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Use a different email
      </button>
    </div>
  );
};
