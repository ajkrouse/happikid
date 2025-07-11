import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProviderSchema, insertReviewSchema, insertInquirySchema } from "@shared/schema";
import { z } from "zod";

// Sample data function for testing
async function addSampleData() {
  try {
    // Check if we already have providers
    const existingProviders = await storage.getProviders({ limit: 1 });
    if (existingProviders.length > 0) {
      return; // Sample data already exists
    }

    // Add sample providers based on real childcare facilities across the tri-state area
    const sampleProviders = [
      // Northern New Jersey Providers
      {
        userId: null,
        name: "Apple Tree Child Development Center",
        description: "Premier childcare center in Wyckoff serving ages 6 weeks to 6 years, including state-certified kindergarten. Programs focus on cognitive, social, emotional, and physical development with specialized music, gymnastics, art, and cooking classes.",
        address: "435 Wyckoff Avenue",
        borough: "Bergen County",
        city: "Wyckoff",
        state: "NJ",
        zipCode: "07481",
        phone: "(201) 891-7676",
        email: "info@appletreecdc.com",
        website: "appletreecdc.com",
        type: "daycare" as const,
        ageRangeMin: 6,
        ageRangeMax: 72,
        capacity: 140,
        hoursOpen: "07:00",
        hoursClose: "18:00",
        monthlyPrice: "1950",
        features: ["State-certified kindergarten", "Gymnastics", "Music classes", "Art studio", "Cooking classes"],
        rating: 4.7,
        reviewCount: 94,
      },
      {
        userId: null,
        name: "KinderCare Learning Centers - Paramus",
        description: "National childcare provider with research-based curriculum and experienced teachers. We offer full-time and part-time programs for infants through school-age children in a safe, nurturing environment.",
        address: "240 Route 17 South",
        borough: "Bergen County",
        city: "Paramus",
        state: "NJ",
        zipCode: "07652",
        phone: "(201) 262-7890",
        email: "paramus@kindercare.com",
        website: "kindercare.com",
        type: "daycare" as const,
        ageRangeMin: 6,
        ageRangeMax: 144,
        capacity: 160,
        hoursOpen: "06:30",
        hoursClose: "18:30",
        monthlyPrice: "1850",
        features: ["Infant care", "STEM programs", "Language development", "School readiness", "Outdoor playground"],
        rating: 4.5,
        reviewCount: 112,
      },
      {
        userId: null,
        name: "YWCA Northern New Jersey - Mahwah",
        description: "Community-based childcare offering before/after school care and summer camp programs. We provide a safe, supportive environment focused on academic enrichment and social-emotional learning.",
        address: "200 Midvale Mountain Road",
        borough: "Bergen County",
        city: "Mahwah",
        state: "NJ",
        zipCode: "07430",
        phone: "(201) 444-5600",
        email: "mahwah@ywcannj.org",
        website: "ywcannj.org",
        type: "afterschool" as const,
        ageRangeMin: 60,
        ageRangeMax: 144,
        capacity: 80,
        hoursOpen: "07:00",
        hoursClose: "18:00",
        monthlyPrice: "1200",
        features: ["Before/after school care", "Summer programs", "Academic enrichment", "SEL programs", "Transportation"],
        rating: 4.6,
        reviewCount: 87,
      },
      {
        userId: null,
        name: "Creative Learning Academy - Hackensack",
        description: "Private preschool and childcare center offering innovative early childhood education. We focus on hands-on learning, creativity, and preparing children for academic success through play-based curriculum.",
        address: "85 Main Street",
        borough: "Bergen County",
        city: "Hackensack",
        state: "NJ",
        zipCode: "07601",
        phone: "(201) 487-3210",
        email: "info@creativelearningnj.com",
        website: "creativelearningnj.com",
        type: "daycare" as const,
        ageRangeMin: 12,
        ageRangeMax: 60,
        capacity: 75,
        hoursOpen: "07:30",
        hoursClose: "18:00",
        monthlyPrice: "1750",
        features: ["Play-based learning", "Creative arts", "Science exploration", "Reading readiness", "Outdoor activities"],
        rating: 4.4,
        reviewCount: 63,
      },
      {
        userId: null,
        name: "Little Scholars Academy - Fort Lee",
        description: "Bilingual English-Spanish early childhood education center serving infants through pre-K. We offer a multicultural environment with emphasis on language development and cultural awareness.",
        address: "1588 Center Avenue",
        borough: "Bergen County",
        city: "Fort Lee",
        state: "NJ",
        zipCode: "07024",
        phone: "(201) 947-5566",
        email: "info@littlescholarsfl.com",
        website: "littlescholarsfl.com",
        type: "daycare" as const,
        ageRangeMin: 6,
        ageRangeMax: 60,
        capacity: 95,
        hoursOpen: "07:00",
        hoursClose: "18:30",
        monthlyPrice: "2100",
        features: ["Bilingual education", "Cultural programs", "Language immersion", "Music and movement", "Nutritious meals"],
        rating: 4.8,
        reviewCount: 78,
      },
      
      // Westchester County Providers
      {
        userId: null,
        name: "Westchester Sunny Daycare",
        description: "Family-owned daycare with 27 years of experience serving ages 6 weeks to 12 years. Our CPR/First Aid certified staff creates a warm, home-like environment with individualized attention for each child.",
        address: "150 Mamaroneck Avenue",
        borough: "Westchester County",
        city: "White Plains",
        state: "NY",
        zipCode: "10601",
        phone: "(914) 761-8900",
        email: "info@westchestersunny.com",
        website: "westchestersunny.com",
        type: "daycare" as const,
        ageRangeMin: 6,
        ageRangeMax: 144,
        capacity: 85,
        hoursOpen: "07:00",
        hoursClose: "18:00",
        monthlyPrice: "2800",
        features: ["Extended age range", "CPR certified staff", "Home-like environment", "Individualized care", "Outdoor play"],
        rating: 4.7,
        reviewCount: 92,
      },
      {
        userId: null,
        name: "Prospect Academy - White Plains",
        description: "Multilingual Montessori-based education center for ages 3-6. We offer authentic Montessori curriculum with mixed-age classrooms and hands-on learning materials in a nurturing environment.",
        address: "75 Prospect Street",
        borough: "Westchester County",
        city: "White Plains",
        state: "NY",
        zipCode: "10606",
        phone: "(914) 428-7300",
        email: "admissions@prospectacademy.org",
        website: "prospectacademy.org",
        type: "school" as const,
        ageRangeMin: 36,
        ageRangeMax: 72,
        capacity: 60,
        hoursOpen: "08:00",
        hoursClose: "15:30",
        monthlyPrice: "3200",
        features: ["Montessori method", "Multilingual environment", "Mixed-age classrooms", "Hands-on materials", "Cultural studies"],
        rating: 4.9,
        reviewCount: 56,
      },
      {
        userId: null,
        name: "Future Stars Day Camp - Purchase",
        description: "Premier summer camp and year-round programs on 735 Anderson Hill Road. We offer 20+ specialty programs including sports, arts, technology, and outdoor adventures for all ages.",
        address: "735 Anderson Hill Road",
        borough: "Westchester County",
        city: "Purchase",
        state: "NY",
        zipCode: "10577",
        phone: "(914) 665-3200",
        email: "info@futurestarscamp.com",
        website: "fscamps.com",
        type: "camp" as const,
        ageRangeMin: 36,
        ageRangeMax: 168,
        capacity: 200,
        hoursOpen: "08:00",
        hoursClose: "16:00",
        monthlyPrice: "2400",
        features: ["20+ specialty programs", "Sports programs", "Arts and crafts", "Technology", "Transportation available"],
        rating: 4.6,
        reviewCount: 143,
      },
      {
        userId: null,
        name: "J Sports Academy - Dobbs Ferry",
        description: "Multi-sport and high-performance training academy for grades 2-10. We focus on athletic development, teamwork, and character building through comprehensive sports programs.",
        address: "49 Clinton Avenue",
        borough: "Westchester County",
        city: "Dobbs Ferry",
        state: "NY",
        zipCode: "10522",
        phone: "(914) 591-7800",
        email: "info@jsportsacademy.com",
        website: "jsportsacademy.com",
        type: "afterschool" as const,
        ageRangeMin: 84,
        ageRangeMax: 192,
        capacity: 120,
        hoursOpen: "15:00",
        hoursClose: "18:00",
        monthlyPrice: "1800",
        features: ["Multi-sport training", "High-performance coaching", "Character development", "Team building", "Fitness programs"],
        rating: 4.5,
        reviewCount: 67,
      },
      {
        userId: null,
        name: "Squire Advantage Sports Camp - Hartsdale",
        description: "Day camp at Maria Regina High School offering 50+ activities including swimming, sports, and arts for grades K-9. Extended day and transportation options available.",
        address: "1725 Central Park Avenue",
        borough: "Westchester County",
        city: "Hartsdale",
        state: "NY",
        zipCode: "10530",
        phone: "(914) 949-6768",
        email: "info@squireadvantage.com",
        website: "squireadvantage.com",
        type: "camp" as const,
        ageRangeMin: 60,
        ageRangeMax: 168,
        capacity: 180,
        hoursOpen: "08:30",
        hoursClose: "15:30",
        monthlyPrice: "2200",
        features: ["50+ activities", "Swimming pool", "Sports variety", "Arts programs", "Extended day options"],
        rating: 4.4,
        reviewCount: 89,
      },
      
      // Additional NYC Providers (Brooklyn, Queens, Bronx)
      {
        userId: null,
        name: "Montessori Day School of Brooklyn",
        description: "Established 1976, authentic Montessori education for ages 2-5 in Prospect Heights. Seven classrooms with 3 teachers each, focusing on independence, creativity, and love of learning.",
        address: "123 Prospect Place",
        borough: "Brooklyn",
        city: "Brooklyn",
        state: "NY",
        zipCode: "11238",
        phone: "(718) 857-2900",
        email: "info@montessoridayschool.org",
        website: "montessoridayschool.org",
        type: "school" as const,
        ageRangeMin: 24,
        ageRangeMax: 60,
        capacity: 105,
        hoursOpen: "08:00",
        hoursClose: "15:00",
        monthlyPrice: "2900",
        features: ["Authentic Montessori", "Mixed-age classrooms", "Three teachers per room", "Independence focus", "Creative arts"],
        rating: 4.8,
        reviewCount: 74,
      },
      {
        userId: null,
        name: "Brooklyn Preschool of Science - Park Slope",
        description: "STEM-focused preschool with living walls, animal habitats, and hands-on science exploration. We inspire young scientists through discovery-based learning and environmental awareness.",
        address: "65 Park Place",
        borough: "Brooklyn",
        city: "Brooklyn",
        state: "NY",
        zipCode: "11217",
        phone: "(718) 230-5255",
        email: "parkslope@brooklynpreschoolofscience.com",
        website: "brooklynpreschoolofscience.com",
        type: "daycare" as const,
        ageRangeMin: 18,
        ageRangeMax: 60,
        capacity: 90,
        hoursOpen: "07:30",
        hoursClose: "18:00",
        monthlyPrice: "3100",
        features: ["STEM curriculum", "Living walls", "Animal habitats", "Science exploration", "Environmental education"],
        rating: 4.7,
        reviewCount: 86,
      },
      {
        userId: null,
        name: "Green Hive - Williamsburg",
        description: "Reggio Emilia-focused preschool for ages 2-5 emphasizing project-based learning, documentation, and community connections. We view children as capable researchers and collaborators.",
        address: "215 Berry Street",
        borough: "Brooklyn",
        city: "Brooklyn",
        state: "NY",
        zipCode: "11249",
        phone: "(718) 387-5544",
        email: "info@greenhiveschool.com",
        website: "greenhiveschool.com",
        type: "daycare" as const,
        ageRangeMin: 24,
        ageRangeMax: 60,
        capacity: 65,
        hoursOpen: "08:00",
        hoursClose: "17:00",
        monthlyPrice: "2800",
        features: ["Reggio Emilia approach", "Project-based learning", "Documentation", "Community connections", "Art atelier"],
        rating: 4.6,
        reviewCount: 52,
      },
      {
        userId: null,
        name: "The Caedmon School - Upper East Side",
        description: "Authentic Montessori preschool and progressive elementary school for ages 1.8-10 years. We combine traditional Montessori with specialist classes in arts, music, and physical education.",
        address: "416 E 80th Street",
        borough: "Manhattan",
        city: "New York",
        state: "NY",
        zipCode: "10075",
        phone: "(212) 879-2296",
        email: "admissions@caedmonschool.org",
        website: "caedmonschool.org",
        type: "school" as const,
        ageRangeMin: 22,
        ageRangeMax: 120,
        capacity: 140,
        hoursOpen: "08:00",
        hoursClose: "15:30",
        monthlyPrice: "3800",
        features: ["Montessori method", "Specialist classes", "Arts integration", "Music program", "Physical education"],
        rating: 4.9,
        reviewCount: 68,
      },
      {
        userId: null,
        name: "NYC Montessori Charter School - Bronx",
        description: "First public Montessori school in NYC serving pre-K through 5th grade. We offer authentic Montessori education with diverse community and commitment to equity and excellence.",
        address: "1 Fordham Plaza",
        borough: "Bronx",
        city: "Bronx",
        state: "NY",
        zipCode: "10458",
        phone: "(718) 295-8100",
        email: "info@nycmcs.org",
        website: "nycmcs.org",
        type: "school" as const,
        ageRangeMin: 48,
        ageRangeMax: 132,
        capacity: 200,
        hoursOpen: "08:00",
        hoursClose: "15:00",
        monthlyPrice: "0",
        features: ["Public Montessori", "Diverse community", "Equity focus", "Full elementary", "Charter school"],
        rating: 4.5,
        reviewCount: 95,
      },
      {
        userId: null,
        name: "Bright Horizons at Chelsea",
        description: "Premier childcare center offering full-time care with research-based curriculum. Our experienced teachers create a warm, nurturing environment where children can learn and grow.",
        address: "300 W 23rd Street",
        borough: "Manhattan",
        city: "New York",
        state: "NY",
        zipCode: "10011",
        phone: "(347) 769-8921",
        email: "chelsea@brighthorizons.com",
        website: "brighthorizons.com",
        type: "daycare" as const,
        ageRangeMin: 6,
        ageRangeMax: 72,
        capacity: 120,
        hoursOpen: "07:00",
        hoursClose: "18:30",
        monthlyPrice: "3200",
        features: ["Research-based curriculum", "Experienced teachers", "School readiness", "Social-emotional learning", "Creative expression"],
        rating: 4.8,
        reviewCount: 127,
      },
      {
        userId: null, 
        name: "The Learning Experience - Brooklyn",
        description: "Innovative early childhood education center featuring L.E.A.P. curriculum and state-of-the-art facilities. We provide a safe, loving environment where children develop confidence and school readiness skills.",
        address: "412 Kings Highway",
        borough: "Brooklyn",
        city: "Brooklyn",
        state: "NY",
        zipCode: "11223",
        phone: "(718) 627-7340",
        email: "brooklyn@thelearningexperience.com",
        website: "thelearningexperience.com",
        type: "daycare" as const,
        ageRangeMin: 6,
        ageRangeMax: 60,
        capacity: 90,
        hoursOpen: "06:30",
        hoursClose: "18:30",
        monthlyPrice: "2700",
        features: ["L.E.A.P. curriculum", "Interactive whiteboards", "Coding for kids", "Yoga classes", "Art studio"],
        rating: 4.6,
        reviewCount: 89,
      },
      {
        userId: null,
        name: "Park Slope Schoolhouse",
        description: "Non-profit early childhood center for ages 1-4 in Park Slope. We offer play-based learning in a nurturing environment with emphasis on social-emotional development and creative expression.",
        address: "295 6th Avenue",
        borough: "Brooklyn",
        city: "Brooklyn",
        state: "NY",
        zipCode: "11215",
        phone: "(718) 788-5580",
        email: "info@parkslopeschoolhouse.org",
        website: "parkslopeschoolhouse.org",
        type: "daycare" as const,
        ageRangeMin: 12,
        ageRangeMax: 48,
        capacity: 70,
        hoursOpen: "08:00",
        hoursClose: "17:00",
        monthlyPrice: "2600",
        features: ["Play-based learning", "Social-emotional focus", "Creative expression", "Non-profit", "Community oriented"],
        rating: 4.5,
        reviewCount: 73,
      },
      {
        userId: null,
        name: "Williamsburg Neighborhood Nursery School",
        description: "Play-based preschool with no commercial branding focus. We emphasize hands-on learning, creativity, and building strong foundations for lifelong learning in a warm, supportive environment.",
        address: "54 South Second Street",
        borough: "Brooklyn",
        city: "Brooklyn",
        state: "NY",
        zipCode: "11249",
        phone: "(718) 384-5520",
        email: "info@wnns.org",
        website: "wnns.org",
        type: "daycare" as const,
        ageRangeMin: 24,
        ageRangeMax: 60,
        capacity: 55,
        hoursOpen: "08:30",
        hoursClose: "15:30",
        monthlyPrice: "2400",
        features: ["Play-based curriculum", "No commercial branding", "Hands-on learning", "Creative focus", "Community values"],
        rating: 4.7,
        reviewCount: 41,
      },
      {
        userId: null,
        name: "Morningside Montessori School",
        description: "Upper West Side Montessori school combining traditional Montessori with contemporary research-based approaches. We create an environment where children develop independence, creativity, and love of learning.",
        address: "251 W 100th Street",
        borough: "Manhattan",
        city: "New York",
        state: "NY",
        zipCode: "10025",
        phone: "(212) 864-2734",
        email: "info@morningsidemontessori.org",
        website: "morningsidemontessori.org",
        type: "school" as const,
        ageRangeMin: 30,
        ageRangeMax: 84,
        capacity: 85,
        hoursOpen: "08:00",
        hoursClose: "15:30",
        monthlyPrice: "3400",
        features: ["Montessori method", "Research-based approach", "Independence focus", "Creative learning", "Mixed-age groups"],
        rating: 4.8,
        reviewCount: 62,
      },
      {
        userId: null,
        name: "The Montessori Schools - SoHo",
        description: "Authentic Montessori nursery school for ages 18 months to 6 years in SoHo. We provide prepared environments where children learn through self-directed activity and collaborative play.",
        address: "155 Spring Street",
        borough: "Manhattan",
        city: "New York",
        state: "NY",
        zipCode: "10012",
        phone: "(212) 226-3800",
        email: "soho@themontessorischools.org",
        website: "themontessorischools.org",
        type: "school" as const,
        ageRangeMin: 18,
        ageRangeMax: 72,
        capacity: 95,
        hoursOpen: "08:00",
        hoursClose: "15:00",
        monthlyPrice: "3600",
        features: ["Authentic Montessori", "Prepared environments", "Self-directed learning", "Collaborative play", "Mixed-age classrooms"],
        rating: 4.9,
        reviewCount: 84,
      },
      {
        userId: null,
        name: "Guidepost Montessori - Brooklyn Heights",
        description: "Montessori school serving ages 2.8-12 years with Children's House (2.8-6) and Elementary (6-12) programs. We foster independence, critical thinking, and collaborative learning.",
        address: "85 Livingston Street",
        borough: "Brooklyn",
        city: "Brooklyn",
        state: "NY",
        zipCode: "11201",
        phone: "(718) 858-6100",
        email: "brooklynheights@guidepostmontessori.com",
        website: "guidepostmontessori.com",
        type: "school" as const,
        ageRangeMin: 34,
        ageRangeMax: 144,
        capacity: 120,
        hoursOpen: "08:00",
        hoursClose: "15:30",
        monthlyPrice: "3300",
        features: ["Montessori method", "Children's House", "Elementary program", "Critical thinking", "Collaborative learning"],
        rating: 4.6,
        reviewCount: 77,
      },
      {
        userId: null,
        name: "Imagine Early Learning Center - Dumbo",
        description: "Modern early learning center in Dumbo with play-based curriculum and STEAM programs. We create engaging environments where children explore, discover, and build confidence.",
        address: "30 Main Street",
        borough: "Brooklyn",
        city: "Brooklyn",
        state: "NY",
        zipCode: "11201",
        phone: "(718) 522-3456",
        email: "dumbo@imagineearlycenter.com",
        website: "imagineearlycenter.com",
        type: "daycare" as const,
        ageRangeMin: 6,
        ageRangeMax: 60,
        capacity: 110,
        hoursOpen: "07:30",
        hoursClose: "18:00",
        monthlyPrice: "3000",
        features: ["Play-based curriculum", "STEAM programs", "Modern facilities", "Exploration focus", "Confidence building"],
        rating: 4.7,
        reviewCount: 98,
      },
      {
        userId: null,
        name: "Global School Brooklyn",
        description: "Bilingual English-German education center combining Montessori with international curriculum. We offer immersive language learning and cultural exchange in a diverse, inclusive environment.",
        address: "456 Court Street",
        borough: "Brooklyn",
        city: "Brooklyn",
        state: "NY",
        zipCode: "11231",
        phone: "(718) 855-7890",
        email: "info@globalschoolbrooklyn.org",
        website: "globalschoolbrooklyn.org",
        type: "school" as const,
        ageRangeMin: 36,
        ageRangeMax: 132,
        capacity: 75,
        hoursOpen: "08:00",
        hoursClose: "15:00",
        monthlyPrice: "3500",
        features: ["Bilingual education", "German immersion", "International curriculum", "Cultural exchange", "Montessori approach"],
        rating: 4.8,
        reviewCount: 55,
      },
      {
        userId: null,
        name: "SummerTech Camp - Purchase College",
        description: "Technology-focused summer camp at Purchase College SUNY. We offer coding, robotics, and geek culture programs for tech-savvy kids and teens interested in STEM careers.",
        address: "735 Anderson Hill Road",
        borough: "Westchester County",
        city: "Purchase",
        state: "NY",
        zipCode: "10577",
        phone: "(914) 251-7800",
        email: "info@summertech.com",
        website: "summertech.com",
        type: "camp" as const,
        ageRangeMin: 84,
        ageRangeMax: 204,
        capacity: 150,
        hoursOpen: "09:00",
        hoursClose: "16:00",
        monthlyPrice: "2800",
        features: ["Technology focus", "Coding programs", "Robotics", "STEM careers", "Geek culture"],
        rating: 4.5,
        reviewCount: 67,
      }
    ];

    // Insert sample providers
    for (const provider of sampleProviders) {
      await storage.createProvider(provider);
    }

    console.log("Sample data added successfully");
  } catch (error) {
    console.error("Error adding sample data:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Add sample data for testing
  await addSampleData();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Provider routes
  app.get('/api/providers', async (req, res) => {
    try {
      const {
        type,
        borough,
        ageRange,
        ageRangeMin,
        ageRangeMax,
        features,
        search,
        limit = 20,
        offset = 0
      } = req.query;

      // Convert age group strings to numeric ranges (in months)
      let convertedAgeRangeMin = ageRangeMin ? parseInt(ageRangeMin as string) : undefined;
      let convertedAgeRangeMax = ageRangeMax ? parseInt(ageRangeMax as string) : undefined;

      if (ageRange) {
        const ageGroupMap: { [key: string]: [number, number] } = {
          'infants': [0, 12],      // 0-12 months
          'toddlers': [12, 36],    // 1-3 years
          'preschool': [36, 60],   // 3-5 years
          'school-age': [60, 180]  // 5+ years
        };
        
        const ageGroup = ageGroupMap[ageRange as string];
        if (ageGroup) {
          convertedAgeRangeMin = ageGroup[0];
          convertedAgeRangeMax = ageGroup[1];
        }
      }

      const filters = {
        type: type as string,
        borough: borough as string,
        ageRangeMin: convertedAgeRangeMin,
        ageRangeMax: convertedAgeRangeMax,
        features: features ? (features as string).split(',') : undefined,
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      // Debug logging
      console.log('Provider filters received:', {
        type: filters.type,
        borough: filters.borough,
        ageRangeMin: filters.ageRangeMin,
        ageRangeMax: filters.ageRangeMax,
        features: filters.features,
        search: filters.search,
        originalAgeRange: ageRange
      });

      const providers = await storage.getProviders(filters);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  // Provider-specific routes (must be before /:id route)
  app.get('/api/providers/mine', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const providers = await storage.getProvidersByUserId(userId);
      
      if (providers.length === 0) {
        return res.status(404).json({ message: "No provider profile found" });
      }
      
      // Return the first provider (assuming one provider per user for now)
      res.json(providers[0]);
    } catch (error) {
      console.error("Error fetching user provider:", error);
      res.status(500).json({ message: "Failed to fetch provider" });
    }
  });

  app.get('/api/providers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid provider ID" });
      }
      
      const provider = await storage.getProviderWithDetails(id);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      res.json(provider);
    } catch (error) {
      console.error("Error fetching provider:", error);
      res.status(500).json({ message: "Failed to fetch provider" });
    }
  });

  app.post('/api/providers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { locations, ...providerData } = req.body;
      
      // Check if provider already exists for this user
      const existingProviders = await storage.getProvidersByUserId(userId);
      
      if (existingProviders.length > 0) {
        // Update existing provider with partial data
        const providerId = existingProviders[0].id;
        const updateData = insertProviderSchema.partial().parse({ ...providerData, userId });
        
        const updatedProvider = await storage.updateProvider(providerId, updateData);
        
        // Handle locations separately
        if (locations && locations.length > 0) {
          // Get primary location to update main provider record
          const primaryLocation = locations.find(loc => loc.isPrimary) || locations[0];
          if (primaryLocation) {
            await storage.updateProvider(providerId, {
              address: primaryLocation.address,
              borough: primaryLocation.borough,
              city: primaryLocation.city,
              state: primaryLocation.state,
              zipCode: primaryLocation.zipCode,
              phone: primaryLocation.phone,
              capacity: primaryLocation.capacity ? parseInt(primaryLocation.capacity) : undefined
            });
          }
          
          // Save all locations as separate records
          for (const location of locations) {
            await storage.addProviderLocation({
              providerId: providerId,
              name: location.name,
              address: location.address,
              borough: location.borough,
              city: location.city,
              state: location.state,
              zipCode: location.zipCode,
              phone: location.phone,
              capacity: location.capacity ? parseInt(location.capacity) : null,
              isPrimary: location.isPrimary
            });
          }
        }
        
        res.json(updatedProvider);
      } else {
        // Create new provider with default values for required fields
        const baseProviderData = {
          ...providerData,
          userId,
          // Provide defaults for required database fields
          type: providerData.type || "daycare",
          ageRangeMin: parseInt(providerData.ageRangeMin) || 0,
          ageRangeMax: parseInt(providerData.ageRangeMax) || 120,
          monthlyPrice: providerData.monthlyPrice ? parseFloat(providerData.monthlyPrice) : 0,
          monthlyPriceMin: providerData.monthlyPriceMin ? parseFloat(providerData.monthlyPriceMin) : null,
          monthlyPriceMax: providerData.monthlyPriceMax ? parseFloat(providerData.monthlyPriceMax) : null,
          borough: providerData.borough || "",
        };
        
        // Use primary location for main provider address
        if (locations && locations.length > 0) {
          const primaryLocation = locations.find(loc => loc.isPrimary) || locations[0];
          if (primaryLocation) {
            baseProviderData.address = primaryLocation.address;
            baseProviderData.borough = primaryLocation.borough;
            baseProviderData.city = primaryLocation.city;
            baseProviderData.state = primaryLocation.state;
            baseProviderData.zipCode = primaryLocation.zipCode;
            baseProviderData.phone = primaryLocation.phone;
            baseProviderData.capacity = primaryLocation.capacity ? parseInt(primaryLocation.capacity) : undefined;
          }
        }
        
        const validatedData = insertProviderSchema.parse(baseProviderData);
        const provider = await storage.createProvider(validatedData);
        
        // Save locations as separate records
        if (locations && locations.length > 0) {
          for (const location of locations) {
            await storage.addProviderLocation({
              providerId: provider.id,
              name: location.name,
              address: location.address,
              borough: location.borough,
              city: location.city,
              state: location.state,
              zipCode: location.zipCode,
              phone: location.phone,
              capacity: location.capacity ? parseInt(location.capacity) : null,
              isPrimary: location.isPrimary
            });
          }
        }
        
        res.status(201).json(provider);
      }
    } catch (error) {
      console.error("Error creating/updating provider:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid provider data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create/update provider" });
    }
  });

  app.put('/api/providers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if user owns this provider
      const existingProvider = await storage.getProvider(id);
      if (!existingProvider || existingProvider.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData = insertProviderSchema.partial().parse(req.body);
      const provider = await storage.updateProvider(id, updateData);
      res.json(provider);
    } catch (error) {
      console.error("Error updating provider:", error);
      res.status(500).json({ message: "Failed to update provider" });
    }
  });

  app.get('/api/providers/user/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const requestedUserId = req.params.userId;
      const currentUserId = req.user.claims.sub;
      
      // Users can only access their own providers
      if (requestedUserId !== currentUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const providers = await storage.getProvidersByUserId(requestedUserId);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching user providers:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  // Review routes
  app.get('/api/providers/:id/reviews', async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const reviews = await storage.getReviewsByProviderId(providerId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/providers/:id/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        providerId,
        userId,
      });

      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Favorites routes
  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getFavoritesByUserId(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post('/api/favorites/:providerId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const providerId = parseInt(req.params.providerId);
      
      const favorite = await storage.addFavorite(userId, providerId);
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete('/api/favorites/:providerId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const providerId = parseInt(req.params.providerId);
      
      await storage.removeFavorite(userId, providerId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get('/api/favorites/:providerId/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const providerId = parseInt(req.params.providerId);
      
      const isFavorite = await storage.isFavorite(userId, providerId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking favorite:", error);
      res.status(500).json({ message: "Failed to check favorite" });
    }
  });

  // Inquiry routes
  app.get('/api/inquiries/provider/:providerId', isAuthenticated, async (req: any, res) => {
    try {
      const providerId = parseInt(req.params.providerId);
      const userId = req.user.claims.sub;
      
      // Check if user owns this provider
      const provider = await storage.getProvider(providerId);
      if (!provider || provider.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const inquiries = await storage.getInquiriesByProviderId(providerId);
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.get('/api/inquiries/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const inquiries = await storage.getInquiriesByUserId(userId);
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching user inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.post('/api/inquiries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const inquiryData = insertInquirySchema.parse({
        ...req.body,
        userId,
      });

      const inquiry = await storage.createInquiry(inquiryData);
      res.status(201).json(inquiry);
    } catch (error) {
      console.error("Error creating inquiry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  app.patch('/api/inquiries/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["pending", "responded", "closed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const inquiry = await storage.updateInquiryStatus(inquiryId, status);
      res.json(inquiry);
    } catch (error) {
      console.error("Error updating inquiry status:", error);
      res.status(500).json({ message: "Failed to update inquiry status" });
    }
  });





  app.patch('/api/providers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if user owns this provider
      const existingProvider = await storage.getProvider(id);
      if (!existingProvider || existingProvider.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData = insertProviderSchema.partial().parse(req.body);
      const provider = await storage.updateProvider(id, updateData);
      res.json(provider);
    } catch (error) {
      console.error("Error updating provider:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid provider data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update provider" });
    }
  });

  // Provider inquiries route
  app.get('/api/inquiries/provider', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get the provider owned by this user
      const providers = await storage.getProvidersByUserId(userId);
      if (providers.length === 0) {
        return res.json([]);
      }
      
      const providerId = providers[0].id;
      const inquiries = await storage.getInquiriesByProviderId(providerId);
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching provider inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // License confirmation route
  app.post('/api/providers/confirm-license', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const providers = await storage.getProvidersByUserId(userId);
      
      if (!providers || providers.length === 0) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      const provider = providers[0];
      
      // In a real system, this would trigger a verification process
      // For now, we'll simulate the confirmation
      const updatedProvider = await storage.updateProvider(provider.id, {
        licenseStatus: "confirmed",
        licenseConfirmedAt: new Date(),
        isProfileVisible: true
      });
      
      res.json({ 
        message: "License confirmation request submitted successfully",
        provider: updatedProvider,
        isConfirmed: true
      });
    } catch (error) {
      console.error("Error confirming license:", error);
      res.status(500).json({ message: "Failed to confirm license" });
    }
  });

  // Provider images routes
  app.get('/api/providers/:id/images', async (req: any, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const images = await storage.getProviderImages(providerId);
      res.json(images);
    } catch (error) {
      console.error("Error fetching provider images:", error);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  app.post('/api/providers/:id/images', isAuthenticated, async (req: any, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if user owns this provider
      const provider = await storage.getProvider(providerId);
      if (!provider || provider.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { imageUrl, caption, isPrimary = false } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required" });
      }

      // If this is set as primary, unset any existing primary images
      if (isPrimary) {
        const existingImages = await storage.getProviderImages(providerId);
        for (const img of existingImages) {
          if (img.isPrimary) {
            // We would need to add an update method for this, for now just create new
          }
        }
      }

      const imageData = {
        providerId,
        imageUrl,
        caption: caption || null,
        isPrimary: Boolean(isPrimary)
      };

      const newImage = await storage.addProviderImage(imageData);
      res.status(201).json(newImage);
    } catch (error) {
      console.error("Error adding provider image:", error);
      res.status(500).json({ message: "Failed to add image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
