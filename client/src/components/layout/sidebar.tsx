import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Journal, Folder } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, FolderPlus, FileText, LogOut, ChevronDown,
  ChevronRight, Search, Calendar, Star, Settings, Sun, Moon
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2 } from "lucide-react";

interface SidebarProps {
  journals: Journal[];
  folders: Folder[];
  selectedJournalId: number | null;
  onSelectJournal: (id: number) => void;
}

export function Sidebar({ journals, folders, selectedJournalId, onSelectJournal }: SidebarProps) {
  const [newJournalOpen, setNewJournalOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Record<number, boolean>>({});
  const [starredJournals, setStarredJournals] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();

  const todayJournals = useMemo(() => {
    const today = new Date().toDateString();
    return journals.filter(journal => new Date(journal.date).toDateString() === today);
  }, [journals]);

  const favoriteJournals = useMemo(() => {
    return journals.filter(journal => starredJournals.has(journal.id));
  }, [journals, starredJournals]);

  const toggleStar = (journalId: number) => {
    setStarredJournals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(journalId)) {
        newSet.delete(journalId);
      } else {
        newSet.add(journalId);
      }
      return newSet;
    });
  };

  const createJournalMutation = useMutation({
    mutationFn: async (data: { title: string; type: string; folderId?: number | null }) => {
      const res = await apiRequest("POST", "/api/journals", {
        ...data,
        date: new Date().toISOString(),
        content: "",
        tags: [],
        mood: "",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      setNewJournalOpen(false);
      toast({
        title: "Journal created",
        description: "Your new journal has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create journal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiRequest("POST", "/api/folders", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setNewFolderOpen(false);
      toast({
        title: "Folder created",
        description: "Your new folder has been created",
      });
    },
  });

  const toggleFolder = (folderId: number) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const filteredJournals = useMemo(() => {
    if (!searchQuery) return journals;
    const query = searchQuery.toLowerCase();
    return journals.filter(journal =>
      journal.title.toLowerCase().includes(query) ||
      journal.content.toLowerCase().includes(query) ||
      journal.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [journals, searchQuery]);

  return (
    <div className="w-72 border-r bg-sidebar flex flex-col h-screen">
      <div className="p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <h1 className="font-semibold text-xl">Journalize</h1>
        <p className="text-sm text-indigo-100">Welcome, {user?.username}</p>
      </div>

      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search journals..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="p-4 flex space-x-2 border-b">
        <Dialog open={newJournalOpen} onOpenChange={setNewJournalOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              New Journal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Journal</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const folderId = formData.get("folderId");
                createJournalMutation.mutate({
                  title: formData.get("title") as string,
                  type: formData.get("type") as string,
                  folderId: folderId ? Number(folderId) : null,
                });
              }}
              className="space-y-4"
            >
              <Input
                name="title"
                placeholder="Journal Title"
                required
                className="bg-white"
              />
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Journal Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Journal</SelectItem>
                  <SelectItem value="casual">Casual Journal</SelectItem>
                  <SelectItem value="gratitude">Gratitude Journal</SelectItem>
                  <SelectItem value="travel">Travel Journal</SelectItem>
                  <SelectItem value="dream">Dream Journal</SelectItem>
                </SelectContent>
              </Select>
              <Select name="folderId">
                <SelectTrigger>
                  <SelectValue placeholder="Select Folder (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                disabled={createJournalMutation.isPending}
              >
                {createJournalMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Journal
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FolderPlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createFolderMutation.mutate({
                  name: formData.get("name") as string,
                });
              }}
              className="space-y-4"
            >
              <Input name="name" placeholder="Folder Name" required />
              <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                Create Folder
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                if (todayJournals.length > 0) {
                  onSelectJournal(todayJournals[0].id);
                } else {
                  toast({
                    title: "No journals for today",
                    description: "Create a new journal to start writing",
                  });
                }
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Today ({todayJournals.length})
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                if (favoriteJournals.length > 0) {
                  onSelectJournal(favoriteJournals[0].id);
                } else {
                  toast({
                    title: "No favorite journals",
                    description: "Star journals to add them to favorites",
                  });
                }
              }}
            >
              <Star className="h-4 w-4 mr-2" />
              Favorites ({favoriteJournals.length})
            </Button>
          </div>

          <div className="h-px bg-border my-4" />

          {folders.map((folder) => (
            <Collapsible
              key={folder.id}
              open={expandedFolders[folder.id]}
              onOpenChange={() => toggleFolder(folder.id)}
              className="space-y-2"
            >
              <CollapsibleTrigger className="flex items-center w-full hover:bg-accent rounded-md p-2">
                {expandedFolders[folder.id] ? (
                  <ChevronDown className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                <span className="font-medium">{folder.name}</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1">
                {filteredJournals
                  .filter((j) => j.folderId === folder.id)
                  .map((journal) => (
                    <div key={journal.id} className="flex items-center">
                      <Button
                        variant={selectedJournalId === journal.id ? "secondary" : "ghost"}
                        className="flex-1 justify-start"
                        onClick={() => onSelectJournal(journal.id)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {journal.title}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStar(journal.id)}
                      >
                        <Star
                          className={cn("h-4 w-4", {
                            "fill-yellow-400 text-yellow-400": starredJournals.has(journal.id),
                          })}
                        />
                      </Button>
                    </div>
                  ))}
              </CollapsibleContent>
            </Collapsible>
          ))}

          <div className="space-y-2">
            <h3 className="font-medium px-2">Unfiled</h3>
            {filteredJournals
              .filter((j) => !j.folderId)
              .map((journal) => (
                <div key={journal.id} className="flex items-center">
                  <Button
                    variant={selectedJournalId === journal.id ? "secondary" : "ghost"}
                    className="flex-1 justify-start"
                    onClick={() => onSelectJournal(journal.id)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {journal.title}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStar(journal.id)}
                  >
                    <Star
                      className={cn("h-4 w-4", {
                        "fill-yellow-400 text-yellow-400": starredJournals.has(journal.id),
                      })}
                    />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t mt-auto space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => window.location.href = "/settings"}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            const currentTheme = localStorage.getItem('theme') === 'dark';
            localStorage.setItem('theme', currentTheme ? 'light' : 'dark');
            document.documentElement.classList.toggle('dark', !currentTheme);
          }}
        >
          {localStorage.getItem('theme') === 'dark' ? (
            <>
              <Sun className="h-4 w-4 mr-2" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 mr-2" />
              Dark Mode
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}