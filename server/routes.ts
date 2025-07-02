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

    // Add sample providers based on real NYC childcare facilities
    const sampleProviders = [
      {
        userId: null,
        name: "Bright Horizons at Chelsea",
        description: "Premier childcare center offering full-time care with a research-based curriculum. Our experienced teachers create a warm, nurturing environment where children can learn and grow. We focus on school readiness, social-emotional development, and creative expression.",
        address: "300 W 23rd St",
        borough: "Manhattan",
        city: "New York",
        state: "NY",
        zipCode: "10011",
        phone: "(347) 769-8921",
        email: "chelsea@brighthorizons.com",
        website: "child-care-preschool.brighthorizons.com/ny/newyork/chelsea",
        type: "daycare" as const,
        ageRangeMin: 6,
        ageRangeMax: 72,
        capacity: 120,
        hoursOfOperation: "7:00 AM - 6:30 PM",
        pricing: "$2,800 - $3,200 per month",
        isActive: true,
        features: ["Organic meals", "Outdoor playground", "STEM programs", "Music classes", "Swimming pool"],
        latitude: 40.7430,
        longitude: -73.9970,
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
        hoursOfOperation: "6:30 AM - 6:30 PM",
        pricing: "$2,200 - $2,800 per month",
        isActive: true,
        features: ["Interactive whiteboards", "Coding for kids", "Yoga", "Language immersion", "Art studio"],
        latitude: 40.6736,
        longitude: -73.9796,
        rating: 4.6,
        reviewCount: 89,
      },
      {
        userId: null,
        name: "Little Sunshine Child Development Center",
        description: "Private daycare and early childhood education center providing 3K for All and Pre-K for All programs. We create a safe, loving environment where children develop confidence and school readiness skills.",
        address: "2171 68th Street",
        borough: "Brooklyn",
        city: "Brooklyn", 
        state: "NY",
        zipCode: "11204",
        phone: "(929) 333-9132",
        email: "littlesunshine.cd@gmail.com",
        website: "littlesunshine.com",
        type: "daycare" as const,
        ageRangeMin: 6,
        ageRangeMax: 72,
        capacity: 150,
        hoursOfOperation: "6:00 AM - 7:00 PM",
        pricing: "$1,900 - $2,500 per month",
        isActive: true,
        features: ["Reggio Emilia approach", "Indoor playground", "Healthy meals", "Music & movement", "Science lab"],
        latitude: 40.7648,
        longitude: -73.9442,
        rating: 4.7,
        reviewCount: 156,
      },
      {
        userId: null,
        name: "Bronx Academy of Science After-School",
        description: "Comprehensive after-school program focusing on STEM education and homework assistance. Our certified teachers provide individualized attention in a safe, structured environment.",
        address: "456 E 149th St",
        borough: "Bronx",
        city: "Bronx",
        state: "NY", 
        zipCode: "10455",
        phone: "(718) 555-0321",
        email: "afterschool@bronxacademy.org",
        website: "bronxacademyofscience.org",
        type: "afterschool" as const,
        ageRangeMin: 60,
        ageRangeMax: 144,
        capacity: 60,
        hoursOfOperation: "3:00 PM - 6:00 PM",
        pricing: "$800 - $1,200 per month",
        isActive: true,
        features: ["Homework help", "STEM projects", "Sports activities", "Art programs", "Field trips"],
        latitude: 40.8176,
        longitude: -73.9183,
        rating: 4.5,
        reviewCount: 72,
      },
      {
        userId: null,
        name: "Staten Island Summer Discovery Camp",
        description: "Action-packed summer camp offering outdoor adventures, arts & crafts, swimming, and team sports. Our experienced counselors create memorable experiences while keeping children active and engaged.",
        address: "789 Victory Blvd",
        borough: "Staten Island",
        city: "Staten Island",
        state: "NY",
        zipCode: "10301",
        phone: "(718) 555-0654",
        email: "info@sisummerdiscovery.com",
        website: "sisummerdiscovery.com",
        type: "camp" as const,
        ageRangeMin: 48,
        ageRangeMax: 144,
        capacity: 200,
        hoursOfOperation: "8:00 AM - 4:00 PM (Summer only)",
        pricing: "$300 - $450 per week",
        isActive: true,
        features: ["Swimming pool", "Sports courts", "Nature trails", "Arts & crafts", "Field trips"],
        latitude: 40.6278,
        longitude: -74.0776,
        rating: 4.4,
        reviewCount: 93,
      },
      {
        userId: null,
        name: "Montessori School of Manhattan",
        description: "Authentic Montessori education serving children from toddler through elementary. Our certified Montessori teachers create prepared environments that foster independence and love of learning.",
        address: "234 E 73rd St",
        borough: "Manhattan",
        city: "New York",
        state: "NY",
        zipCode: "10021",
        phone: "(212) 555-0987",
        email: "admissions@montessorimanhattan.edu",
        website: "montessorimanhattan.edu",
        type: "school" as const,
        ageRangeMin: 18,
        ageRangeMax: 72,
        capacity: 80,
        hoursOfOperation: "8:30 AM - 3:30 PM",
        pricing: "$35,000 - $42,000 per year",
        isActive: true,
        features: ["Montessori method", "Mixed-age classrooms", "Outdoor learning", "Foreign language", "Music program"],
        latitude: 40.7708,
        longitude: -73.9635,
        rating: 4.9,
        reviewCount: 68,
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
        ageRangeMin,
        ageRangeMax,
        features,
        search,
        limit = 20,
        offset = 0
      } = req.query;

      const filters = {
        type: type as string,
        borough: borough as string,
        ageRangeMin: ageRangeMin ? parseInt(ageRangeMin as string) : undefined,
        ageRangeMax: ageRangeMax ? parseInt(ageRangeMax as string) : undefined,
        features: features ? (features as string).split(',') : undefined,
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const providers = await storage.getProviders(filters);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  app.get('/api/providers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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
      const providerData = insertProviderSchema.parse({ ...req.body, userId });
      
      const provider = await storage.createProvider(providerData);
      res.status(201).json(provider);
    } catch (error) {
      console.error("Error creating provider:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid provider data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create provider" });
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

  const httpServer = createServer(app);
  return httpServer;
}
