import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGo } from "@refinedev/core";
import { Home, ArrowLeft, ShieldOff } from "lucide-react";
import { useEffect, useState } from "react";

export function ErrorComponent() {
  const go = useGo();
  const [errorType, setErrorType] = useState<"404" | "403" | "generic">("generic");

  useEffect(() => {
    // Detect context from URL or history state
    const path = window.location.pathname;
    if (path.includes("forbidden") || path.includes("unauthorized")) {
      setErrorType("403");
    } else if (path !== "/" && path !== "/login") {
      setErrorType("404");
    }
  }, []);

  const copy = {
    "403": {
      title:   "Access Restricted",
      message: "The page you requested is not available in your account. If you believe this is an error, please contact your administrator.",
      icon:    ShieldOff,
      iconBg:  "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600",
    },
    "404": {
      title:   "Page Not Found",
      message: "The page you're looking for doesn't exist or may have been moved.",
      icon:    Home,
      iconBg:  "bg-muted",
      iconColor: "text-muted-foreground",
    },
    "generic": {
      title:   "Something went wrong",
      message: "An unexpected error occurred. Please try going back to the dashboard.",
      icon:    Home,
      iconBg:  "bg-muted",
      iconColor: "text-muted-foreground",
    },
  };

  const { title, message, icon: Icon, iconBg, iconColor } = copy[errorType];

  return (
    <div className={cn("flex items-center justify-center bg-background min-h-[60vh] my-auto")}>
      <div className={cn("text-center space-y-6 max-w-md px-6")}>
        <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center mx-auto", iconBg)}>
          <Icon className={cn("w-9 h-9", iconColor)} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={() => go({ to: "/" })}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

ErrorComponent.displayName = "ErrorComponent";
