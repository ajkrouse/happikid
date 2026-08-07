/**
 * Lazy-load boundary: bundles FavoritesSection together with react-dnd so
 * the DnD libraries are deferred until the "My Groups" dialog is opened.
 */
import { DndProvider } from "react-dnd";
import { MultiBackend } from "react-dnd-multi-backend";
import { HTML5toTouch } from "rdndmb-html5-to-touch";
import { FavoritesSection } from "@/components/FavoritesSection";
import type { Provider } from "@shared/schema";

interface FavoritesSectionWithDndProps {
  setSelectedProvider: (provider: Provider | null) => void;
  setShowProviderModal: (show: boolean) => void;
  setComparisonProviders: (providers: Provider[]) => void;
  setShowSavedGroupsModal: (show: boolean) => void;
  setShowComparisonModal: (show: boolean) => void;
}

export default function FavoritesSectionWithDnd(props: FavoritesSectionWithDndProps) {
  return (
    <DndProvider backend={MultiBackend} options={HTML5toTouch}>
      <FavoritesSection {...props} />
    </DndProvider>
  );
}
