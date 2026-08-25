import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [showConsent, setShowConsent] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: async ({ enabled, consent = false }: { enabled: boolean; consent?: boolean }) => {
      const res = await apiRequest("PATCH", "/api/providers/mine/ai-auto-reply", {
        enabled,
        ...(consent ? { consent: true } : {}),
      });
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

  const enabled = !!provider?.aiAutoReplyEnabled && !!provider?.aiDataProcessingConsentAt;

  return (
    <>
      <Card data-testid="card-ai-auto-reply">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Auto-Reply
          </CardTitle>
          <CardDescription>
            Get a draft reply from a redacted excerpt of the newest parent message and limited public program facts. You always review, edit, and send it yourself.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-purple-50 border border-purple-100 p-3 mb-4 text-xs text-purple-900">
            HappiKid filters common contact, address, health, family, and financial details before processing. Do not include names or sensitive information in messages; AI drafts are optional and require your review.
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="ai-auto-reply-switch" className="text-sm font-medium">
              {enabled ? "Enabled" : provider?.aiAutoReplyEnabled ? "Consent required" : "Disabled"}
            </Label>
            <Switch
              id="ai-auto-reply-switch"
              data-testid="switch-ai-auto-reply"
              checked={enabled}
              disabled={toggleMutation.isPending}
              onCheckedChange={(checked) => {
                if (checked) {
                  setConsentAccepted(false);
                  setShowConsent(true);
                } else {
                  toggleMutation.mutate({ enabled: false });
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConsent} onOpenChange={setShowConsent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable AI draft replies?</DialogTitle>
            <DialogDescription>
              HappiKid will send a minimized excerpt of the newest parent message and limited public program facts to an external AI service to create a draft. Messages containing likely names or sensitive family, health, contact, address, or financial details are withheld from AI processing.
            </DialogDescription>
          </DialogHeader>
          <label className="flex gap-3 items-start text-sm text-brand-evergreen cursor-pointer">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(event) => setConsentAccepted(event.target.checked)}
              className="mt-1 h-4 w-4"
              data-testid="checkbox-ai-data-consent"
            />
            <span>
              I understand this creates a review-only draft using an external AI service and I have permission to process these messages.
            </span>
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConsent(false)}>Cancel</Button>
            <Button
              disabled={!consentAccepted || toggleMutation.isPending}
              onClick={() => {
                toggleMutation.mutate(
                  { enabled: true, consent: true },
                  { onSuccess: () => setShowConsent(false) },
                );
              }}
              data-testid="button-confirm-ai-data-consent"
            >
              Enable review-only drafts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
