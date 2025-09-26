import Navigation from "@/components/Navigation";
import ProviderCard from "@/components/ProviderCard";
import SearchFilters from "@/components/SearchFilters";
import ProviderModal from "@/components/ProviderModal";
import ContactInquiryModal from "@/components/ContactInquiryModal";
import ComparisonModal from "@/components/ComparisonModal";
import { SearchInsights } from "@/components/SearchInsights";
import { ConversationalSearch } from "@/components/ConversationalSearch";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious, 
  PaginationEllipsis 
} from "@/components/ui/pagination";
import { Search, Grid, List, Search as SearchIcon, Bookmark, Heart, Plus, Edit, Trash2, Users, X, MoreVertical, FolderPlus, MoreHorizontal, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Provider } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Define item type for drag and drop
const ItemTypes = {
  PROVIDER: 'provider',
};

// Draggable Provider Item Component
function DraggableProviderItem({ 
  provider, 
  favorite, 
  currentGroup, 
  onMoveProvider,
  children 
}: {
  provider: any;
  favorite: any;
  currentGroup: string | null;
  onMoveProvider: (providerId: number, fromGroup: string | null, toGroup: string | null) => void;
  children: React.ReactNode;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PROVIDER,
    item: { providerId: provider.id, currentGroup },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div 
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="cursor-move"
    >
      {children}
    </div>
  );
}

// Drop Zone Component
function DropZone({ 
  groupName, 
  onDrop, 
  children,
  isUngrouped = false 
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
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div 
      ref={drop}
      className={`transition-colors ${
        isOver 
          ? isUngrouped 
            ? 'bg-gray-100 border-2 border-dashed border-gray-400' 
            : 'bg-blue-100 border-2 border-dashed border-blue-400'
          : ''
      }`}
    >
      {children}
    </div>
  );
}

// Helper function to get full type labels
function getTypeLabel(type: string): string {
  switch(type) {
    case 'daycare': return 'Daycare Center';
    case 'afterschool': return 'After-School Program';
    case 'camp': return 'Summer Camp';
    case 'school': return 'Private School';
    default: return type;
  }
}

