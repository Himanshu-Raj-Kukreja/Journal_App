import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Journal } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold, Italic, Underline as UnderlineIcon, Link2, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Smile, Calendar, Tag, Save, Loader2, Heading as HeadingIcon, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface JournalEditorProps {
  journal: Journal;
}

export function JournalEditor({ journal }: JournalEditorProps) {
  const [tags, setTags] = useState<string[]>(journal.tags || []);
  const [mood, setMood] = useState<string>(journal.mood || '');
  const [date, setDate] = useState<Date>(new Date(journal.date || Date.now()));
  const { toast } = useToast();

  // Update state when journal changes
  useEffect(() => {
    setTags(journal.tags || []);
    setMood(journal.mood || '');
    setDate(new Date(journal.date || Date.now()));
    editor?.commands.setContent(journal.content || '');
  }, [journal]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: journal.content,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      updateMutation.mutate({
        content,
        tags,
        mood,
        date: date.toISOString(),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      content: string;
      tags: string[];
      mood: string;
      date: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/journals/${journal.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      const newTags = [...tags, tag];
      setTags(newTags);
      updateMutation.mutate({
        content: editor?.getHTML() || '',
        tags: newTags,
        mood,
        date: date.toISOString(),
      });
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    updateMutation.mutate({
      content: editor?.getHTML() || '',
      tags: newTags,
      mood,
      date: date.toISOString(),
    });
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await apiRequest("POST", "/api/upload", formData);
      const { url } = await res.json();
      editor?.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  const uploadDocument = async (file: File) => {
    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await apiRequest("POST", "/api/upload", formData);
      const { url } = await res.json();
      // Handle document upload -  you might want to insert a link to the document here
      editor?.chain().focus().insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${file.name}</a>`).run();

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    }
  };


  // Add home button in the toolbar
  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="mb-4 shadow-lg">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/'}
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {journal.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    if (newDate) {
                      setDate(newDate);
                      updateMutation.mutate({
                        content: editor?.getHTML() || '',
                        tags,
                        mood,
                        date: newDate.toISOString(),
                      });
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Smile className="h-4 w-4 mr-2" />
                  {mood || "Set Mood"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="grid grid-cols-4 gap-2 p-2">
                {["😊", "😔", "😌", "🤔", "😤", "😴", "🥳", "😎"].map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    className="text-lg"
                    onClick={() => setMood(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>

            <div className="flex-1 flex items-center space-x-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Add tags..."
                className="w-auto"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTag((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((tag) => (
                <Button
                  key={tag}
                  variant="secondary"
                  size="sm"
                  onClick={() => removeTag(tag)}
                  className="text-sm"
                >
                  #{tag}
                  <span className="ml-2 text-muted-foreground">×</span>
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="p-2 border-b bg-muted/40 flex items-center space-x-1 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <HeadingIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col space-y-1 p-1">
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <Button
                  key={level}
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleHeading({ level }).run()}
                  className={editor?.isActive('heading', { level }) ? 'bg-muted' : ''}
                >
                  H{level}
                </Button>
              ))}
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={editor?.isActive('bold') ? 'bg-muted' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={editor?.isActive('italic') ? 'bg-muted' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={editor?.isActive('underline') ? 'bg-muted' : ''}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            className={editor?.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            className={editor?.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            className={editor?.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={editor?.isActive('bulletList') ? 'bg-muted' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={editor?.isActive('orderedList') ? 'bg-muted' : ''}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = window.prompt('Enter the URL');
              if (url) {
                editor?.chain().focus().setLink({ href: url }).run();
              }
            }}
            className={editor?.isActive('link') ? 'bg-muted' : ''}
          >
            <Link2 className="h-4 w-4" />
          </Button>
          <label htmlFor="file-upload">
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept="image/*,.doc,.docx,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              if (file.type.startsWith('image/')) {
                uploadImage(file);
              } else {
                uploadDocument(file);
              }
            }}
          />
        </div>

        <div className="p-4 min-h-[500px] prose prose-indigo max-w-none">
          <EditorContent editor={editor} />
        </div>
      </Card>
    </div>
  );
}