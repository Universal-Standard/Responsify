import { useAuth, useLogout, loginWithGitHub } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, User as UserIcon, LayoutDashboard, Github } from "lucide-react";
import { Link } from "wouter";

export function UserMenu() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const logout = useLogout();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <Button onClick={loginWithGitHub} variant="default" size="sm">
        <Github className="w-4 h-4 mr-2" />
        Sign in with GitHub
      </Button>
    );
  }

  const displayName = user.displayName || user.githubUsername || user.username || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.githubAvatarUrl || undefined} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            {user.email && (
              <p className="text-xs text-muted-foreground">{user.email}</p>
            )}
            {user.subscriptionTier && user.subscriptionTier !== "free" && (
              <p className="text-xs text-primary font-medium capitalize">
                {user.subscriptionTier} Plan
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/dashboard">
          <DropdownMenuItem>
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </DropdownMenuItem>
        </Link>
        <Link href="/profile">
          <DropdownMenuItem>
            <UserIcon className="w-4 h-4 mr-2" />
            Profile
          </DropdownMenuItem>
        </Link>
        <Link href="/settings">
          <DropdownMenuItem>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {logout.isPending ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
