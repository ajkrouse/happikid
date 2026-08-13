import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, Pencil, X, Save } from "lucide-react";

interface PricingEditCardProps {
  provider: {
    id: number;
    monthlyPrice?: string | number | null;
    monthlyPriceMin?: string | number | null;
    monthlyPriceMax?: string | number | null;
    showExactPrice?: boolean | null;
  };
}

export function PricingEditCard({ provider }: PricingEditCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  // Determine initial pricing type from existing data
  const hasRange = !!provider.monthlyPriceMin;
  const [pricingType, setPricingType] = useState<"fixed" | "range">(hasRange ? "range" : "fixed");
  const [monthlyPrice, setMonthlyPrice] = useState(String(provider.monthlyPrice ?? ""));
  const [monthlyPriceMin, setMonthlyPriceMin] = useState(String(provider.monthlyPriceMin ?? ""));
  const [monthlyPriceMax, setMonthlyPriceMax] = useState(String(provider.monthlyPriceMax ?? ""));
  const [showExactPrice, setShowExactPrice] = useState(provider.showExactPrice !== false);

  const patchMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/providers/${provider.id}`, payload);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to update pricing");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Pricing updated!", description: "Your new pricing is now live on your profile." });
      queryClient.invalidateQueries({ queryKey: ["/api/providers/mine"] });
      setEditing(false);
    },
    onError: (error: any) => {
      toast({ title: "Could not save pricing", description: error.message, variant: "destructive" });
    },
  });

  function handleSave() {
    if (pricingType === "fixed") {
      const price = parseFloat(monthlyPrice);
      if (!monthlyPrice || isNaN(price) || price < 0) {
        toast({ title: "Invalid price", description: "Please enter a valid monthly price.", variant: "destructive" });
        return;
      }
      patchMutation.mutate({
        monthlyPrice: monthlyPrice,
        monthlyPriceMin: null,
        monthlyPriceMax: null,
        showExactPrice,
      });
    } else {
      const min = parseFloat(monthlyPriceMin);
      const max = parseFloat(monthlyPriceMax);
      if (!monthlyPriceMin || isNaN(min) || min < 0) {
        toast({ title: "Invalid minimum price", description: "Please enter a valid minimum.", variant: "destructive" });
        return;
      }
      if (!monthlyPriceMax || isNaN(max) || max < 0) {
        toast({ title: "Invalid maximum price", description: "Please enter a valid maximum.", variant: "destructive" });
        return;
      }
      if (max < min) {
        toast({ title: "Invalid range", description: "Maximum price must be greater than or equal to the minimum.", variant: "destructive" });
        return;
      }
      patchMutation.mutate({
        monthlyPrice: monthlyPriceMin, // keep base price in sync with min
        monthlyPriceMin: monthlyPriceMin,
        monthlyPriceMax: monthlyPriceMax,
        showExactPrice,
      });
    }
  }

  function handleCancel() {
    // Reset to current provider values
    const currentHasRange = !!provider.monthlyPriceMin;
    setPricingType(currentHasRange ? "range" : "fixed");
    setMonthlyPrice(String(provider.monthlyPrice ?? ""));
    setMonthlyPriceMin(String(provider.monthlyPriceMin ?? ""));
    setMonthlyPriceMax(String(provider.monthlyPriceMax ?? ""));
    setShowExactPrice(provider.showExactPrice !== false);
    setEditing(false);
  }

  // Display helpers
  function formatPrice(val?: string | number | null) {
    if (val == null || val === "") return null;
    const n = Number(val);
    return isNaN(n) ? null : `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  const displayPrice = (() => {
    const min = formatPrice(provider.monthlyPriceMin);
    const max = formatPrice(provider.monthlyPriceMax);
    const fixed = formatPrice(provider.monthlyPrice);
    if (min && max) return `${min} – ${max}/mo`;
    if (fixed) return `${fixed}/mo`;
    return "Not set";
  })();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-brand-evergreen" />
            <CardTitle className="text-lg">Pricing</CardTitle>
          </div>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-8 px-2">
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
        </div>
        <CardDescription>Monthly tuition shown to families on your profile</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!editing ? (
          /* Read-only display */
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-brand-evergreen">{displayPrice}</span>
            {provider.showExactPrice === false && (
              <Badge variant="secondary" className="text-xs">Hidden exact amount</Badge>
            )}
            {provider.monthlyPriceMin && (
              <Badge variant="outline" className="text-xs">Range</Badge>
            )}
          </div>
        ) : (
          /* Edit form */
          <div className="space-y-4">
            {/* Pricing type selector */}
            <div className="space-y-1.5">
              <Label>Pricing Type</Label>
              <Select
                value={pricingType}
                onValueChange={(v) => setPricingType(v as "fixed" | "range")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="range">Price Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {pricingType === "fixed" ? (
              <div className="space-y-1.5">
                <Label htmlFor="pec-monthly-price">Monthly Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="pec-monthly-price"
                    type="number"
                    min="0"
                    step="1"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    placeholder="1200"
                    className="pl-7"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pec-price-min">Minimum / month</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <Input
                      id="pec-price-min"
                      type="number"
                      min="0"
                      step="1"
                      value={monthlyPriceMin}
                      onChange={(e) => setMonthlyPriceMin(e.target.value)}
                      placeholder="1000"
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pec-price-max">Maximum / month</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <Input
                      id="pec-price-max"
                      type="number"
                      min="0"
                      step="1"
                      value={monthlyPriceMax}
                      onChange={(e) => setMonthlyPriceMax(e.target.value)}
                      placeholder="1500"
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Show exact price toggle */}
            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id="pec-show-exact"
                checked={showExactPrice}
                onCheckedChange={(checked) => setShowExactPrice(checked !== false)}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="pec-show-exact" className="text-sm cursor-pointer">
                  Show exact price on my profile
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  If unchecked, only the cost level ($$) is shown — not the dollar amount.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={patchMutation.isPending}
                className="gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                {patchMutation.isPending ? "Saving…" : "Save Pricing"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={patchMutation.isPending}
                className="gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
