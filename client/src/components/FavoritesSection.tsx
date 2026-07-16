import { useState } from "react";
import { Heart, Users, Trash2, MoreHorizontal, MoreVertical, FolderPlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useDrag, useDrop } from "react-dnd";
import { useFavoriteGroups } from "@/hooks/useFavoriteGroups";
import type { Provider } from "@shared/schema";

const ItemTypes = { PROVIDER: "provider" };

function getTypeLabel(type: string): string {
  switch (type) {
    case "daycare": return "Daycare Center";
    case "afterschool": return "After-School Program";
    case "camp": return "Summer Camp";
    case "school": return "Private School";
    default: return type;
  }
}

function DraggableProviderItem({
  provider,
  currentGroup,
  onMoveProvider,
  children,
}: {
  provider: any;
  currentGroup: string | null;
  onMoveProvider: (providerId: number, fromGroup: string | null, toGroup: string | null) => void;
  children: React.ReactNode;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PROVIDER,
    item: { providerId: provider.id, currentGroup },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }} className="cursor-move">
      {children}
    </div>
  );
}

function DropZone({
  groupName,
  onDrop,
  children,
  isUngrouped = false,
}: {
  groupName: string | null;
  onDrop: (providerId: number, fromGroup: string | null, toGroup: string | null) => void;
  children: React.ReactNode;
  isUngrouped?: boolean;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.PROVIDER,
    drop: (item: { providerId: number; currentGroup: string | null }) => {
      if (item.currentGroup !== groupName) {
        onDrop(item.providerId, item.currentGroup, groupName);
      }
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }));

  return (
    <div
      ref={drop}
      className={`transition-colors ${isOver ? (isUngrouped
        ? "bg-action-sand border-2 border-dashed border-text-muted/40"
        : "bg-brand-sage border-2 border-dashed border-brand-evergreen/20"
      ) : ""}`}
    >
      {children}
    </div>
  );
}

interface FavoritesSectionProps {
  setSelectedProvider: (provider: Provider | null) => void;
  setShowProviderModal: (show: boolean) => void;
  setComparisonProviders: (providers: Provider[]) => void;
  setShowSavedGroupsModal: (show: boolean) => void;
  setShowComparisonModal: (show: boolean) => void;
}

