import { useNavigate } from "react-router";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@framework/components/ui/card";
import { useAuth } from "@framework/contexts/AuthContext";
import { EntraLogin } from "@framework/components/Login/EntraLogin";
import { OtpLogin } from "@framework/components/Login/OtpLogin";
import { PasswordLogin } from "@framework/components/Login/PasswordLogin";
import { AUTH } from "@framework/lib/constants/app";
import { appConfig } from "@framework/app/appConfig";

export const Login = () => {
  const { authMode, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { portalName } = appConfig.config.app;

  useEffect(() => {
    if (isAuthenticated) navigate(AUTH.REDIRECT_PATH, { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <img
            src="/images/logo.png"
            className="h-20 w-20 mx-auto"
            alt="Logo"
          />
          <div>
            <CardTitle className="text-2xl font-semibold">
              {portalName}
            </CardTitle>
            <CardDescription className="mt-1">
              Sign in to access company resources
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2 pb-8">
          {authMode === "entra" && <EntraLogin />}
          {authMode === "otp" && <OtpLogin />}
          {authMode === "password" && <PasswordLogin />}
        </CardContent>
      </Card>
    </div>
  );
};
