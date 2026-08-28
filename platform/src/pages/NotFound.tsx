import { useLocation, Link } from "react-router";
import { useEffect } from "react";
import { AUTH } from "@framework/lib/constants/app";
import { Button } from "@framework/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          Oops! Page not found
        </p>
        <Button
          render={<Link to={AUTH.LOGIN_PATH} />}
          nativeButton={false}
          variant="link"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
