import { useState } from "react";
import { PiSpinner } from "react-icons/pi";
import { Button } from "@framework/components/ui/button";
import { Input } from "@framework/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@framework/components/ui/field";
import { useAuth } from "@framework/contexts/AuthContext";

export const PasswordLogin = () => {
  const { loginWithPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setIsLoading(true);
    setError(null);
    const { error } = await loginWithPassword(email.trim(), password);
    if (error) {
      setError(error);
      setIsLoading(false);
      return;
    }
    // onAuthStateChange -> loadUser() takes over from here
  };

  return (
    <div className="space-y-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="dev-email">Email</FieldLabel>
          <Input
            id="dev-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            disabled={isLoading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="dev-password">Password</FieldLabel>
          <Input
            id="dev-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            disabled={isLoading}
          />
        </Field>
      </FieldGroup>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
      <Button
        onClick={handleLogin}
        disabled={isLoading || !email.trim() || !password}
        className="w-full h-11"
      >
        {isLoading ? <PiSpinner className="h-4 w-4 animate-spin" /> : "Sign in"}
      </Button>
    </div>
  );
};