// Inline FavoritesSection component
function FavoritesSection({ 
  setSelectedProvider, 
  setShowProviderModal,
  setComparisonProviders,
  setShowSavedGroupsModal,
  setShowComparisonModal
}: {
  setSelectedProvider: (provider: Provider | null) => void;
  setShowProviderModal: (show: boolean) => void;
  setComparisonProviders: (providers: Provider[]) => void;
  setShowSavedGroupsModal: (show: boolean) => void;
  setShowComparisonModal: (show: boolean) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groups, setGroups] = useState<{[key: string]: number[]}>({});
  const [itemToRemove, setItemToRemove] = useState<{favorite: any, provider: any} | null>(null);
  const [itemToMove, setItemToMove] = useState<{favorite: any, provider: any} | null>(null);
  const [newGroupForMove, setNewGroupForMove] = useState("");
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  
  const { data: favorites } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: true,
  });

  // Load groups from localStorage and refresh when favorites change
  useEffect(() => {
    const savedGroups = localStorage.getItem('favoriteGroups');
    if (savedGroups) {
      const groups = JSON.parse(savedGroups);
      // Clean up empty groups
      const cleanGroups: {[key: string]: number[]} = {};
      Object.keys(groups).forEach(groupName => {
        if (groups[groupName] && groups[groupName].length > 0) {
          cleanGroups[groupName] = groups[groupName];
        }
      });
      
      // Update localStorage if we removed any empty groups
      if (Object.keys(cleanGroups).length !== Object.keys(groups).length) {
        localStorage.setItem('favoriteGroups', JSON.stringify(cleanGroups));
      }
      
      setGroups(cleanGroups);
    }
  }, [favorites]); // Refresh groups when favorites data changes

  // Function to refresh groups from localStorage
  const refreshGroups = () => {
    const savedGroups = localStorage.getItem('favoriteGroups');
    if (savedGroups) {
      setGroups(JSON.parse(savedGroups));
    }
  };

  // Function to load a group into comparison tool
  const handleLoadGroupIntoComparison = (groupName: string, groupProviders: Provider[]) => {
    setComparisonProviders(groupProviders);
    setShowSavedGroupsModal(false);
    setShowComparisonModal(true);
    
    toast({
      title: "Group loaded",
      description: `"${groupName}" group loaded into comparison tool.`,
    });
  };

  // Save groups to localStorage
  const saveGroups = (newGroups: {[key: string]: number[]}) => {
    setGroups(newGroups);
    localStorage.setItem('favoriteGroups', JSON.stringify(newGroups));
    // Dispatch custom event to notify parent component about groups count update
    window.dispatchEvent(new CustomEvent('groupsUpdated', { detail: newGroups }));
  };

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (providerId: number) => {
      await apiRequest("DELETE", `/api/favorites/${providerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${itemToRemove?.provider.id}/check`] });
      toast({
        title: "Removed from favorites",
        description: `${itemToRemove?.provider.name} has been removed from your favorites.`,
      });
      setItemToRemove(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedItems.size === 0) {
      toast({
        title: "Invalid group",
        description: "Please enter a group name and select at least one provider.",
        variant: "destructive",
      });
      return;
    }

    const newGroups = {
      ...groups,
      [groupName.trim()]: Array.from(selectedItems)
    };
    
    saveGroups(newGroups);
    setGroupName("");
    setSelectedItems(new Set());
    setIsCreatingGroup(false);
    
    toast({
      title: "Group created",
      description: `"${groupName.trim()}" group created with ${selectedItems.size} providers.`,
    });
  };

  const handleRemoveFromGroup = (groupName: string, providerId: number) => {
    const newGroups = { ...groups };
    newGroups[groupName] = newGroups[groupName].filter(id => id !== providerId);
    
    if (newGroups[groupName].length === 0) {
      delete newGroups[groupName];
    }
    
    saveGroups(newGroups);
    toast({
      title: "Removed from group",
      description: `Provider removed from "${groupName}" group.`,
    });
  };

  // Handle moving ungrouped item to existing group
  const handleMoveToGroup = (groupName: string, providerId: number) => {
    const newGroups = {
      ...groups,
      [groupName]: [...(groups[groupName] || []), providerId]
    };
    
    saveGroups(newGroups);
    toast({
      title: "Moved to group",
      description: `Provider moved to "${groupName}" group.`,
    });
  };

  // Handle creating new group for ungrouped item
  const handleCreateNewGroupForMove = (providerId: number) => {
    if (!newGroupForMove.trim()) {
      toast({
        title: "Invalid group name",
        description: "Please enter a group name.",
        variant: "destructive",
      });
      return;
    }

    const newGroups = {
      ...groups,
      [newGroupForMove.trim()]: [providerId]
    };
    
    saveGroups(newGroups);
    setNewGroupForMove("");
    setItemToMove(null);
    toast({
      title: "New group created",
      description: `Provider moved to new "${newGroupForMove.trim()}" group.`,
    });
  };

  // Handle moving selected items to existing group
  const handleMoveSelectedToGroup = (groupName: string) => {
    const selectedArray = Array.from(selectedItems);
    const newGroups = {
      ...groups,
      [groupName]: [...(groups[groupName] || []), ...selectedArray]
    };
    
    saveGroups(newGroups);
    setSelectedItems(new Set());
    toast({
      title: "Items moved",
      description: `${selectedArray.length} items moved to "${groupName}" group.`,
    });
  };

  // Handle drag and drop provider movement
  const handleDragDropMove = (providerId: number, fromGroup: string | null, toGroup: string | null) => {
    const newGroups = { ...groups };
    
    // Remove from source group
    if (fromGroup) {
      newGroups[fromGroup] = newGroups[fromGroup].filter(id => id !== providerId);
      if (newGroups[fromGroup].length === 0) {
        delete newGroups[fromGroup];
      }
    }
    
    // Add to target group (null means ungrouped)
    if (toGroup) {
      newGroups[toGroup] = [...(newGroups[toGroup] || []), providerId];
    }
    
    saveGroups(newGroups);
    
    const fromText = fromGroup || "ungrouped";
    const toText = toGroup || "ungrouped";
    toast({
      title: "Provider moved",
      description: `Provider moved from ${fromText} to ${toText}.`,
    });
  };

  const processedFavorites = favorites ? favorites.map((item: any) => {
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
    
    if (!provider || !provider.name) {
      return null;
    }
    
    return { favorite, provider };
  }).filter(Boolean) : [];

  const ungroupedItems = processedFavorites.filter(item => 
    !Object.values(groups).flat().includes(item.provider.id)
  );

  return (
    <div className="space-y-4">
      {processedFavorites.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <Heart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">No favorite providers yet</p>
          <p className="text-gray-500 text-xs">Click the ❤️ on provider cards to save them</p>
        </div>
      ) : (
        <>
          {/* Action Bar */}


          {/* Groups */}
          {Object.entries(groups).map(([groupName, providerIds]) => {
            const groupItems = processedFavorites.filter(item => 
              providerIds.includes(item.provider.id)
            );
            
            if (groupItems.length === 0) return null;
            
            return (
              <div key={groupName} className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="flex items-center cursor-pointer hover:text-blue-700 transition-colors flex-1"
                    onClick={() => handleLoadGroupIntoComparison(groupName, groupItems.map(item => item.provider))}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    <h4 className="font-medium text-blue-900">
                      {groupName} ({groupItems.length})
                    </h4>
                    <Badge variant="outline" className="ml-2 text-xs border-blue-300 text-blue-700">
                      Click to compare
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setGroupToDelete(groupName)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {groupItems.map(({ favorite, provider }) => (
                    <div key={provider.id} className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => {
                            setSelectedProvider(provider);
                            setShowProviderModal(true);
                          }}
                        >
                          <h5 className="font-medium text-gray-900">{provider.name}</h5>
                          <p className="text-sm text-gray-600">{provider.borough}</p>
                          <p className="text-xs text-gray-500">
                            Saved {new Date(favorite.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {getTypeLabel(provider.type)}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRemoveFromGroup(groupName, provider.id)}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Move to Ungrouped
                              </DropdownMenuItem>
                              {Object.keys(groups).filter(g => g !== groupName).map(otherGroup => (
                                <DropdownMenuItem
                                  key={otherGroup}
                                  onClick={() => {
                                    handleRemoveFromGroup(groupName, provider.id);
                                    handleMoveToGroup(otherGroup, provider.id);
                                  }}
                                >
                                  <Users className="h-4 w-4 mr-2" />
                                  Move to "{otherGroup}"
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuItem
                                onClick={() => setItemToMove({ favorite, provider })}
                              >
                                <FolderPlus className="h-4 w-4 mr-2" />
                                Create New Group
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setItemToRemove({ favorite, provider })}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove from Favorites
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Ungrouped Items */}
          {ungroupedItems.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700 flex items-center">
                  <Heart className="h-4 w-4 mr-2" />
                  {Object.keys(groups).length > 0 ? "Ungrouped Favorites" : "My Favorites"} ({ungroupedItems.length})
                </h4>
              </div>
              
              {/* Selection UI for ungrouped items */}
              {ungroupedItems.length > 1 && (
                <div className="bg-white p-3 rounded-lg mb-3 border border-gray-200 space-y-2">
                  <div className="text-sm text-gray-600">
                    {selectedItems.size > 0 ? `${selectedItems.size} selected` : `Select multiple to organize`}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedItems.size > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedItems(new Set())}
                        className="flex-shrink-0"
                      >
                        Clear Selection
                      </Button>
                    )}
                    {selectedItems.size > 0 && Object.keys(groups).length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="flex-shrink-0">
                            <Users className="h-4 w-4 mr-1" />
                            Move to Group
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {Object.entries(groups).map(([groupName, providerIds]) => (
                            <DropdownMenuItem
                              key={groupName}
                              onClick={() => handleMoveSelectedToGroup(groupName)}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Move to "{groupName}" ({providerIds.length})
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {selectedItems.size >= 1 && (
                      <Button
                        size="sm"
                        onClick={() => setIsCreatingGroup(true)}
                        className="flex-shrink-0"
                      >
                        <FolderPlus className="h-4 w-4 mr-1" />
                        Create Group
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {ungroupedItems.map(({ favorite, provider }) => (
                <div key={provider.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(provider.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedItems);
                          if (e.target.checked) {
                            newSelected.add(provider.id);
                          } else {
                            newSelected.delete(provider.id);
                          }
                          setSelectedItems(newSelected);
                        }}
                        className="mr-3"
                      />
                      <div 
                        className="flex-1 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => {
                          setSelectedProvider(provider);
                          setShowProviderModal(true);
                        }}
                      >
                        <h5 className="font-medium text-gray-900">{provider.name}</h5>
                        <p className="text-sm text-gray-600">{provider.borough}</p>
                        <p className="text-xs text-gray-500">
                          Saved {new Date(favorite.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {getTypeLabel(provider.type)}
                      </Badge>
                      
                      {/* Move to Group Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {Object.keys(groups).length > 0 && (
                            <>
                              {Object.entries(groups).map(([groupName, providerIds]) => (
                                <DropdownMenuItem
                                  key={groupName}
                                  onClick={() => handleMoveToGroup(groupName, provider.id)}
                                >
                                  <Users className="h-4 w-4 mr-2" />
                                  Move to "{groupName}" ({providerIds.length})
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => setItemToMove({ favorite, provider })}
                          >
                            <FolderPlus className="h-4 w-4 mr-2" />
                            Create new group
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setItemToRemove({ favorite, provider })}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove from favorites
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Group Dialog */}
      <Dialog open={isCreatingGroup} onOpenChange={setIsCreatingGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
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
            <div>
              <p className="text-sm text-gray-600">
                Creating group with {selectedItems.size} selected provider{selectedItems.size !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreatingGroup(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGroup}>
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!itemToRemove} onOpenChange={() => setItemToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Favorites</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{itemToRemove?.provider.name}" from your favorites? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToRemove) {
                  removeFavoriteMutation.mutate(itemToRemove.provider.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Group Deletion Confirmation Dialog */}
      <AlertDialog open={!!groupToDelete} onOpenChange={() => setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{groupToDelete}" group? 
              This will remove the group but keep all providers in your individual favorites. 
              This action cannot be undone.
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
                  toast({
                    title: "Group deleted",
                    description: `"${groupToDelete}" group has been deleted.`,
                  });
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

      {/* Move to New Group Dialog */}
      <Dialog open={!!itemToMove} onOpenChange={() => setItemToMove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Create a new group for "{itemToMove?.provider.name}"
            </p>
            <div>
              <Label htmlFor="newGroupForMove">Group Name</Label>
              <Input
                id="newGroupForMove"
                value={newGroupForMove}
                onChange={(e) => setNewGroupForMove(e.target.value)}
                placeholder="Enter group name..."
                className="mt-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && itemToMove) {
                    handleCreateNewGroupForMove(itemToMove.provider.id);
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setItemToMove(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (itemToMove) {
                    handleCreateNewGroupForMove(itemToMove.provider.id);
                  }
                }}
                disabled={!newGroupForMove.trim()}
              >
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SearchPage() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    type?: string;
    borough?: string;
    city?: string;
    ageRange?: string;
    priceRange?: string;
    features?: string[];
  }>({});
  const [sortBy, setSortBy] = useState("best-match");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Modal state
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [comparisonProviders, setComparisonProviders] = useState<Provider[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showSavedGroupsModal, setShowSavedGroupsModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalProviders, setTotalProviders] = useState(0);
  
  // Function to refresh groups when comparison is saved
  const handleGroupsSaved = () => {
    // Force a re-render by invalidating the favorites query
    // This will trigger the useEffect in FavoritesSection that loads groups
    queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
  };

  // Get search params from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    const type = urlParams.get('type');
    const borough = urlParams.get('borough');
    const city = urlParams.get('city');
    const features = urlParams.get('features');
    const cost = urlParams.get('cost');
    const ageRange = urlParams.get('ageRange');
    
    if (q) {
      setSearchQuery(q);
    }
    if (type) {
      setFilters(prev => ({ ...prev, type }));
    }
    if (borough) {
      setFilters(prev => ({ ...prev, borough }));
    }
    if (city) {
      setFilters(prev => ({ ...prev, city }));
    }
    if (features) {
      // Split features by comma and set as array
      setFilters(prev => ({ ...prev, features: features.split(',') }));
    }
    if (cost) {
      // Map cost level to price range
      const costToPrice: { [key: string]: string } = {
        '1': '0-1000',
        '2': '1000-2000', 
        '3': '2000-3000',
        '4': '3000+',
        '5': '3000+'
      };
      setFilters(prev => ({ ...prev, priceRange: costToPrice[cost] }));
    }
    if (ageRange) {
      setFilters(prev => ({ ...prev, ageRange }));
    }
  }, []);

  // Fetch providers with pagination
  const { data: providerResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/providers', { 
      search: searchQuery,
      type: filters.type,
      borough: filters.borough,
      city: filters.city,
      ageRange: filters.ageRange, // Send age range to backend
      features: filters.features?.join(','),
      priceRange: filters.priceRange,
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
    }],
    enabled: true,
    onSuccess: (data) => {
      // If the response includes total count, update it
      if (data && typeof data === 'object' && 'total' in data) {
        setTotalProviders(data.total);
      }
    }
  });

  // Extract providers from response (handle both array and object with providers/total)
  const providers = Array.isArray(providerResponse) ? providerResponse : providerResponse?.providers || [];
  const totalCount = Array.isArray(providerResponse) ? providers.length : providerResponse?.total || providers.length;

  // Fetch favorites if authenticated
  const { data: favorites = [] } = useQuery({
    queryKey: ['/api/favorites'],
    enabled: isAuthenticated,
  });

  const favoriteProviderIds = favorites.map((fav: any) => fav.provider?.id || fav.providerId);

  // Load groups from localStorage and count them
  const [groupsCount, setGroupsCount] = useState(0);
  
  useEffect(() => {
    const updateGroupsCount = () => {
      const savedGroups = localStorage.getItem('favoriteGroups');
      if (savedGroups) {
        try {
          const groups = JSON.parse(savedGroups);
          // Only count groups that have providers in them
          const nonEmptyGroups = Object.keys(groups).filter(groupName => 
            groups[groupName] && groups[groupName].length > 0
          );
          
          // Clean up empty groups
          const cleanGroups: {[key: string]: number[]} = {};
          Object.keys(groups).forEach(groupName => {
            if (groups[groupName] && groups[groupName].length > 0) {
              cleanGroups[groupName] = groups[groupName];
            }
          });
          
          // Update localStorage if we removed any empty groups
          if (Object.keys(cleanGroups).length !== Object.keys(groups).length) {
            localStorage.setItem('favoriteGroups', JSON.stringify(cleanGroups));
          }
          
          setGroupsCount(nonEmptyGroups.length);
        } catch (e) {
          // If parsing fails, clear localStorage and set count to 0
          localStorage.removeItem('favoriteGroups');
          setGroupsCount(0);
        }
      } else {
        setGroupsCount(0);
      }
    };

    // Initial load
    updateGroupsCount();
    
    // Listen for custom events from ProviderCard
    const handleGroupsUpdated = () => {
      updateGroupsCount();
    };
    
    window.addEventListener('groupsUpdated', handleGroupsUpdated);
    
    return () => {
      window.removeEventListener('groupsUpdated', handleGroupsUpdated);
    };
  }, [favorites]); // Refresh when favorites change

  const handleSearch = () => {
    refetch();
  };

  const handleProviderClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowProviderModal(true);
  };

  const handleRequestInfo = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowContactModal(true);
  };

  const handleAddToComparison = (provider: Provider) => {
    if (comparisonProviders.find(p => p.id === provider.id)) {
      toast({
        title: "Already in comparison",
        description: "This provider is already in your comparison list.",
        variant: "destructive",
      });
      return;
    }
    
    if (comparisonProviders.length >= 4) {
      toast({
        title: "Comparison limit reached",
        description: "You can compare up to 4 providers at a time.",
        variant: "destructive",
      });
      return;
    }

    setComparisonProviders(prev => [...prev, provider]);
    toast({
      title: "Added to comparison",
      description: `${provider.name} added to comparison list.`,
    });
  };

  const handleRemoveFromComparison = (providerId: number) => {
    setComparisonProviders(prev => prev.filter(p => p.id !== providerId));
  };

  const handleCompareProviders = () => {
    if (comparisonProviders.length < 2) {
      toast({
        title: "Need more providers",
        description: "Select at least 2 providers to compare.",
        variant: "destructive",
      });
      return;
    }
    setShowComparisonModal(true);
  };

  const handleSelectProvider = (provider: Provider) => {
    setShowComparisonModal(false);
    setSelectedProvider(provider);
    setShowProviderModal(true);
  };

  const getResultsText = () => {
    if (isLoading) return "Searching...";
    if (providers.length === 0) return "No providers found";
    return `${totalCount} childcare options found`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex max-w-4xl mx-auto gap-2">
            <div className="flex-1">
              <SearchAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                onSelect={(query) => {
                  setSearchQuery(query);
                  setTimeout(handleSearch, 100);
                }}
                placeholder="Try: 'Montessori programs in Jersey City' or 'after school for 6 year olds'"
              />
            </div>
            <Button 
              className="px-6 rounded-xl font-medium h-[54px] flex items-center justify-center"
              onClick={handleSearch}
            >
              Search
            </Button>
          </div>
        </div>

        {/* Conversational Search Examples */}
        <div className="max-w-4xl mx-auto mb-8">
          <ConversationalSearch 
            onSearch={(query) => {
              setSearchQuery(query);
              setTimeout(handleSearch, 100);
            }}
            currentQuery={searchQuery}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <SearchFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={() => setFilters({})}
            />
          </div>

          {/* Results */}
          <div className="lg:w-3/4">
            {/* Search Insights */}
            {searchQuery && providerResponse?.searchMetadata && (
              <SearchInsights 
                metadata={providerResponse.searchMetadata}
                resultsCount={providers.length}
              />
            )}

            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{getResultsText()}</h2>
                {searchQuery && (
                  <p className="text-gray-600 mt-1">for "{searchQuery}"</p>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSavedGroupsModal(true)}
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  My Groups
                  {groupsCount > 0 && (
                    <span className="ml-2 bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {groupsCount}
                    </span>
                  )}
                </Button>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best-match">Best Match</SelectItem>
                    <SelectItem value="highest-rated">Highest Rated</SelectItem>
                    <SelectItem value="lowest-price">Lowest Price</SelectItem>
                    <SelectItem value="nearest">Nearest</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Comparison Bar */}
            {comparisonProviders.length > 0 && (
              <Card className="mb-6 bg-primary-50 border-primary-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="font-medium text-primary-800">
                        Compare ({comparisonProviders.length})
                      </span>
                      <div className="flex space-x-2">
                        {comparisonProviders.map(provider => (
                          <Badge 
                            key={provider.id} 
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => handleRemoveFromComparison(provider.id)}
                          >
                            {provider.name} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={handleCompareProviders}
                      disabled={comparisonProviders.length < 2}
                    >
                      Compare & Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-[4/3] bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Provider Grid */}
            {!isLoading && providers.length > 0 && (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 gap-6" 
                : "space-y-6"
              }>
                {providers.map((provider: Provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    onViewDetails={handleProviderClick}
                    onRequestInfo={handleRequestInfo}
                    onAddToComparison={handleAddToComparison}
                    onRemoveFromComparison={handleRemoveFromComparison}
                    isInComparison={comparisonProviders.some(p => p.id === provider.id)}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && providers.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No providers found for your search
                  </h3>
                  <div className="text-gray-600 mb-6 space-y-2">
                    <p>
                      We couldn't find any providers matching your current filters.
                    </p>
                    {filters.type && filters.ageRange && (
                      <p className="text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3 inline-block">
                        <strong>Tip:</strong> {getTypeLabel(filters.type)} programs typically serve{" "}
                        {filters.type === 'daycare' && 'infants through preschool age (0-5 years)'}
                        {filters.type === 'afterschool' && 'school-age children (5+ years)'}
                        {filters.type === 'school' && 'preschool through elementary age (3-12 years)'}
                        {filters.type === 'camp' && 'all ages with age-specific programs'}
                        . Try adjusting the age range filter.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchQuery("");
                        setFilters({});
                        setCurrentPage(1);
                        refetch();
                      }}
                    >
                      Clear All Filters
                    </Button>
                    {filters.ageRange && (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setFilters(prev => ({ ...prev, ageRange: undefined }));
                          setCurrentPage(1);
                          refetch();
                        }}
                      >
                        Remove Age Filter
                      </Button>
                    )}
                    {filters.borough && (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setFilters(prev => ({ ...prev, borough: undefined }));
                          setCurrentPage(1);
                          refetch();
                        }}
                      >
                        Remove Location Filter
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {!isLoading && providers.length > 0 && totalCount > itemsPerPage && (
              <div className="flex flex-col items-center space-y-4 mt-8">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
                  </span>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                    setItemsPerPage(parseInt(value));
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-600">per page</span>
                </div>
                
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, Math.ceil(totalCount / itemsPerPage)) }, (_, i) => {
                      const totalPages = Math.ceil(totalCount / itemsPerPage);
                      let page;
                      
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(Math.min(Math.ceil(totalCount / itemsPerPage), currentPage + 1))}
                        className={currentPage === Math.ceil(totalCount / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Inquiry Modal */}
      <ContactInquiryModal
        provider={selectedProvider}
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          setSelectedProvider(null);
        }}
      />

      {/* Provider Detail Modal */}
      <ProviderModal
        provider={selectedProvider}
        isOpen={showProviderModal}
        onClose={() => {
          setShowProviderModal(false);
          setSelectedProvider(null);
        }}
      />

      {/* Comparison Modal */}
      <ComparisonModal
        providers={comparisonProviders}
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        onSelectProvider={handleSelectProvider}
        onRemoveProvider={handleRemoveFromComparison}
        onGroupsSaved={handleGroupsSaved}
      />

      {/* Saved Groups Dialog */}
      <Dialog open={showSavedGroupsModal} onOpenChange={setShowSavedGroupsModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>My Saved Groups</DialogTitle>
            <DialogDescription>
              Organize and manage your saved providers in custom groups
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* How it works */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-700 space-y-2">
                <p>• <strong>Save individual providers:</strong> Click the ❤️ heart icon on any provider card</p>
                <p>• <strong>Save comparison groups:</strong> Use "Compare & Save" to create provider groups</p>
                <p>• <strong>Launch group comparison:</strong> Click on any group name to load it into the comparison tool</p>
                <p>• <strong>Organize with custom names:</strong> Create groups like "Top 3 Daycares" or "Summer Camp Options"</p>
              </div>
            </div>

            {/* Unified Groups Display */}
            {isAuthenticated ? (
              <FavoritesSection 
                setSelectedProvider={setSelectedProvider}
                setShowProviderModal={setShowProviderModal}
                setComparisonProviders={setComparisonProviders}
                setShowSavedGroupsModal={setShowSavedGroupsModal}
                setShowComparisonModal={setShowComparisonModal}
              />
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">Sign in to save and organize providers in groups</p>
              </div>
            )}

            {/* Current Comparison Preview */}
            {comparisonProviders.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Current Comparison</h4>
                <p className="text-sm text-green-700 mb-2">
                  {comparisonProviders.length} provider{comparisonProviders.length !== 1 ? 's' : ''} ready to save as group
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {comparisonProviders.map((provider) => (
                    <Badge key={provider.id} variant="secondary" className="text-xs">
                      {provider.name}
                    </Badge>
                  ))}
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setShowSavedGroupsModal(false);
                    setShowComparisonModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 w-full"
                >
                  Compare & Save as Group
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
