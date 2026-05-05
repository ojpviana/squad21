import { Link, useLocation } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

export function AppHeader({
  nav,
}: {
  nav?: { to: string; label: string }[];
}) {
  const location = useLocation();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/coach">
          <Logo size="sm" />
        </Link>
        {nav && (
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => {
              const active = location.pathname === n.to || location.pathname.startsWith(n.to + "/");
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        )}
        <Link to="/">
          <Button variant="ghost" size="sm">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </Link>
      </div>
    </header>
  );
}
