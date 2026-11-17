import "server-only";

// Fictional people. Who has liked you is not in this file: it's picked at random when the
// database is seeded and only ever exists in the database.

export interface SeedProfile {
  name: string;
  age: number;
  city: string;
  college: string | null;
  bio: string;
  interests: string[];
}

export const SEED_PROFILES: readonly SeedProfile[] = [
  { name: "Ananya", age: 21, city: "Pune", college: "Fergusson College", bio: "Third-year economics. I'll argue about cricket stats and lose gracefully.", interests: ["Cricket", "Economics", "Chai", "Board games"] },
  { name: "Aarav", age: 23, city: "Bengaluru", college: null, bio: "Backend engineer by day, terrible guitarist by night.", interests: ["Guitar", "Startups", "Trekking"] },
  { name: "Diya", age: 20, city: "Mumbai", college: "St. Xavier's College", bio: "Mass media student. I have a ranking of every vada pav stall near college.", interests: ["Street food", "Film", "Photography"] },
  { name: "Vihaan", age: 22, city: "Delhi", college: "Netaji Subhas University of Technology", bio: "Final year IT. Building a weather app nobody asked for.", interests: ["Coding", "Football", "Sci-fi"] },
  { name: "Ishita", age: 24, city: "Kolkata", college: null, bio: "Illustrator. Ask me about my sketchbook of Kolkata trams.", interests: ["Illustration", "Poetry", "Coffee"] },
  { name: "Kabir", age: 21, city: "Jaipur", college: "Manipal University Jaipur", bio: "Architecture student who still gets lost in old forts.", interests: ["Architecture", "History", "Cycling"] },
  { name: "Meera", age: 19, city: "Chennai", college: "Loyola College", bio: "Carnatic violin, filter coffee and long walks on Besant Nagar beach.", interests: ["Carnatic music", "Filter coffee", "Beaches"] },
  { name: "Arjun", age: 25, city: "Hyderabad", college: null, bio: "Product designer. My biryani opinions are not up for debate.", interests: ["Design", "Biryani", "Badminton"] },
  { name: "Saanvi", age: 20, city: "Ahmedabad", college: "CEPT University", bio: "I plan cities for my degree and can't plan a weekend.", interests: ["Urban design", "Garba", "Reading"] },
  { name: "Rohan", age: 22, city: "Chandigarh", college: "Panjab University", bio: "Law student and part-time stand-up. Mostly the second.", interests: ["Stand-up comedy", "Law", "Basketball"] },
  { name: "Tanvi", age: 23, city: "Mumbai", college: null, bio: "Data analyst who runs half marathons to justify dessert.", interests: ["Running", "Data", "Desserts"] },
  { name: "Aditya", age: 21, city: "Pilani", college: "BITS Pilani", bio: "Robotics club. Yes, I built a robot that makes chai. No, it isn't good chai.", interests: ["Robotics", "Chai", "Chess"] },
  { name: "Nandini", age: 22, city: "Delhi", college: "Miranda House", bio: "Physics honours and far too many houseplants.", interests: ["Physics", "Houseplants", "Astronomy"] },
  { name: "Siddharth", age: 24, city: "Pune", college: null, bio: "Cloud engineer. Weekends in the Sahyadris whenever it rains.", interests: ["Trekking", "Cloud computing", "Photography"] },
  { name: "Aisha", age: 20, city: "Lucknow", college: "University of Lucknow", bio: "Urdu poetry, old Bollywood songs and kebab crawls in Aminabad.", interests: ["Urdu poetry", "Old Bollywood", "Kebabs"] },
  { name: "Karthik", age: 23, city: "Chennai", college: "IIT Madras", bio: "Master's in ocean engineering. I swim better than I talk.", interests: ["Swimming", "Research", "Podcasts"] },
  { name: "Simran", age: 21, city: "Amritsar", college: "Guru Nanak Dev University", bio: "Bhangra, bad puns and a camera that's always on.", interests: ["Bhangra", "Photography", "Travel"] },
  { name: "Varun", age: 26, city: "Gurugram", college: null, bio: "Consultant, still trying to cook rajma the way my mum does.", interests: ["Cooking", "Finance", "Squash"] },
  { name: "Kavya", age: 22, city: "Bengaluru", college: "Christ University", bio: "Psychology student. One book a week, mostly on the metro.", interests: ["Psychology", "Books", "Indie music"] },
  { name: "Nikhil", age: 24, city: "Kochi", college: null, bio: "Marine biologist in training. Happy to talk about backwaters for hours.", interests: ["Marine life", "Kayaking", "Birdwatching"] },
  { name: "Zoya", age: 21, city: "Hyderabad", college: "IIIT Hyderabad", bio: "CS student, competitive programmer, anime on the side.", interests: ["Competitive programming", "Anime", "Gaming"] },
  { name: "Harsh", age: 20, city: "Indore", college: "IIM Indore", bio: "Management student. Poha is a personality.", interests: ["Business", "Poha", "Cricket"] },
  { name: "Pooja", age: 25, city: "Kolkata", college: "Jadavpur University", bio: "PhD in comparative literature. Football on Sundays, no exceptions.", interests: ["Literature", "Football", "Theatre"] },
  { name: "Dev", age: 22, city: "Vellore", college: "VIT Vellore", bio: "Mechanical engineering and the Formula Student team.", interests: ["Motorsport", "Engineering", "Gym"] },
  { name: "Sneha", age: 23, city: "Mysuru", college: null, bio: "Yoga teacher. Early mornings, strong coffee.", interests: ["Yoga", "Coffee", "Gardening"] },
  { name: "Faizan", age: 22, city: "Aligarh", college: "Aligarh Muslim University", bio: "History student and amateur calligrapher.", interests: ["History", "Calligraphy", "Cricket"] },
  { name: "Nithya", age: 21, city: "Thiruvananthapuram", college: "College of Engineering Trivandrum", bio: "Electronics student who sings in the college band.", interests: ["Singing", "Electronics", "Travel"] },
  { name: "Sayan", age: 24, city: "Kolkata", college: null, bio: "Journalist. I collect stories and old film posters.", interests: ["Journalism", "Film posters", "Football"] },
  { name: "Riddhi", age: 20, city: "Vadodara", college: "Maharaja Sayajirao University of Baroda", bio: "Fine arts student. I'll paint a mural on any wall that lets me.", interests: ["Painting", "Murals", "Music"] },
  { name: "Yash", age: 23, city: "Nagpur", college: "VNIT Nagpur", bio: "Civil engineering, oranges and late-night badminton.", interests: ["Badminton", "Engineering", "Street food"] },
];