export function FavoritesSection({
  setSelectedProvider,
  setShowProviderModal,
  setComparisonProviders,
  setShowSavedGroupsModal,
  setShowComparisonModal,
}: FavoritesSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [itemToRemove, setItemToRemove] = useState<{ favorite: any; provider: any } | null>(null);
  const [itemToMove, setItemToMove] = useState<{ favorite: any; provider: any } | null>(null);
  const [newGroupForMove, setNewGroupForMove] = useState("");
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const { isAuthenticated: favIsAuthenticated } = useAuth();
  const { groups, saveGroups } = useFavoriteGroups();

  const { data: favorites } = useQuery<any[]>({
    queryKey: ["/api/favorites"],
    enabled: favIsAuthenticated,
  });

  const handleLoadGroupIntoComparison = (name: string, groupProviders: Provider[]) => {
    setComparisonProviders(groupProviders);
    setShowSavedGroupsModal(false);
    setShowComparisonModal(true);
    toast({ title: "Group loaded", description: `"${name}" group loaded into comparison tool.` });
  };

  const removeFavoriteMutation = useMutation({
    mutationFn: async (providerId: number) => {
      await apiRequest("DELETE", `/api/favorites/${providerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${itemToRemove?.provider.id}/check`] });
      toast({ title: "Removed from favorites", description: `${itemToRemove?.provider.name} has been removed from your favorites.` });
      setItemToRemove(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove from favorites. Please try again.", variant: "destructive" });
    },
  });

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedItems.size === 0) {
      toast({ title: "Invalid group", description: "Please enter a group name and select at least one provider.", variant: "destructive" });
      return;
    }
    const newGroups = { ...groups, [groupName.trim()]: Array.from(selectedItems) };
    saveGroups(newGroups);
    setGroupName("");
    setSelectedItems(new Set());
    setIsCreatingGroup(false);
    toast({ title: "Group created", description: `"${groupName.trim()}" group created with ${selectedItems.size} providers.` });
  };

  const handleRemoveFromGroup = (name: string, providerId: number) => {
    const newGroups = { ...groups };
    newGroups[name] = newGroups[name].filter((id) => id !== providerId);
    if (newGroups[name].length === 0) delete newGroups[name];
    saveGroups(newGroups);
    toast({ title: "Removed from group", description: `Provider removed from "${name}" group.` });
  };

  const handleMoveToGroup = (name: string, providerId: number) => {
    const newGroups = { ...groups, [name]: [...(groups[name] || []), providerId] };
    saveGroups(newGroups);
    toast({ title: "Moved to group", description: `Provider moved to "${name}" group.` });
  };

  const handleCreateNewGroupForMove = (providerId: number) => {
    if (!newGroupForMove.trim()) {
      toast({ title: "Invalid group name", description: "Please enter a group name.", variant: "destructive" });
      return;
    }
    const newGroups = { ...groups, [newGroupForMove.trim()]: [providerId] };
    saveGroups(newGroups);
    setNewGroupForMove("");
    setItemToMove(null);
    toast({ title: "New group created", description: `Provider moved to new "${newGroupForMove.trim()}" group.` });
  };

  const handleMoveSelectedToGroup = (name: string) => {
    const selectedArray = Array.from(selectedItems);
    const newGroups = { ...groups, [name]: [...(groups[name] || []), ...selectedArray] };
    saveGroups(newGroups);
    setSelectedItems(new Set());
    toast({ title: "Items moved", description: `${selectedArray.length} items moved to "${name}" group.` });
  };

  const handleDragDropMove = (providerId: number, fromGroup: string | null, toGroup: string | null) => {
    const newGroups = { ...groups };
    if (fromGroup) {
      newGroups[fromGroup] = newGroups[fromGroup].filter((id) => id !== providerId);
      if (newGroups[fromGroup].length === 0) delete newGroups[fromGroup];
    }
    if (toGroup) {
      newGroups[toGroup] = [...(newGroups[toGroup] || []), providerId];
    }
    saveGroups(newGroups);
    toast({ title: "Provider moved", description: `Provider moved from ${fromGroup || "ungrouped"} to ${toGroup || "ungrouped"}.` });
  };

  const processedFavorites = favorites
    ? favorites.map((item: any) => {
        let favorite, provider;
        if (item.favorites && item.providers) {
          favorite = item.favorites;
          provider = item.providers;
        } else if (item.provider) {
          favorite = item;
          provider = item.provider;
        } else {
          favorite = item.favorites || item;
          provider = favorite.provider || item.providers;
        }
        if (!provider || !provider.name) return null;
        return { favorite, provider };
      }).filter(Boolean)
    : [];

  const ungroupedItems = processedFavorites.filter(
    (item: any) => !Object.values(groups).flat().includes(item.provider.id)
  );

  return (
    <div className="space-y-4">
      {processedFavorites.length === 0 ? (
        <div className="text-center py-6 rounded-lg bg-action-sand">
          <Heart className="h-8 w-8 mx-auto mb-2 text-brand-evergreen/40" />
          <p className="text-sm text-brand-evergreen">No favorite providers yet</p>
          <p className="text-xs text-brand-evergreen/60">Click the ❤️ on provider cards to save them</p>
        </div>
      ) : (
        <>
          {Object.entries(groups).map(([grpName, providerIds]) => {
            const groupItems = processedFavorites.filter((item: any) => providerIds.includes(item.provider.id));
            if (groupItems.length === 0) return null;

            return (
              <div key={grpName} className="rounded-2xl border p-3 bg-brand-sage border-brand-evergreen/10">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="flex items-center cursor-pointer hover:opacity-70 transition-opacity flex-1"
                    onClick={() => handleLoadGroupIntoComparison(grpName, groupItems.map((item: any) => item.provider))}
                  >
                    <Users className="h-4 w-4 mr-2 text-action-teal" />
                    <h4 className="font-medium text-brand-evergreen">{grpName} ({groupItems.length})</h4>
                    <Badge variant="outline" className="ml-2 text-xs border-action-teal text-action-teal">
                      Click to compare
                    </Badge>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setGroupToDelete(grpName)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <DropZone groupName={grpName} onDrop={handleDragDropMove}>
                  <div className="space-y-2">
                    {groupItems.map(({ favorite, provider }: any) => (
                      <DraggableProviderItem key={provider.id} provider={provider} currentGroup={grpName} onMoveProvider={handleDragDropMove}>
                        <div className="rounded-2xl border p-3 bg-brand-white border-text-muted/30">
                          <div className="flex items-center justify-between">
                            <div
                              className="flex-1 cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => { setSelectedProvider(provider); setShowProviderModal(true); }}
                            >
                              <h5 className="font-medium text-brand-evergreen">{provider.name}</h5>
                              <p className="text-sm text-brand-evergreen/80">{provider.borough}</p>
                              <p className="text-xs text-brand-evergreen/60">Saved {new Date(favorite.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">{getTypeLabel(provider.type)}</Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleRemoveFromGroup(grpName, provider.id)}>
                                    <ArrowLeft className="h-4 w-4 mr-2" />Move to Ungrouped
                                  </DropdownMenuItem>
                                  {Object.keys(groups).filter((g) => g !== grpName).map((otherGroup) => (
                                    <DropdownMenuItem key={otherGroup} onClick={() => { handleRemoveFromGroup(grpName, provider.id); handleMoveToGroup(otherGroup, provider.id); }}>
                                      <Users className="h-4 w-4 mr-2" />Move to "{otherGroup}"
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuItem onClick={() => setItemToMove({ favorite, provider })}>
                                    <FolderPlus className="h-4 w-4 mr-2" />Create New Group
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setItemToRemove({ favorite, provider })} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />Remove from Favorites
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </DraggableProviderItem>
                    ))}
                  </div>
                </DropZone>
              </div>
            );
          })}

          {ungroupedItems.length > 0 && (
            <DropZone groupName={null} onDrop={handleDragDropMove} isUngrouped>
              <div className="border border-brand-evergreen/10 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700 flex items-center">
                    <Heart className="h-4 w-4 mr-2" />
                    {Object.keys(groups).length > 0 ? "Ungrouped Favorites" : "My Favorites"} ({ungroupedItems.length})
                  </h4>
                </div>

                {ungroupedItems.length > 1 && (
                  <div className="bg-white p-3 rounded-lg mb-3 border border-brand-evergreen/10 space-y-2">
                    <div className="text-sm text-gray-600">
                      {selectedItems.size > 0 ? `${selectedItems.size} selected` : "Select multiple to organize"}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedItems.size > 0 && (
                        <Button size="sm" variant="outline" onClick={() => setSelectedItems(new Set())} className="flex-shrink-0">
                          Clear Selection
                        </Button>
                      )}
                      {selectedItems.size > 0 && Object.keys(groups).length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="flex-shrink-0">
                              <Users className="h-4 w-4 mr-1" />Move to Group
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {Object.entries(groups).map(([grpName, providerIds]) => (
                              <DropdownMenuItem key={grpName} onClick={() => handleMoveSelectedToGroup(grpName)}>
                                <Users className="h-4 w-4 mr-2" />Move to "{grpName}" ({providerIds.length})
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {selectedItems.size >= 1 && (
                        <Button size="sm" onClick={() => setIsCreatingGroup(true)} className="flex-shrink-0">
                          <FolderPlus className="h-4 w-4 mr-1" />Create Group
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {ungroupedItems.map(({ favorite, provider }: any) => (
                  <DraggableProviderItem key={provider.id} provider={provider} currentGroup={null} onMoveProvider={handleDragDropMove}>
                    <div className="bg-white border border-brand-evergreen/10 rounded-lg p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(provider.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedItems);
                              if (e.target.checked) newSelected.add(provider.id);
                              else newSelected.delete(provider.id);
                              setSelectedItems(newSelected);
                            }}
                            className="mr-3"
                          />
                          <div
                            className="flex-1 cursor-pointer hover:opacity-70 transition-opacity"
                            onClick={() => { setSelectedProvider(provider); setShowProviderModal(true); }}
                          >
                            <h5 className="font-medium text-brand-evergreen">{provider.name}</h5>
                            <p className="text-sm text-brand-evergreen/80">{provider.borough}</p>
                            <p className="text-xs text-brand-evergreen/60">Saved {new Date(favorite.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">{getTypeLabel(provider.type)}</Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {Object.keys(groups).length > 0 && (
                                <>
                                  {Object.entries(groups).map(([grpName, providerIds]) => (
                                    <DropdownMenuItem key={grpName} onClick={() => handleMoveToGroup(grpName, provider.id)}>
                                      <Users className="h-4 w-4 mr-2" />Move to "{grpName}" ({providerIds.length})
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem onClick={() => setItemToMove({ favorite, provider })}>
                                <FolderPlus className="h-4 w-4 mr-2" />Create new group
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setItemToRemove({ favorite, provider })} className="text-red-600 focus:text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />Remove from favorites
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </DraggableProviderItem>
                ))}
              </div>
            </DropZone>
          )}
        </>
      )}

      <Dialog open={isCreatingGroup} onOpenChange={setIsCreatingGroup}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Group</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                className="mt-1"
              />
            </div>
            <p className="text-sm text-gray-600">Creating group with {selectedItems.size} selected provider{selectedItems.size !== 1 ? "s" : ""}</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreatingGroup(false)}>Cancel</Button>
              <Button onClick={handleCreateGroup}>Create Group</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!itemToRemove} onOpenChange={() => setItemToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Favorites</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{itemToRemove?.provider.name}" from your favorites? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (itemToRemove) removeFavoriteMutation.mutate(itemToRemove.provider.id); }} className="bg-red-600 hover:bg-red-700">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!groupToDelete} onOpenChange={() => setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{groupToDelete}" group? This will remove the group but keep all providers in your individual favorites.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (groupToDelete) {
                  const newGroups = { ...groups };
                  delete newGroups[groupToDelete];
                  saveGroups(newGroups);
                  toast({ title: "Group deleted", description: `"${groupToDelete}" group has been deleted.` });
                  setGroupToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!itemToMove} onOpenChange={() => setItemToMove(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Group</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Create a new group for "{itemToMove?.provider.name}"</p>
            <div>
              <Label htmlFor="newGroupForMove">Group Name</Label>
              <Input
                id="newGroupForMove"
                value={newGroupForMove}
                onChange={(e) => setNewGroupForMove(e.target.value)}
                placeholder="Enter group name..."
                className="mt-1"
                onKeyPress={(e) => { if (e.key === "Enter" && itemToMove) handleCreateNewGroupForMove(itemToMove.provider.id); }}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setItemToMove(null)}>Cancel</Button>
              <Button onClick={() => { if (itemToMove) handleCreateNewGroupForMove(itemToMove.provider.id); }} disabled={!newGroupForMove.trim()}>
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
