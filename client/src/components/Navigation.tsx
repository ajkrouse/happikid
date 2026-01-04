import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import RoleSelectionModal from "@/components/RoleSelectionModal";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Navigation() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  // Simplified nav: About and Contact only (CTAs handle primary actions)
  const navItems = isAuthenticated ? [
    { href: "/provider/dashboard", label: "Provider Dashboard" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ] : [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];
  
  // Mobile nav prioritizes Find Programs action first
  const mobileNavItems = isAuthenticated ? [
    { href: "/search", label: "Find Programs", isPrimary: true },
    { href: "/provider/dashboard", label: "Provider Dashboard" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ] : [
    { href: "/search", label: "Find Programs", isPrimary: true },
    { href: "/providers", label: "For Providers" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const NavContent = () => (
    <>
      <div className="flex items-center space-x-8">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <span className={`text-sm font-medium transition cursor-pointer text-brand-evergreen ${
              location === item.href ? "font-semibold" : "hover:text-action-clay"
            }`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      <div className="flex items-center space-x-3">
        {isLoading ? (
          <div className="w-20 h-8 animate-pulse rounded-lg bg-brand-sage"></div>
        ) : isAuthenticated ? (
          <>
            <div className="px-4 py-2 font-medium text-sm text-brand-evergreen">
              {(user as any)?.firstName || (user as any)?.email?.split('@')[0]}
            </div>
            <Button variant="ghost" className="px-4 font-medium text-brand-evergreen hover:text-action-clay" asChild>
              <a href="/api/logout">Sign Out</a>
            </Button>
          </>
        ) : (
          <>
            <a 
              href="/api/login" 
              className="text-sm font-medium text-brand-evergreen hover:text-action-clay transition cursor-pointer hidden sm:inline"
              data-testid="link-sign-in"
            >
              Sign In
            </a>
            <Link href="/search">
              <Button 
                className="rounded-lg bg-action-clay text-white font-medium shadow-md hover:shadow-lg hover:bg-action-clay/90 transition-all"
                data-testid="button-get-started"
              >
                Find Programs
              </Button>
            </Link>
            <Link href="/providers">
              <Button 
                variant="outline" 
                className="rounded-lg font-medium border border-brand-evergreen/50 text-brand-evergreen/80 hidden sm:inline-flex hover:border-brand-evergreen hover:text-brand-evergreen hover:bg-transparent transition-all"
                data-testid="button-nav-list-program"
              >
                List Your Program
              </Button>
            </Link>
          </>
        )}
      </div>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-sm bg-brand-white/95 border-b border-brand-evergreen/15 shadow-[0_2px_8px_rgba(26,77,62,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 text-brand-evergreen">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="10" width="15" height="80" rx="4" fill="currentColor" />
                <rect x="65" y="10" width="15" height="80" rx="4" fill="currentColor" />
                <path d="M35 60 C35 60, 50 75, 65 60" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                <circle cx="50" cy="35" r="7" className="text-action-clay fill-current" />
              </svg>
            </div>
            <span className="font-headline text-2xl text-brand-evergreen tracking-wide">HappiKid</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between flex-1 ml-10">
            <NavContent />
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5 text-brand-evergreen" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-brand-white">
                <div className="flex flex-col space-y-6 mt-6">
                  {mobileNavItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <span 
                        className={`text-lg font-medium transition-opacity cursor-pointer ${
                          item.isPrimary 
                            ? "text-action-clay font-semibold" 
                            : location === item.href 
                              ? "font-semibold text-action-clay" 
                              : "text-brand-evergreen hover:text-action-clay"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </span>
                    </Link>
                  ))}
                  
                  <div className="pt-4 border-t border-brand-evergreen/20">
                    {isAuthenticated ? (
                      <>
                        <div className="mb-4">
                          <span className="text-sm text-brand-evergreen">
                            Hello, {(user as any)?.firstName || (user as any)?.email}
                          </span>
                        </div>
                        <Button variant="outline" className="w-full rounded-lg border-2 border-brand-evergreen text-brand-evergreen hover:bg-brand-evergreen hover:text-white" asChild>
                          <a href="/api/logout">Sign Out</a>
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Button variant="ghost" className="w-full text-brand-evergreen hover:text-action-clay" asChild>
                          <a href="/api/login">Sign In</a>
                        </Button>
                        <Button className="w-full rounded-lg bg-action-clay text-white shadow-md hover:bg-action-clay/90" onClick={() => {setShowRoleSelection(true); setMobileMenuOpen(false);}}>
                          Get Started
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      <RoleSelectionModal 
        isOpen={showRoleSelection}
        onClose={() => setShowRoleSelection(false)}
      />
    </nav>
  );
}
