import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Zap, 
  Star, 
  Shield, 
  Crown, 
  Heart, 
  TrendingUp 
} from "lucide-react";

export type BadgeType = 
  | "top_rated" 
  | "quick_responder" 
  | "rising_star" 
  | "verified" 
  | "premium" 
  | "complete_profile" 
  | "parent_favorite";

interface ProviderBadgeProps {
  type: BadgeType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const badgeConfig: Record<BadgeType, {
  label: string;
  icon: typeof CheckCircle2;
  className: string;
  description: string;
}> = {
  top_rated: {
    label: "Top Rated",
    icon: Star,
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    description: "4.5+ stars with 10+ reviews"
  },
  quick_responder: {
    label: "Quick Responder",
    icon: Zap,
    className: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Responds to inquiries within 24 hours"
  },
  rising_star: {
    label: "Rising Star",
    icon: TrendingUp,
    className: "bg-purple-50 text-purple-700 border-purple-200",
    description: "New provider with excellent ratings"
  },
  verified: {
    label: "Government Verified",
    icon: Shield,
    className: "bg-mint/10 text-mint border-mint/20",
    description: "Verified by state licensing authority"
  },
  premium: {
    label: "Premium",
    icon: Crown,
    className: "bg-primary/10 text-primary border-primary/20",
    description: "Premium membership with enhanced features"
  },
  complete_profile: {
    label: "Complete Profile",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700 border-green-200",
    description: "90+ optimization score"
  },
  parent_favorite: {
    label: "Parent Favorite",
    icon: Heart,
    className: "bg-coral/10 text-coral border-coral/20",
    description: "Favorited by 20+ parents"
  }
};

export function ProviderBadge({ type, size = "md", showLabel = true }: ProviderBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4"
  };

  return (
    <Badge 
      variant="outline"
      className={`${config.className} ${sizeClasses[size]} font-medium`}
      title={config.description}
      data-testid={`badge-${type}`}
    >
      <Icon className={`${iconSizes[size]} ${showLabel ? 'mr-1' : ''}`} />
      {showLabel && config.label}
    </Badge>
  );
}

interface ProviderBadgeListProps {
  badges: BadgeType[];
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ProviderBadgeList({ 
  badges, 
  maxDisplay = 3, 
  size = "md",
  showLabel = true 
}: ProviderBadgeListProps) {
  const displayBadges = badges.slice(0, maxDisplay);
  const remaining = Math.max(0, badges.length - maxDisplay);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {displayBadges.map((badge) => (
        <ProviderBadge 
          key={badge} 
          type={badge} 
          size={size}
          showLabel={showLabel}
        />
      ))}
      {remaining > 0 && (
        <Badge 
          variant="outline" 
          className={`bg-gray-50 text-gray-600 border-brand-evergreen/10 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
        >
          +{remaining} more
        </Badge>
      )}
    </div>
  );
}
