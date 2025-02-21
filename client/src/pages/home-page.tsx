import { Sidebar } from "@/components/layout/sidebar";
import { JournalEditor } from "@/components/editor/journal-editor";
import { useQuery } from "@tanstack/react-query";
import { Journal, Folder } from "@shared/schema";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [selectedJournalId, setSelectedJournalId] = useState<number | null>(null);

  const { data: journals, isLoading: journalsLoading } = useQuery<Journal[]>({
    queryKey: ["/api/journals"],
  });

  const { data: folders, isLoading: foldersLoading } = useQuery<Folder[]>({
    queryKey: ["/api/folders"],
  });

  const selectedJournal = journals?.find((j) => j.id === selectedJournalId);

  if (journalsLoading || foldersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        journals={journals || []}
        folders={folders || []}
        selectedJournalId={selectedJournalId}
        onSelectJournal={setSelectedJournalId}
      />
      <main className="flex-1 overflow-y-auto">
        {selectedJournal ? (
          <JournalEditor journal={selectedJournal} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select or create a journal to get started
          </div>
        )}
      </main>
    </div>
  );
}
