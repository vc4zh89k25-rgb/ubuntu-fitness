/* ==========================================================
   products.js - the product catalogue data

   To add or change a product, edit this list. Every page reads
   from it, so the catalogue, cart and checkout all update.

   IMPORTANT: if you change an id or a price here, make the same
   change in the price tables inside backend/java/OrderServer.java
   and backend/csharp/Program.cs. The servers do not trust prices
   sent by the browser; they use their own copy.

   type:  "product" = physical goods (can be delivered)
          "service" = coaching or plans (nothing to deliver)
   image: optional. Put a picture in the images folder and set
          image: "images/whey.jpg" to show it instead of the icon.
   ========================================================== */

var CATEGORIES = [
  { key: "activewear",  label: "Activewear",           blurb: "Leggings, tees, bras, shorts and socks", icon: "\uD83D\uDC55" },
  { key: "supplements", label: "Supplements",          blurb: "Protein, pre-workout, creatine, vitamins", icon: "\uD83E\uDDF4" },
  { key: "nutrition",   label: "Nutrition and snacks", blurb: "Protein bars and ready-to-drink shakes",   icon: "\uD83C\uDF6B" },
  { key: "equipment",   label: "Home-gym equipment",   blurb: "Bands, weights, mats and benches",         icon: "\uD83C\uDFCB\uFE0F" },
  { key: "accessories", label: "Accessories",          blurb: "Bags, bottles, trackers and recovery",     icon: "\uD83C\uDF92" }
];

