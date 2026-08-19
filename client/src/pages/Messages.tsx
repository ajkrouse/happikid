import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "wouter";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import {
  MessageSquare,
  Send,
  ChevronLeft,
  Circle,
  CheckCircle2,
  UserX,
  Sparkles,
  Pencil,
  Trash2,
} from "lucide-react";

interface ThreadSummary {
  id: number;
  providerId: number;
  parentUserId: string;
  status: "open" | "enrolled" | "not_a_fit";
  createdAt: string;
  updatedAt: string;
  aiDraftBody?: string | null;
  aiDraftMessageId?: number | null;
  provider: { id: number; name: string } | null;
  parentUser: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
  latestMessage: { body: string; createdAt: string; senderUserId: string } | null;
  unreadCount: number;
  messageCount: number;
}

interface ThreadMessage {
  id: number;
  threadId: number;
  senderUserId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

interface ThreadDetail {
  thread: ThreadSummary;
  messages: ThreadMessage[];
  provider: any;
}

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  enrolled: "Enrolled",
  not_a_fit: "Not a Fit",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  enrolled: "bg-green-100 text-green-700",
  not_a_fit: "bg-gray-100 text-gray-500",
};

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export default function Messages() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const initialThreadId = params.get("thread") ? parseInt(params.get("thread")!) : null;

  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(initialThreadId);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: threads = [], isLoading: threadsLoading } = useQuery<ThreadSummary[]>({
    queryKey: ["/api/threads"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: threadDetail, isLoading: detailLoading } = useQuery<ThreadDetail>({
    queryKey: [`/api/threads/${selectedThreadId}`],
    enabled: isAuthenticated && selectedThreadId !== null,
    refetchInterval: 15000,
  });

  // Determine if current user is provider owner of selected thread
  // Canonical owner check: ownerUserId wins for claimed listings;
  // fall back to userId only when ownerUserId is absent (direct-created listing).
  const canonicalProviderOwner =
    threadDetail?.provider?.ownerUserId ?? threadDetail?.provider?.userId ?? null;
  const isProviderRole = canonicalProviderOwner !== null && canonicalProviderOwner === user?.id;

  // Mark as read when thread is opened
  const markReadMutation = useMutation({
    mutationFn: async (threadId: number) => {
      await apiRequest("POST", `/api/threads/${threadId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
    },
  });

  useEffect(() => {
    if (selectedThreadId && threadDetail) {
      markReadMutation.mutate(selectedThreadId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId, threadDetail?.messages?.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadDetail?.messages]);

  const sendReplyMutation = useMutation({
    mutationFn: async ({ threadId, body }: { threadId: number; body: string }) => {
      const res = await apiRequest("POST", `/api/threads/${threadId}/messages`, { body });
      return res.json();
    },
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: [`/api/threads/${selectedThreadId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ threadId, status }: { threadId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/threads/${threadId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/threads/${selectedThreadId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      toast({ title: "Status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  // ----- AI draft reply (provider side, human-in-the-loop) -----
  const generateDraftMutation = useMutation({
    mutationFn: async (threadId: number) => {
      const res = await apiRequest("POST", `/api/threads/${threadId}/ai-draft`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/threads/${selectedThreadId}`] });
    },
    onError: () => {
      // Draft generation is best-effort; the provider can always write their own reply
    },
  });

  const discardDraftMutation = useMutation({
    mutationFn: async (threadId: number) => {
      await apiRequest("DELETE", `/api/threads/${threadId}/ai-draft`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/threads/${selectedThreadId}`] });
    },
    onError: () => {
      toast({ title: "Failed to discard draft", variant: "destructive" });
    },
  });

  const aiEnabled = !!threadDetail?.provider?.aiAutoReplyEnabled;
  const lastMessage = threadDetail?.messages?.[threadDetail.messages.length - 1];
  const lastIsFromParent = !!lastMessage && lastMessage.senderUserId !== user?.id;
  const currentDraft =
    isProviderRole &&
    threadDetail?.thread?.aiDraftBody &&
    lastMessage &&
    threadDetail.thread.aiDraftMessageId === lastMessage.id
      ? threadDetail.thread.aiDraftBody
      : null;
  // A thread whose aiDraftMessageId already points at the latest parent message but has
  // no body means the provider discarded that draft — don't auto-regenerate it.
  const draftHandledForLastMessage =
    !!lastMessage && threadDetail?.thread?.aiDraftMessageId === lastMessage.id;

  // Auto-generate a draft when the provider opens a thread whose latest message
  // is from the parent and no draft was generated (or discarded) for it yet.
  useEffect(() => {
    if (
      isProviderRole &&
      aiEnabled &&
      lastIsFromParent &&
      !draftHandledForLastMessage &&
      selectedThreadId &&
      !generateDraftMutation.isPending
    ) {
      generateDraftMutation.mutate(selectedThreadId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId, isProviderRole, aiEnabled, lastMessage?.id, draftHandledForLastMessage]);

  const handleSend = () => {
    if (!selectedThreadId || !replyText.trim()) return;
    sendReplyMutation.mutate({ threadId: selectedThreadId, body: replyText.trim() });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-md mx-auto py-24 px-4 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Sign in to view messages</h2>
          <p className="text-gray-500 mb-6">Your conversations with providers live here.</p>
          <Button asChild className="bg-action-clay hover:bg-action-clay/90">
            <a href={`/api/login?returnTo=/messages`}>Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-brand-evergreen">
            Messages
            {totalUnread > 0 && (
              <Badge className="ml-2 bg-action-clay text-white">{totalUnread}</Badge>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Your conversations with childcare providers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)] min-h-[500px]">
          {/* Thread list */}
          <div
            className={`md:col-span-1 flex flex-col gap-2 overflow-y-auto ${
              selectedThreadId ? "hidden md:flex" : "flex"
            }`}
          >
            {threadsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : threads.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">No conversations yet.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Click "Message" on any provider to start chatting.
                  </p>
                </CardContent>
              </Card>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                    selectedThreadId === thread.id
                      ? "border-action-teal bg-action-teal/5"
                      : "border-gray-200 bg-white"
                  }`}
                  onClick={() => setSelectedThreadId(thread.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-brand-evergreen text-sm truncate">
                          {thread.provider?.name ?? thread.parentUser?.firstName ?? "Conversation"}
                        </span>
                        {thread.unreadCount > 0 && (
                          <span className="flex-shrink-0 bg-action-clay text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {thread.latestMessage?.body ?? "No messages yet"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-400">
                        {thread.latestMessage ? formatRelative(thread.latestMessage.createdAt) : ""}
                      </span>
                      <Badge className={`text-xs ${STATUS_COLORS[thread.status]}`}>
                        {STATUS_LABELS[thread.status]}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Thread detail */}
          <div
            className={`md:col-span-2 flex flex-col bg-white rounded-xl border-2 border-gray-200 overflow-hidden ${
              selectedThreadId ? "flex" : "hidden md:flex"
            }`}
          >
            {!selectedThreadId ? (
              <div className="flex-1 flex items-center justify-center text-center px-8">
                <div>
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Select a conversation to view messages</p>
                </div>
              </div>
            ) : detailLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : threadDetail ? (
              <>
                {/* Thread header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden"
                      onClick={() => setSelectedThreadId(null)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <p className="font-semibold text-brand-evergreen">
                        {threadDetail.provider?.name ?? "Provider"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {threadDetail.thread.messageCount} message
                        {threadDetail.thread.messageCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {isProviderRole && (
                    <Select
                      value={threadDetail.thread.status}
                      onValueChange={(val) =>
                        updateStatusMutation.mutate({ threadId: threadDetail.thread.id, status: val })
                      }
                    >
                      <SelectTrigger className="w-36 text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">
                          <div className="flex items-center gap-2">
                            <Circle className="h-3 w-3 text-blue-500" /> Open
                          </div>
                        </SelectItem>
                        <SelectItem value="enrolled">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-green-500" /> Enrolled
                          </div>
                        </SelectItem>
                        <SelectItem value="not_a_fit">
                          <div className="flex items-center gap-2">
                            <UserX className="h-3 w-3 text-gray-400" /> Not a Fit
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {threadDetail.messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">No messages yet</div>
                  ) : (
                    threadDetail.messages.map((msg) => {
                      const isMine = msg.senderUserId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                              isMine
                                ? "bg-action-teal text-white rounded-br-sm"
                                : "bg-gray-100 text-gray-800 rounded-bl-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isMine ? "text-white/70 text-right" : "text-gray-400"
                              }`}
                            >
                              {formatRelative(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* AI draft reply (provider review — never auto-sent) */}
                {isProviderRole && aiEnabled && lastIsFromParent && !currentDraft && generateDraftMutation.isPending && (
                  <div className="border-t px-4 py-3 flex items-center gap-2 text-sm text-purple-600 bg-purple-50/60">
                    <div className="animate-spin w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full" />
                    Drafting a suggested reply…
                  </div>
                )}
                {currentDraft && (
                  <div className="border-t bg-purple-50/60 px-4 py-3" data-testid="card-ai-draft">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 gap-1">
                        <Sparkles className="h-3 w-3" /> Draft by AI
                      </Badge>
                      <span className="text-xs text-gray-500">Review before sending — edit or discard</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words mb-2">
                      {currentDraft}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-purple-700 border-purple-300 hover:bg-purple-100"
                        data-testid="button-use-ai-draft"
                        onClick={() => setReplyText(currentDraft)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" /> Use &amp; edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-500"
                        data-testid="button-discard-ai-draft"
                        disabled={discardDraftMutation.isPending}
                        onClick={() => selectedThreadId && discardDraftMutation.mutate(selectedThreadId)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Discard
                      </Button>
                    </div>
                  </div>
                )}

                {/* Reply composer */}
                <div className="border-t p-3 flex gap-2 items-end">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a message..."
                    rows={2}
                    className="flex-1 resize-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
                    }}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!replyText.trim() || sendReplyMutation.isPending}
                    className="bg-action-clay hover:bg-action-clay/90 flex-shrink-0"
                  >
                    {sendReplyMutation.isPending ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                Conversation not found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
