import { useState } from "react";
import { PiSpinner } from "react-icons/pi";
import { Button } from "@framework/components/ui/button";
import { useAuth } from "@framework/contexts/AuthContext";

export const EntraLogin = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    await login();
    // page redirects - no need to reset loading state
  };

  return (
    <Button
      onClick={handleLogin}
      disabled={isLoading}
      className="w-full h-12 text-base font-medium gap-3"
    >
      {isLoading ? (
        <PiSpinner className="h-5 w-5 animate-spin" />
      ) : (
        <MicrosoftIcon />
      )}
      {isLoading ? "Signing in..." : "Login with Entra"}
    </Button>
  );
};

const MicrosoftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 21 21"
    className="h-5 w-5 shrink-0"
    fill="currentColor"
  >
    <rect x="1" y="1" width="9" height="9" />
    <rect x="11" y="1" width="9" height="9" />
    <rect x="1" y="11" width="9" height="9" />
    <rect x="11" y="11" width="9" height="9" />
  </svg>
);