var PRODUCTS = [
  /* ----- Activewear ----- */
  { id: 1,  type: "product", category: "activewear",  name: "High-Waist Training Leggings",   price: 349,  image: "images/High waisted training leggings.jpg", images: ["images/High waisted training leggings.jpg", "images/High waisted training leggings-2.jpg", "images/High waisted training leggings-3.jpg", "images/High waisted training leggings-4.jpg"], featured: true,  desc: "Sweat-wicking and squat-proof, with a phone pocket." },
  { id: 2,  type: "product", category: "activewear",  name: "Breathable Training Tee",        price: 229,  image: "images/Breathable Training Tee.jpg", images:["images/Breathable Training Tee.jpg", "images/Breathable Training Tee-2.jpg", "images/Breathable Training Tee-3.jpg", "images/Breathable Training Tee-4.jpg"], desc: "Light mesh panels for hot days in the gym." },
  { id: 3,  type: "product", category: "activewear",  name: "Supportive Sports Bra",          price: 279,  image: "images/Supportive sports bra.jpg", images:["images/Supportive sports bra.jpg","images/Supportive sports bra-2.jpg", "images/Supportive sports bra-3.jpg", "images/Supportive sports bra-4.jpg"], desc: "Medium-impact support for runs and classes." },
  { id: 4,  type: "product", category: "activewear",  name: "Performance Shorts",             price: 199,  image: "images/Performance shorts.jpg", images: ["images/Performance shorts.jpg", "images/Performance shorts-2.jpg", "images/Performance shorts-3.jpg","images/Performance shorts-4.jpg"], desc: "Quick-dry shorts with a zip pocket." },
  { id: 5,  type: "product", category: "activewear",  name: "Grip Gym Socks (3-pack)",        price: 119,  image: "images/grip socks.avif", images:["images/grip socks.avif", "images/grip socks-2.jpg","images/grip socks-3.jpg", "images/grip socks-4.jpg"], desc: "Cushioned soles that stay put inside your trainers." },

  /* ----- Supplements ----- */
  { id: 6,  type: "product", category: "supplements", name: "Whey Protein 1 kg",              price: 649,  image: "images/Whey Protein.jpg", images:["images/Whey Protein.jpg", "images/Whey Protein-2.jpg", "images/Whey Protein-3.jpg", "images/Whey Protein-4.jpg"], featured: true,  desc: "Chocolate or vanilla, for after training." },
  { id: 7,  type: "product", category: "supplements", name: "Plant Protein 900 g",            price: 599,  image: "images/Plant Protein.jpg", images:["images/Plant Protein.jpg", "images/Plant Protein-2.jpg", "images/Plant Protein-3.jpg","images/Plant Protein-4.jpg"], desc: "Pea and rice blend, dairy-free." },
  { id: 8,  type: "product", category: "supplements", name: "Pre-Workout 300 g",              price: 399,  image: "images/Pre-Workout.jpg", images:["images/Pre-Workout.jpg", "images/Pre-Workout-2.jpg", "images/Pre-Workout-3.jpg", "images/Pre-Workout-4.jpg",  "images/Pre-Workout-5.jpg"], desc: "Caffeine and beta-alanine for early sessions." },
  { id: 9,  type: "product", category: "supplements", name: "Creatine Monohydrate 500 g",     price: 329,  image: "images/Creatine Monohydrate.jpg", images: ["images/Creatine Monohydrate.jpg","images/Creatine Monohydrate-2.jpg", "images/Creatine Monohydrate-3.jpg", "images/Creatine Monohydrate-4.jpg"], desc: "Unflavoured, mixes into any drink." },
  { id: 10, type: "product", category: "supplements", name: "Daily Multivitamin (60 caps)",   price: 169,  Image: "images/Daily Multivitamin.jpg", images:["images/Daily Multivitamin.jpg", "images/Daily Multivitamin-2.jpg", "images/Daily Multivitamin-3.jpg", "images/Daily Multivitamin-4.jpg"], desc: "One a day to cover the basics." },

  /* ----- Nutrition and snacks ----- */
  { id: 11, type: "product", category: "nutrition",   name: "Protein Bars (box of 12)",       price: 389,  image: "images/Protein Bars.jpg", images:["images/Protein Bars.jpg", "images/Protein Bars-2.jpg", "images/Protein Bars-3.jpg","images/Protein Bars-4.jpg"], featured: true,  desc: "20 g of protein each and easy to keep in a bag." },
  { id: 12, type: "product", category: "nutrition",   name: "Protein Shake (6-pack)",         price: 279,  image: "images/Protein Shake.jpg",images:["images/Protein Shake.jpg", "images/Protein Shake-2.jpg", "images/Protein Shake.jpg-3"], desc: "Ready to drink. Grab one between lectures." },
  { id: 13, type: "product", category: "nutrition",   name: "Meal-Replacement Shake 500 g",   price: 299,  image: "images/Meal-Replacement Shake.jpg", images:["images/Meal-Replacement Shake.jpg", "images/Meal-Replacement Shake-2.jpg", "images/Meal-Replacement Shake-3.jpg","images/Meal-Replacement Shake-4.jpg"], desc: "A quick, balanced meal for busy days." },

  /* ----- Home-gym equipment ----- */
  { id: 14, type: "product", category: "equipment",   name: "Resistance Band Set",            price: 249,  image: "images/Resistance Band Set.jpg", images:["images/Resistance Band Set.jpg","images/Resistance Band Set-2.jpg", "images/Resistance Band Set-3.jpg", "images/Resistance Band Set-4.jpg"],      featured: true,  desc: "Five bands from light to heavy, with a carry pouch." },
  { id: 15, type: "product", category: "equipment",   name: "Adjustable Dumbbells (pair)",    price: 1499, image: "images/Adjustable Dumbbells (pair).jpg", images:["images/Adjustable Dumbbells (pair).jpg", "images/Adjustable Dumbbells (pair)-2.jpg", "images/Adjustable Dumbbells (pair)-3.jpg"], desc: "Adjusts from 2 kg to 20 kg per hand." },
  { id: 16, type: "product", category: "equipment",   name: "Yoga Mat 6 mm",                  price: 299,  image: "images/Yoga Mat 6 mm.jpg",images: ["images/Yoga Mat 6 mm.jpg", "images/Yoga Mat 6 mm-2.jpg", "images/Yoga Mat 6 mm-3.jpg", "images/Yoga Mat 6 mm-4.jpg"], desc: "Non-slip and easy to roll up." },
  { id: 17, type: "product", category: "equipment",   name: "Speed Skipping Rope",            price: 129,  image: "images/Speed Skipping Rope.jpg", images: ["images/Speed Skipping Rope.jpg", "images/Speed Skipping Rope-2.jpg", "images/Speed Skipping Rope-3.jpg", "images/Speed Skipping Rope-4.jpg"], desc: "Adjustable length with smooth bearings." },
  { id: 18, type: "product", category: "equipment",   name: "Adjustable Bench",               price: 1899, image: "images/Adjustable Bench.jpg",images: ["images/Adjustable Bench.jpg", "images/Adjustable Bench-4.jpg", "images/Adjustable Bench-2.jpg", "images/Adjustable Bench-3.jpg"], desc: "Flat, incline and decline positions for home workouts." },

  /* ----- Accessories ----- */
  { id: 19, type: "product", category: "accessories", name: "Gym Duffel Bag",                 price: 399,  image: "images/Gym Duffel Bag.jpg", images:["images/Gym Duffel Bag.jpg", "images/Gym Duffel Bag-2.jpg", "images/Gym Duffel Bag-3.jpg", "images/Gym Duffel Bag-4.jpg"], desc: "Separate shoe compartment and a wet pocket." },
  { id: 20, type: "product", category: "accessories", name: "Insulated Water Bottle 750 ml",  price: 219,  image: "images/Insulated Water Bottle 750 ml.jpg",images: ["images/Insulated Water Bottle 750 ml.jpg", "images/Insulated Water Bottle 750 ml-2.jpg", "images/Insulated Water Bottle 750 ml-3.jpg", "images/Insulated Water Bottle 750 ml-4.jpg"], desc: "Keeps drinks cold for 24 hours." },
  { id: 21, type: "product", category: "accessories", name: "Shaker Bottle",                  price: 89,   image: "images/Shaker Bottle.jpg",images:["images/Shaker Bottle.jpg", "images/Shaker Bottle-2.jpg", "images/Shaker Bottle-3.jpg", "images/Shaker Bottle-4.jpg"], desc: "700 ml with a mixing ball and measuring marks." },
  { id: 22, type: "product", category: "accessories", name: "Fitness Tracker",                price: 799,  image: "images/Fitness Tracker.jpg", images:["images/Fitness Tracker.jpg", "images/Fitness Tracker-2.jpg", "images/Fitness Tracker-3.jpg", "images/Fitness Tracker-4.jpg"],      desc: "Steps, heart rate and sleep, with a 7-day battery." },
  { id: 23, type: "product", category: "accessories", name: "Foam Roller",                    price: 229,  image: "images/Foam Roller.jpg",images:["images/Foam Roller.jpg", "images/Foam Roller-2.jpg", "images/Foam Roller-3.jpg", "images/Foam Roller-4.jpg"], desc: "Firm roller for sore legs and backs." },

  /* ----- Services (coaching and plans) ----- */
  { id: 24, type: "service", category: "service", unit: "session", name: "Online Personal Training: Single Session", price: 250,  icon: "\uD83C\uDFA5", desc: "One 45-minute video session with a coach." },
  { id: 25, type: "service", category: "service", unit: "month",   name: "Online Personal Training: Monthly Package", price: 1600, icon: "\uD83D\uDCC5", desc: "Eight 45-minute sessions a month, booked around your week." },
  { id: 26, type: "service", category: "service", unit: "month",   name: "Meal Plan Subscription",                    price: 199,  icon: "\uD83E\uDD57", desc: "A weekly plan built around your goals, budget and diet." },
  { id: 27, type: "service", category: "service", unit: "month",   name: "Workout Plan Subscription",                 price: 149,  icon: "\uD83D\uDCCB", desc: "Programmes for the gym, a home gym or bodyweight, updated as you improve." }
];
