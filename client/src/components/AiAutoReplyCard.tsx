import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles } from "lucide-react";

/**
 * Dashboard settings card that lets a provider turn AI-assisted replies on/off.
 * When enabled, incoming parent messages get an AI-generated draft the provider
 * reviews, edits, and sends — nothing is ever sent automatically.
 */
export function AiAutoReplyCard({ provider }: { provider: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("PATCH", "/api/providers/mine/ai-auto-reply", { enabled });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers/mine"] });
      toast({
        title: data.aiAutoReplyEnabled ? "AI auto-reply enabled" : "AI auto-reply disabled",
        description: data.aiAutoReplyEnabled
          ? "New parent messages will get a draft reply for you to review and send."
          : "You'll write all replies yourself.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update setting",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card data-testid="card-ai-auto-reply">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Auto-Reply
        </CardTitle>
        <CardDescription>
          Get instant draft replies to parent messages, written from your profile details. You
          always review and send them yourself.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="ai-auto-reply-switch" className="text-sm font-medium">
            {provider?.aiAutoReplyEnabled ? "Enabled" : "Disabled"}
          </Label>
          <Switch
            id="ai-auto-reply-switch"
            data-testid="switch-ai-auto-reply"
            checked={!!provider?.aiAutoReplyEnabled}
            disabled={toggleMutation.isPending}
            onCheckedChange={(checked) => toggleMutation.mutate(checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
