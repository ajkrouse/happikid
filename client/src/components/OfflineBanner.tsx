import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff } from "lucide-react";

/**
 * Shows a sticky banner at the top of the screen when the user loses their
 * internet connection. Dismisses automatically when the connection returns.
 * Prevents blank screens by giving users clear feedback during navigation.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-gray-900 text-white text-sm font-medium py-2 px-4"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>You're offline — check your connection to continue browsing.</span>
    </div>
  );
}
