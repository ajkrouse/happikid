import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, Menu, X } from "lucide-react";
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

  const navItems = isAuthenticated ? [
    { href: "/search", label: "Find Care" },
    { href: "/provider/dashboard", label: "Provider Dashboard" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ] : [
    { href: "/search", label: "Find Care" },
    { href: "/providers", label: "For Providers" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const NavContent = () => (
    <>
      <div className="flex items-center space-x-8">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <span className={`text-sm font-medium transition-colors cursor-pointer ${
              location === item.href ? "text-primary font-semibold" : "text-gray-700 hover:text-primary"
            }`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        {isLoading ? (
          <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
        ) : isAuthenticated ? (
          <>
            <div className="text-gray-700 px-4 py-2 font-medium text-sm">
              {(user as any)?.firstName || (user as any)?.email?.split('@')[0]}
            </div>
            <Button variant="ghost" className="px-4 font-medium" asChild>
              <a href="/api/logout">Sign Out</a>
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" className="px-4 font-medium" asChild>
              <a href="/api/login">Sign In</a>
            </Button>
            <Button 
              onClick={() => setShowRoleSelection(true)} 
              className="bg-primary hover:bg-primary-600 text-white font-medium"
              data-testid="button-get-started"
            >
              Get Started
            </Button>
          </>
        )}
      </div>
    </>
  );

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer space-x-2">
              <Heart className="h-6 w-6 text-primary" />
              <span className="text-display text-2xl text-gray-900">
                HappiKid
              </span>
            </div>
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
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-6 mt-6">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <span 
                        className={`text-lg font-medium transition-colors hover:text-primary cursor-pointer ${
                          location === item.href ? "text-primary" : "text-gray-600"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </span>
                    </Link>
                  ))}
                  
                  <div className="pt-4 border-t">
                    {isAuthenticated ? (
                      <>
                        <div className="mb-4">
                          <span className="text-sm text-gray-600">
                            Hello, {(user as any)?.firstName || (user as any)?.email}
                          </span>
                        </div>
                        <Button variant="outline" className="w-full" asChild>
                          <a href="/api/logout">Sign Out</a>
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Button variant="ghost" className="w-full" asChild>
                          <a href="/api/login">Sign In</a>
                        </Button>
                        <Button className="w-full" onClick={() => {setShowRoleSelection(true); setMobileMenuOpen(false);}}>
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
