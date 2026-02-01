import { db } from "../server/db";
import { providers } from "../shared/schema";
import { eq } from "drizzle-orm";

const indoorPlaces = [
  {
    name: "Liberty Science Center",
    description: "The best indoor place for kids in Jersey City with exhibits for all ages. Experience the wonders of space in the largest planetarium in the Western Hemisphere! Permanent fixtures that kids will love, no matter the weather.",
    address: "222 Jersey City Blvd",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    website: "https://lsc.org/",
    type: "afterschool" as const,
    ageRangeMin: 0,
    ageRangeMax: 18,
    monthlyPrice: "0",
  },
  {
    name: "Luna De Papel",
    description: "A crafting workshop offering crafting and DIY classes and workshops for adults and children of all ages. A place where all can test the bounds of their imagination in an enjoyable environment. Also offers after-school programs.",
    address: "321 Communipaw Ave",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07304",
    website: "https://www.lunadepapel.us/parties",
    type: "afterschool" as const,
    ageRangeMin: 3,
    ageRangeMax: 18,
    monthlyPrice: "0",
  },
  {
    name: "Tiny Greenhouse",
    description: "A friendly art studio in Downtown Jersey City offering art classes and drop-in studio/open play for children. Pre-set tables with clay, crayons, blocks, puzzles, toys, books, and more. Perfect for little ones who love to interact and play.",
    address: "498a Jersey Ave",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    website: "https://www.tinygreenhousejc.com/",
    type: "afterschool" as const,
    ageRangeMin: 1,
    ageRangeMax: 10,
    monthlyPrice: "0",
  },
  {
    name: "Hudson Lanes",
    description: "Family fun bowling alley with 60 lanes, a full-service grill, and arcade games. Perfect for family outings and birthday parties!",
    address: "1 Garfield Avenue",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07305",
    website: "http://nationwidebowling.com/jersey-city-new-jersey/",
    type: "afterschool" as const,
    ageRangeMin: 3,
    ageRangeMax: 18,
    monthlyPrice: "0",
  },
  {
    name: "RPM Raceway",
    description: "Experience the thrill of competitive racing with state-of-the-art Italian go-karts! No matter your driving experience, RPM Raceway challenges you to stick to the fastest line. Perfect for group events and birthday parties.",
    address: "99 Caven Point Rd",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07305",
    website: "https://rpmraceway.com/",
    type: "afterschool" as const,
    ageRangeMin: 5,
    ageRangeMax: 18,
    monthlyPrice: "0",
  },
  {
    name: "The Gravity Vault - Hoboken",
    description: "Indoor rock climbing gym providing a fun, welcoming environment where beginners and experienced climbers can learn, train, and enjoy climbing together. Climbing options and teaching programs available for all skill levels.",
    address: "1423 Clinton St",
    borough: "Hoboken",
    city: "Hoboken",
    state: "NJ",
    zipCode: "07030",
    website: "https://www.gravityvault.com/locations/hoboken-nj/programs",
    type: "afterschool" as const,
    ageRangeMin: 5,
    ageRangeMax: 18,
    monthlyPrice: "0",
  },
  {
    name: "The Gravity Vault - Jersey City",
    description: "10,000-square-foot bouldering facility great for kids 7 and up. Features fully equipped cross-training space with squat rig, barbells, dumbbells, treadmill, rower, cable machine. Wall features include Arêtes, Arches, Key Holes, Chimneys, Cracks, Overhangs, and more.",
    address: "150 Pacific Ave Building P",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    website: "https://gravityvault.com/",
    type: "afterschool" as const,
    ageRangeMin: 7,
    ageRangeMax: 18,
    monthlyPrice: "0",
  },
  {
    name: "Tiny Artisan",
    description: "A uniquely small but large imagination process art studio in Historic Downtown Jersey City. Dedicated to promoting creativity, discovery, and independent thinking. Guided by an out-of-the-box team of creatives fusing unique techniques for the most interesting experience. Offers classes for all ages.",
    address: "150 Bay St",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    website: "https://tinyartisanjc.com/",
    type: "afterschool" as const,
    ageRangeMin: 2,
    ageRangeMax: 12,
    monthlyPrice: "0",
  },
  {
    name: "Catch Air",
    description: "Indoor entertainment center offering laser shows, dance parties, climbing structures, open play areas and more for kids 12 and under. Also hosts birthday parties, field trips, group outings and fundraising events.",
    address: "2 Garfield Ave Suite 2-8",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07305",
    website: "https://catchairparty.com/geo_location/jersey-city-nj/",
    type: "afterschool" as const,
    ageRangeMin: 1,
    ageRangeMax: 12,
    monthlyPrice: "0",
  },
  {
    name: "Little Milestones For Small Discoveries",
    description: "An INCLUSIVE environment dedicated to providing therapy and education to typical and neurodiverse children. Owned and operated by a registered and licensed Occupational Therapist, Licensed Elementary School Teacher, and Preschool Owner. Focused on ensuring all children exceed their developmental milestones.",
    address: "568 Communipaw Avenue",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07304",
    website: "https://www.lm4sd.com/",
    type: "afterschool" as const,
    ageRangeMin: 0,
    ageRangeMax: 12,
    monthlyPrice: "0",
  },
  {
    name: "Krayon Park",
    description: "6,500-square-foot indoor play haven of pure, screen-free fun for ages 6 months to 10 years! Features multi-level climbing structures, slides, swings, ball pits, and trampolines. Separate soft-play areas for smallest children. Imaginative play including dress up, vet, cafe, grocery store, farm. CPR/AED-certified staff. Custom birthday parties, enrichment classes, and babysitting services.",
    address: "206 Van Vorst Street, 2nd Floor",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    website: "https://krayonpark.com/",
    type: "afterschool" as const,
    ageRangeMin: 0,
    ageRangeMax: 10,
    monthlyPrice: "0",
  },
  {
    name: "Funzy Indoor Playground",
    description: "Dedicated to building the best play-to-learn family club for the future generation. Features explorative play areas, educational workshops, all-day cafe, and networking events. Helps everyone from toddlers to adults have fun, learn, and build bonds that last a lifetime.",
    address: "125 River Dr S",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07310",
    website: "https://www.funzyplay.com/",
    type: "afterschool" as const,
    ageRangeMin: 0,
    ageRangeMax: 12,
    monthlyPrice: "0",
  },
  {
    name: "Jersey Jungle Indoor Playground",
    description: "A Wild Haven of Fun featuring a thrilling maze/labyrinth to explore, interactive ball wall for non-stop fun, creative Lego section for building and imagination, dedicated toddler zone for youngest adventurers, and art & crafts section where creativity knows no bounds!",
    address: "30 Mall Dr W 2nd Floor",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07310",
    website: "https://jersey-jungle.com/",
    type: "afterschool" as const,
    ageRangeMin: 1,
    ageRangeMax: 12,
    monthlyPrice: "0",
  },
  {
    name: "Playwell Social Pediatric Therapy",
    description: "Provides pediatric therapy (Speech Therapy, Occupational Therapy, Physical Therapy), baby & me classes, enrichment classes, in-home & in-play studio connection, fun, and community for families.",
    address: "157A 1st St, Unit 318",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    website: "https://www.instagram.com/playwell.social",
    type: "afterschool" as const,
    ageRangeMin: 0,
    ageRangeMax: 12,
    monthlyPrice: "0",
  },
  {
    name: "SUPER BASE by Basement Sports",
    description: "Experience Sports, Tech (Gaming) and Arts like never before throughout 10,000 square feet of modular play spaces! Features two large sports-themed rooms perfect for birthdays, sports classes and camps, a game room lounge, juice bar, and outdoor areas. Classes for kids and adults in Soccer, Cricket, Basketball, Tennis, Pickleball, Baseball, Flag Football, Martial Arts, Hockey and more!",
    address: "157 1st St",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    website: "https://www.superbase.games/",
    type: "afterschool" as const,
    ageRangeMin: 3,
    ageRangeMax: 18,
    monthlyPrice: "0",
  },
];

async function importIndoorPlaces() {
  console.log(`Starting import of ${indoorPlaces.length} indoor activity centers from JCFamilies...`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const place of indoorPlaces) {
    try {
      const existing = await db.select()
        .from(providers)
        .where(eq(providers.name, place.name));
      
      if (existing.length > 0) {
        console.log(`Skipping duplicate: ${place.name}`);
        skipped++;
        continue;
      }
      
      await db.insert(providers).values({
        ...place,
        isActive: true,
        isVerified: false,
        claimStatus: 'unclaimed',
        profileCompleteness: 60,
        isProfileVisible: true,
      });
      
      console.log(`Imported: ${place.name}`);
      imported++;
    } catch (error) {
      console.error(`Error importing ${place.name}:`, error);
    }
  }
  
  console.log(`\nImport complete!`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (duplicates): ${skipped}`);
}

importIndoorPlaces()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Import failed:", error);
    process.exit(1);
  });
