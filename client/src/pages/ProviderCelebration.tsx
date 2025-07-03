import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles, Users, TrendingUp, Star, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Confetti animation component
const Confetti = () => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    velocity: { x: number; y: number };
  }>>([]);

  useEffect(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF69B4', '#00FF7F', '#FF4500', '#BA55D3'];
    
    // Create multiple waves of confetti
    const createConfettiWave = (delay = 0) => {
      setTimeout(() => {
        const newParticles = Array.from({ length: 150 }, (_, i) => ({
          id: Date.now() + i,
          x: Math.random() * window.innerWidth,
          y: -Math.random() * 100 - 10,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          velocity: {
            x: (Math.random() - 0.5) * 6,
            y: Math.random() * 4 + 3
          }
        }));
        
        setParticles(prev => [...prev, ...newParticles]);
      }, delay);
    };

    // Create multiple waves
    createConfettiWave(0);
    createConfettiWave(1000);
    createConfettiWave(2000);
    createConfettiWave(3500);

    const animateParticles = () => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: particle.x + particle.velocity.x,
        y: particle.y + particle.velocity.y,
        rotation: particle.rotation + 3
      })).filter(particle => particle.y < window.innerHeight + 50));
    };

    const interval = setInterval(animateParticles, 30);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setParticles([]);
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: particle.x,
            top: particle.y,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

const SUCCESS_TIPS = [
  {
    icon: Users,
    title: "Respond quickly to inquiries",
    description: "Parents appreciate fast responses - aim for within 24 hours",
    impact: "3x more likely to book"
  },
  {
    icon: Star,
    title: "Encourage reviews from families",
    description: "Ask satisfied parents to leave reviews about their experience",
    impact: "Higher search ranking"
  },
  {
    icon: TrendingUp,
    title: "Keep your profile updated",
    description: "Regular updates show you're active and engaged",
    impact: "Better visibility"
  },
  {
    icon: Sparkles,
    title: "Add seasonal programs",
    description: "Holiday camps and seasonal activities attract more families",
    impact: "Increased bookings"
  }
];

export default function ProviderCelebration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    setLocation("/provider/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {showConfetti && <Confetti />}
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Celebration Header */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-6 shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent mb-6 animate-pulse">
              CONGRATULATIONS! 🚀🎊
            </h1>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              You're OFFICIALLY on HappiKid! 
            </h2>
            
            <p className="text-2xl text-gray-700 mb-4 font-semibold">
              Your amazing childcare program is now LIVE and ready to reach hundreds of families!
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg px-6 py-3 animate-bounce">
                🌟 PROFILE LIVE!
              </Badge>
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg px-6 py-3 animate-bounce delay-100">
                🎯 READY FOR FAMILIES!
              </Badge>
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-lg px-6 py-3 animate-bounce delay-200">
                💫 LET'S GO!
              </Badge>
            </div>
          </div>

          {/* Success Tips */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🚀 YOUR SUCCESS GAMEPLAN
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Follow these proven strategies to attract more families and grow your business!
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              {SUCCESS_TIPS.map((tip, index) => {
                const IconComponent = tip.icon;
                return (
                  <Card key={index} className="text-left hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {tip.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            {tip.description}
                          </p>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                            {tip.impact}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Next Steps */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 mb-8">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                What happens next?
              </h3>
              
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Profile Review</p>
                    <p className="text-sm text-gray-600">Our team will verify your profile within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Go Live</p>
                    <p className="text-sm text-gray-600">Your profile becomes visible to parents searching</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Connect</p>
                    <p className="text-sm text-gray-600">Start receiving inquiries from interested families</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleContinue} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-4 font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              🚀 LAUNCH MY DASHBOARD!
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-4 font-semibold border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-all transform hover:scale-105"
              onClick={() => {
                toast({
                  title: "🎉 Profile Shared!",
                  description: "Your amazing profile link is ready to share with families!",
                });
                navigator.clipboard.writeText(window.location.origin);
              }}
            >
              📢 SHARE THE EXCITEMENT!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}