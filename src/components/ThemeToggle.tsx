"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled>System</Button>
        <Button variant="outline" size="sm" disabled>Light</Button>
        <Button variant="outline" size="sm" disabled>Dark</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant={theme === "system" ? "default" : "outline"} 
        size="sm" 
        onClick={() => setTheme("system")}
      >
        System
      </Button>
      <Button 
        variant={theme === "light" ? "default" : "outline"} 
        size="sm" 
        onClick={() => setTheme("light")}
      >
        Light
      </Button>
      <Button 
        variant={theme === "dark" ? "default" : "outline"} 
        size="sm" 
        onClick={() => setTheme("dark")}
      >
        Dark
      </Button>
    </div>
  );
}
