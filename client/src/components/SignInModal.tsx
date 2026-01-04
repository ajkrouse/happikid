import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, LogIn } from "lucide-react";
import { SiGoogle, SiApple, SiGithub } from "react-icons/si";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnTo?: string;
}

export function SignInModal({ isOpen, onClose, returnTo }: SignInModalProps) {
  const handleSignIn = () => {
    // Redirect to Replit Auth - it handles Google, Apple, GitHub, and email login
    const loginUrl = returnTo 
      ? `/api/login?returnTo=${encodeURIComponent(returnTo)}`
      : '/api/login';
    window.location.href = loginUrl;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-brand-evergreen">Sign in to HappiKid</DialogTitle>
          <DialogDescription>
            Save favorites, message providers, and get personalized recommendations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Social login preview - these are handled by Replit Auth */}
          <div className="space-y-3">
            <Button
              onClick={handleSignIn}
              variant="outline"
              className="w-full flex items-center gap-3 h-12 text-base"
              type="button"
              data-testid="button-signin-google"
            >
              <SiGoogle className="w-5 h-5 text-[#4285F4]" />
              Continue with Google
            </Button>

            <Button
              onClick={handleSignIn}
              variant="outline"
              className="w-full flex items-center gap-3 h-12 text-base bg-black text-white hover:bg-gray-800 border-black"
              type="button"
              data-testid="button-signin-apple"
            >
              <SiApple className="w-5 h-5" />
              Continue with Apple
            </Button>

            <Button
              onClick={handleSignIn}
              variant="outline"
              className="w-full flex items-center gap-3 h-12 text-base"
              type="button"
              data-testid="button-signin-github"
            >
              <SiGithub className="w-5 h-5" />
              Continue with GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>

          <Button
            onClick={handleSignIn}
            className="w-full h-12 text-base bg-action-clay hover:bg-action-clay/90"
            type="button"
            data-testid="button-signin-email"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign in with Email
          </Button>

          {/* Trust indicators */}
          <div className="bg-brand-sage/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-action-teal flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-brand-evergreen">Secure & Private</p>
                <p className="text-xs text-text-muted mt-1">
                  Your data is protected. We never share your information with third parties.
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            <br />
            <span className="text-brand-evergreen">New users are automatically registered.</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
