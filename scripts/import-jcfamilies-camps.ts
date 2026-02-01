import { db } from "../server/db";
import { providers } from "../shared/schema";
import { eq, and } from "drizzle-orm";

const summerCamps = [
  {
    name: "Albrich Academy Summer Camp",
    description: "STEAM-infused summer camp blending hands-on learning with exciting activities. Features Ethics & Social-Emotional Learning (SEL) program, gym & movement sessions, urban garden for hands-on planting, private playgrounds, eco-friendly classrooms, and organic nutritious meals. Emphasizes creativity, critical thinking, kindness, confidence, and teamwork.",
    address: "159 2nd Street",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    phone: "201-963-5555",
    email: "contact@ALBRICHAcademy.com",
    website: "https://academyofexcellencepreschool.com/academy-of-excellence-preschool-state-of-the-art-early-education/",
    type: "camp" as const,
    ageRangeMin: 2,
    ageRangeMax: 6,
    monthlyPrice: "0",
  },
  {
    name: "The Brunswick School STEAM Summer Camp",
    description: "STEAM Summer Camp from June 30–August 22 at Newport and Hamilton Park campuses. Designed for campers entering PreK4–3rd grade, the program blends science, technology, engineering, arts, and math with hands-on fun. Includes weekly field trips, water play, and park trips.",
    address: "371 7th Street",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    phone: "201-478-8886",
    email: "admissions@thebrunswickschool.com",
    website: "https://thebrunswickschool.myschoolapp.com/app#login",
    type: "camp" as const,
    ageRangeMin: 4,
    ageRangeMax: 9,
    monthlyPrice: "0",
  },
  {
    name: "Smart Start Academy Summer Camp",
    description: "Fun-filled summer camp with STEAM experiments, outdoor play/water activities, music and movement, arts & crafts, themed weekly adventures, special guests, field trips, and special events. Ages 6 weeks and up. Session 1: June 30 – July 25, Session 2: July 28 – August 27. All-inclusive tuition covers materials, meals, extended hours, field trip fees, and special events. Nutritious organic meals provided daily.",
    address: "532 Jersey Avenue",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    phone: "201-461-0101",
    website: "https://smart-startacademy.com/",
    type: "camp" as const,
    ageRangeMin: 0,
    ageRangeMax: 12,
    monthlyPrice: "0",
  },
  {
    name: "My Gym Summer Camp",
    description: "The most fun and flexible camp in town! Children participate in energizing fitness games, noncompetitive gymnastics, arts and crafts, music and more. Each camp program is uniquely designed to keep children moving and active, emphasizing physical development and personal success. Different themes every week. Perfect for ages 2.5-10 years. Must be potty-trained.",
    address: "252 9th Street",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    phone: "201-205-1218",
    website: "https://www.mygym.com/jerseycity/camp",
    type: "camp" as const,
    ageRangeMin: 2,
    ageRangeMax: 10,
    monthlyPrice: "0",
  },
  {
    name: "British Swim School",
    description: "Award-winning swim lessons year-round as an alternative to seasonal camp programs. Provides children with essential, life-saving water survival skills. Students learn critical survival techniques like floating on their backs independently and safely reaching the pool's edge. Continuous program ensures steady improvement and retention of skills. Classes for all ages and abilities.",
    address: "Multiple locations across Jersey City and Bayonne",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    phone: "201-645-1300",
    website: "https://britishswimschool.com/hudson-waterfront/",
    type: "camp" as const,
    ageRangeMin: 0,
    ageRangeMax: 18,
    monthlyPrice: "0",
  },
  {
    name: "Waterfront Montessori Summer Camp - Hopscotch Around the World",
    description: "Unforgettable adventure where children journey across seven continents over six exciting weeks, discovering new cultures through hands-on learning. Campers dive into each continent's unique wonders through STEM, science, music, dance, history, art, and cooking. Mornings begin with energizing camp songs and cheers, followed by sports or dance. Immersive 360-degree approach to learning.",
    address: "150 Warren St #108",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    phone: "201-333-5600",
    email: "info@waterfrontmontessori.com",
    website: "https://www.waterfrontmontessori.com/summerprogram",
    type: "camp" as const,
    ageRangeMin: 2,
    ageRangeMax: 12,
    monthlyPrice: "0",
  },
  {
    name: "French American Academy Bilingual Summer Camp",
    description: "Unique summer experience filled with French language, cultural exploration, and exciting activities. June 23 – August 15, 2025 for ages 3-10. Daily sports and athletic activities, arts & crafts, games, French oral workshops, dance, music, STEM, trips to parks, water sprinklers, and field trips. Each week introduces a new regional subtheme spanning North America, Caribbean, Europe, Oceania, West Asia, and Africa.",
    address: "209 3rd St",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    email: "kgriffith@faacademy.org",
    website: "https://faacademy.org/french-summer-camp-in-jersey-city/",
    type: "camp" as const,
    ageRangeMin: 3,
    ageRangeMax: 10,
    monthlyPrice: "0",
  },
  {
    name: "Learning Ladders Summer Camp",
    description: "Stimulating, enriching, joyous summer camp! Features 'Savvy Science' with explosive science exploration, 'The Five Senses' journey, and 'What's Bugging Us?' insect exploration. Summer filled with creative arts, music and dance, soccer, water play, parks and field trips. Built upon STEAM and IB curriculum. June 23rd to August 22nd with three sessions and schedules offered.",
    address: "33 Hudson St",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    phone: "201-918-6643",
    email: "admissions@learningladdersnj.com",
    website: "https://learningladdersnj.com/",
    type: "camp" as const,
    ageRangeMin: 0,
    ageRangeMax: 6,
    monthlyPrice: "0",
  },
  {
    name: "Procel Brazilian Jiu-Jitsu Summer Camp",
    description: "Fun, safe, and positive martial arts summer program. Develops life skills through martial arts training. Limited class size ensures your child gets tons of attention. Educational activities keep the learning process alive. Instructors truly care about your child, and kids make new friends! Two programs: Little Champs (ages 5-7) and Jr. Warriors (ages 8-12).",
    address: "189 Brunswick St",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    website: "https://procelbjj.com/program/kids-martial-arts/",
    type: "camp" as const,
    ageRangeMin: 5,
    ageRangeMax: 12,
    monthlyPrice: "0",
  },
  {
    name: "Soccer Stars Summer Camp",
    description: "Unforgettable experience for children aged 3–12 at Lilypad Academy. Full-day camp (9 AM–4 PM) with dynamic sports sessions, creative STEAM activities including science, music, and art, and essential sports skill development. 10 weeks of camp from June 23 – August 29. Accepts Bright Horizons & Vivvi Back-Up Care, FSA, and DCFSA. Multi-week discounts available.",
    address: "837 Jersey Ave",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07310",
    phone: "212-877-7171",
    website: "https://soccerstars.com/",
    type: "camp" as const,
    ageRangeMin: 3,
    ageRangeMax: 12,
    monthlyPrice: "0",
  },
  {
    name: "Key Element Learning Summer Camp",
    description: "Engaging and dynamic summer camp experience designed to inspire creativity, foster learning, and encourage social interaction. For ages 2-9. Each week features unique themes from jungle safaris and prehistoric explorations to space adventures and engineering challenges. Hands-on activities including science experiments, art projects, outdoor games, and language immersion with native-speaking instructors. Daily park explorations, water play, sports, cooking fun, and interactive field trips.",
    address: "338 Grove St",
    borough: "Jersey City",
    city: "Jersey City",
    state: "NJ",
    zipCode: "07302",
    phone: "201-200-1160",
    email: "info@keyelementlearning.com",
    website: "https://www.keyelementlearning.com/summer-camp-application",
    type: "camp" as const,
    ageRangeMin: 2,
    ageRangeMax: 9,
    monthlyPrice: "0",
  },
];

async function importCamps() {
  console.log(`Starting import of ${summerCamps.length} summer camps from JCFamilies...`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const camp of summerCamps) {
    try {
      // Check if camp already exists by name
      const existing = await db.select()
        .from(providers)
        .where(eq(providers.name, camp.name));
      
      if (existing.length > 0) {
        console.log(`Skipping duplicate: ${camp.name}`);
        skipped++;
        continue;
      }
      
      await db.insert(providers).values({
        ...camp,
        isActive: true,
        isVerified: false,
        claimStatus: 'unclaimed',
        profileCompleteness: 60,
        isProfileVisible: true,
      });
      
      console.log(`Imported: ${camp.name}`);
      imported++;
    } catch (error) {
      console.error(`Error importing ${camp.name}:`, error);
    }
  }
  
  console.log(`\nImport complete!`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (duplicates): ${skipped}`);
}

importCamps()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Import failed:", error);
    process.exit(1);
  });
