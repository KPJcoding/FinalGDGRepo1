import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Users, Trophy, Menu, X, Sparkles, LogOut, Trash2, User, Coins, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { TierBadge } from "@/components/qa/TierBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const navItems = [
  { path: "/explore", label: "Explore", icon: Search },
  { path: "/contribute", label: "Contribute", icon: BookOpen },
  { path: "/clubs", label: "Clubs", icon: Sparkles },
  { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const [userDetails, setUserDetails] = useState<any>(null);

  // Fetch full user details including tier
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('http://localhost:3000/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserDetails(data);
        }
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      }
    };

    fetchUserDetails();
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    setMobileMenuOpen(false);
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const res = await fetch('/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete account');
      }

      logout();
      toast.success("Account deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/sol1-logo.jpg"
              alt="SOL-1"
              className="w-10 h-10 rounded-lg object-contain"
            />
            <span className="font-bold text-lg text-foreground">Sol-1</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "nav-active" : "nav"}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    {user.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Credits and Tier Display */}
                  {userDetails && (
                    <div className="px-2 py-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-500">
                          {userDetails.credits || 0} Credits
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <TierBadge tier={userDetails.tier} className="text-xs" />
                      </div>
                    </div>
                  )}

                  <DropdownMenuSeparator />

                  {/* Admin Panel - Only visible to admins */}
                  {user.role === 'ADMIN' && (
                    <>
                      <Link to="/admin">
                        <DropdownMenuItem className="cursor-pointer">
                          <Shield className="w-4 h-4 mr-2 text-sol-cyan" />
                          <span className="font-semibold text-sol-cyan">Admin Panel</span>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteAccount}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/get-started">
                  <Button variant="accent" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? "nav-active" : "nav"}
                      className="w-full justify-start gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}

              {/* Admin Panel Button for Mobile - Only visible to admins */}
              {isAuthenticated && user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={location.pathname === '/admin' ? "nav-active" : "nav"}
                    className="w-full justify-start gap-2 bg-sol-cyan/10 border-sol-cyan/30"
                  >
                    <Shield className="w-4 h-4" />
                    Admin Panel
                  </Button>
                </Link>
              )}

              <div className="flex gap-2 pt-4 border-t border-border mt-2">
                {isAuthenticated && user ? (
                  <div className="w-full space-y-2">
                    <Button variant="outline" className="w-full" disabled>
                      <User className="w-4 h-4 mr-2" />
                      {user.name}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleDeleteAccount}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                ) : (
                  <>
                    <Link to="/signin" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/get-started" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="accent" className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
