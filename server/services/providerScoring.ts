/**
 * Provider Optimization Scoring Service
 * Calculates profile optimization scores for gamification
 */

import type { Provider, ProviderImage, Review, Inquiry } from "@shared/schema";

export interface ScoreBreakdown {
  completeness: {
    score: number;
    maxScore: number;
    details: {
      hasDescription: boolean;
      hasPhotos: boolean;
      hasWebsite: boolean;
      hasPhone: boolean;
      hasFeatures: boolean;
      hasSchedule: boolean;
      hasProgramHighlights: boolean;
    };
  };
  engagement: {
    score: number;
    maxScore: number;
    details: {
      hasReviews: boolean;
      averageRating: number;
      inquiryResponseRate: number;
      profileViews: number;
    };
  };
  verification: {
    score: number;
    maxScore: number;
    details: {
      isVerified: boolean;
      hasLicense: boolean;
      isGovVerified: boolean;
      isClaimed: boolean;
    };
  };
  freshness: {
    score: number;
    maxScore: number;
    details: {
      daysSinceUpdate: number;
      hasRecentActivity: boolean;
    };
  };
}

export interface OptimizationScore {
  overallScore: number;
  completenessScore: number;
  engagementScore: number;
  verificationScore: number;
  freshnessScore: number;
  breakdown: ScoreBreakdown;
  badges: string[];
  improvementSuggestions: {
    category: string;
    action: string;
    points: number;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export class ProviderScoringService {
  /**
   * Calculate the overall optimization score for a provider
   */
  static calculateScore(
    provider: Provider,
    images: ProviderImage[] = [],
    reviews: Review[] = [],
    inquiries: Inquiry[] = []
  ): OptimizationScore {
    // Weights: Completeness 40%, Engagement 30%, Verification 20%, Freshness 10%
    const completeness = this.calculateCompletenessScore(provider, images);
    const engagement = this.calculateEngagementScore(provider, reviews, inquiries);
    const verification = this.calculateVerificationScore(provider);
    const freshness = this.calculateFreshnessScore(provider);

    const overallScore = Math.round(
      completeness.score * 0.4 +
      engagement.score * 0.3 +
      verification.score * 0.2 +
      freshness.score * 0.1
    );

    const breakdown: ScoreBreakdown = {
      completeness,
      engagement,
      verification,
      freshness,
    };

    const badges = this.determineBadges(provider, reviews, overallScore);
    const improvementSuggestions = this.generateImprovementSuggestions(breakdown, provider, images);

    return {
      overallScore,
      completenessScore: completeness.score,
      engagementScore: engagement.score,
      verificationScore: verification.score,
      freshnessScore: freshness.score,
      breakdown,
      badges,
      improvementSuggestions,
    };
  }

  /**
   * Calculate completeness score (0-100) based on profile information
   */
  private static calculateCompletenessScore(
    provider: Provider,
    images: ProviderImage[]
  ): ScoreBreakdown['completeness'] {
    const checks = {
      hasDescription: !!provider.description && provider.description.length > 100,
      hasPhotos: images.length >= 3,
      hasWebsite: !!provider.website,
      hasPhone: !!provider.phone,
      hasFeatures: (provider.features?.length || 0) >= 3,
      hasSchedule: !!provider.schedule || (!!provider.hoursOpen && !!provider.hoursClose),
      hasProgramHighlights: (provider.programHighlights?.length || 0) >= 2,
    };

    const completedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    const score = Math.round((completedChecks / totalChecks) * 100);

    return {
      score,
      maxScore: 100,
      details: checks,
    };
  }

  /**
   * Calculate engagement score (0-100) based on reviews, ratings, and inquiries
   * Adjusted to be fair to new providers with perfect execution
   */
  private static calculateEngagementScore(
    provider: Provider,
    reviews: Review[],
    inquiries: Inquiry[]
  ): ScoreBreakdown['engagement'] {
    let score = 0;

    // Reviews (30 points) - More granular scale for new providers
    const reviewCount = reviews.length;
    if (reviewCount >= 10) score += 30;
    else if (reviewCount >= 5) score += 25;
    else if (reviewCount >= 3) score += 20;
    else if (reviewCount >= 1) score += 15;
    else score += 5; // New providers get baseline points

    // Average rating (35 points) - Higher weight for quality over quantity
    const rating = Number(provider.rating || 0);
    if (rating >= 4.5) score += 35;
    else if (rating >= 4.0) score += 30;
    else if (rating >= 3.5) score += 20;
    else if (rating >= 3.0) score += 10;
    else if (reviewCount === 0) score += 15; // New providers get baseline

    // Response rate (25 points) - Higher weight for responsiveness
    const respondedInquiries = inquiries.filter(i => i.status === 'responded' || i.status === 'closed').length;
    const responseRate = inquiries.length > 0 ? respondedInquiries / inquiries.length : 1;
    if (responseRate >= 0.9) score += 25;
    else if (responseRate >= 0.75) score += 20;
    else if (responseRate >= 0.5) score += 15;
    else if (inquiries.length === 0) score += 20; // New providers start with high assumed rate

    // Profile views (10 points) - Optional engagement signal
    const views = provider.profileViews || 0;
    if (views >= 100) score += 10;
    else if (views >= 50) score += 7;
    else if (views >= 10) score += 5;
    else score += 2; // New profiles get baseline

    return {
      score: Math.min(score, 100),
      maxScore: 100,
      details: {
        hasReviews: reviewCount > 0,
        averageRating: rating,
        inquiryResponseRate: responseRate,
        profileViews: views,
      },
    };
  }

  /**
   * Calculate verification score (0-100) based on verification status
   */
  private static calculateVerificationScore(
    provider: Provider
  ): ScoreBreakdown['verification'] {
    let score = 0;

    const checks = {
      isVerified: provider.isVerified || false,
      hasLicense: !!provider.licenseNumber,
      isGovVerified: provider.isVerifiedByGov || false,
      isClaimed: provider.claimStatus === 'verified',
    };

    // Government verification (50 points)
    if (checks.isGovVerified) score += 50;

    // Has license number (20 points)
    if (checks.hasLicense) score += 20;

    // Profile claimed and verified (20 points)
    if (checks.isClaimed) score += 20;

    // Basic verification (10 points)
    if (checks.isVerified) score += 10;

    return {
      score: Math.min(score, 100),
      maxScore: 100,
      details: checks,
    };
  }

  /**
   * Calculate freshness score (0-100) based on recent activity
   */
  private static calculateFreshnessScore(
    provider: Provider
  ): ScoreBreakdown['freshness'] {
    const now = new Date();
    const updatedAt = provider.updatedAt ? new Date(provider.updatedAt) : new Date(provider.createdAt || now);
    const daysSinceUpdate = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

    let score = 100;
    if (daysSinceUpdate > 180) score = 20; // 6+ months old
    else if (daysSinceUpdate > 90) score = 40; // 3-6 months
    else if (daysSinceUpdate > 30) score = 70; // 1-3 months
    else if (daysSinceUpdate > 7) score = 90; // 1-4 weeks

    return {
      score,
      maxScore: 100,
      details: {
        daysSinceUpdate,
        hasRecentActivity: daysSinceUpdate <= 30,
      },
    };
  }

  /**
   * Determine which badges the provider has earned
   */
  private static determineBadges(
    provider: Provider,
    reviews: Review[],
    overallScore: number
  ): string[] {
    const badges: string[] = [];

    // Top Rated: 4.5+ stars with 10+ reviews
    if (Number(provider.rating || 0) >= 4.5 && reviews.length >= 10) {
      badges.push('top_rated');
    }

    // Verified: Government verified
    if (provider.isVerifiedByGov) {
      badges.push('verified');
    }

    // Complete Profile: 90+ overall score
    if (overallScore >= 90) {
      badges.push('complete_profile');
    }

    // Parent Favorite: 20+ favorites
    if ((provider.favoriteAdds || 0) >= 20) {
      badges.push('parent_favorite');
    }

    // Rising Star: New provider (< 6 months) with 4+ rating
    const monthsSinceCreation = provider.createdAt
      ? (new Date().getTime() - new Date(provider.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
      : 999;
    if (monthsSinceCreation < 6 && Number(provider.rating || 0) >= 4.0) {
      badges.push('rising_star');
    }

    // Premium: Has premium features
    if (provider.isPremium) {
      badges.push('premium');
    }

    return badges;
  }

  /**
   * Generate actionable improvement suggestions
   */
  private static generateImprovementSuggestions(
    breakdown: ScoreBreakdown,
    provider: Provider,
    images: ProviderImage[]
  ): OptimizationScore['improvementSuggestions'] {
    const suggestions: OptimizationScore['improvementSuggestions'] = [];

    // Completeness suggestions
    if (!breakdown.completeness.details.hasDescription) {
      suggestions.push({
        category: 'completeness',
        action: 'Add a detailed description (100+ characters) about your program',
        points: 14,
        priority: 'high',
      });
    }
    if (!breakdown.completeness.details.hasPhotos) {
      suggestions.push({
        category: 'completeness',
        action: 'Upload at least 3 photos of your facility',
        points: 14,
        priority: 'high',
      });
    }
    if (!breakdown.completeness.details.hasFeatures) {
      suggestions.push({
        category: 'completeness',
        action: 'Add at least 3 features/amenities to your profile',
        points: 14,
        priority: 'medium',
      });
    }
    if (!breakdown.completeness.details.hasProgramHighlights) {
      suggestions.push({
        category: 'completeness',
        action: 'Add at least 2 program highlights',
        points: 14,
        priority: 'medium',
      });
    }

    // Engagement suggestions
    if (!breakdown.engagement.details.hasReviews) {
      suggestions.push({
        category: 'engagement',
        action: 'Encourage parents to leave reviews',
        points: 12,
        priority: 'high',
      });
    }
    if (breakdown.engagement.details.inquiryResponseRate < 0.75) {
      suggestions.push({
        category: 'engagement',
        action: 'Respond to inquiries within 24 hours to improve response rate',
        points: 6,
        priority: 'high',
      });
    }

    // Verification suggestions
    if (!breakdown.verification.details.hasLicense) {
      suggestions.push({
        category: 'verification',
        action: 'Add your license number to build trust',
        points: 4,
        priority: 'medium',
      });
    }
    if (!breakdown.verification.details.isClaimed) {
      suggestions.push({
        category: 'verification',
        action: 'Claim your profile to show you own this business',
        points: 4,
        priority: 'high',
      });
    }

    // Sort by priority and points
    suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.points - a.points;
    });

    return suggestions.slice(0, 5); // Top 5 suggestions
  }

  /**
   * Compare provider score to category average
   */
  static async calculateCategoryRank(
    providerId: number,
    providerType: string,
    db: any // Database instance
  ): Promise<{ rank: number; categoryAverage: number }> {
    // This would query all providers of the same type and compare scores
    // For now, return placeholder values
    return {
      rank: 0,
      categoryAverage: 65,
    };
  }
}
