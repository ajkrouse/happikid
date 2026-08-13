import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";

interface EnrollmentToggleCardProps {
  provider: any;
}

const STATUS_OPTIONS = [
  {
    value: "accepting",
    label: "Accepting",
    description: "Open spots available",
    activeClass: "bg-green-600 hover:bg-green-700 text-white border-green-600",
    inactiveClass: "bg-white hover:bg-green-50 text-green-700 border-green-200",
  },
  {
    value: "waitlist",
    label: "Waitlist",
    description: "Taking waitlist sign-ups",
    activeClass: "bg-amber-500 hover:bg-amber-600 text-white border-amber-500",
    inactiveClass: "bg-white hover:bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    value: "full",
    label: "Full",
    description: "No spots available",
    activeClass: "bg-red-600 hover:bg-red-700 text-white border-red-600",
    inactiveClass: "bg-white hover:bg-red-50 text-red-700 border-red-200",
  },
] as const;

export function EnrollmentToggleCard({ provider }: EnrollmentToggleCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentStatus: string = provider?.enrollmentStatus ?? "accepting";

  const mutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PATCH", `/api/providers/${provider.id}`, {
        enrollmentStatus: status,
      });
      return res.json();
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers/mine"] });
      const opt = STATUS_OPTIONS.find((o) => o.value === status);
      toast({
        title: "Enrollment status updated",
        description: `Your listing now shows "${opt?.label}".`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to update status",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-evergreen" />
          Enrollment Status
        </CardTitle>
        <CardDescription>
          Shown as a badge on your listing so families know instantly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const isActive = currentStatus === opt.value;
            return (
              <Button
                key={opt.value}
                variant="outline"
                size="sm"
                disabled={mutation.isPending}
                onClick={() => {
                  if (!isActive) mutation.mutate(opt.value);
                }}
                className={`flex-1 border font-medium transition-colors ${
                  isActive ? opt.activeClass : opt.inactiveClass
                }`}
                title={opt.description}
              >
                {opt.label}
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {STATUS_OPTIONS.find((o) => o.value === currentStatus)?.description ?? ""}
        </p>
      </CardContent>
    </Card>
  );
}
