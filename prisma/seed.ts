import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mockPlaces = [
  {
    name: "Times Square Diner & Grill",
    address: "807 8th Ave, New York, NY 10019",
    category: "Restaurant",
    lat: 40.7610,
    lng: -73.9880,
    rating: 4.5,
    description: "Classic, buzzing diner serving American comfort food, breakfast all day, and delicious milkshakes."
  },
  {
    name: "Carmine's Italian Restaurant",
    address: "200 W 44th St, New York, NY 10036",
    category: "Restaurant",
    lat: 40.7575,
    lng: -73.9868,
    rating: 4.6,
    description: "Vibrant family-style Italian restaurant known for massive portions of pasta and classic dishes."
  },
  {
    name: "Mount Sinai West Hospital",
    address: "1000 10th Ave, New York, NY 10019",
    category: "Hospital",
    lat: 40.7690,
    lng: -73.9882,
    rating: 4.2,
    description: "Full-service hospital providing advanced clinical care and 24/7 emergency medical services."
  },
  {
    name: "CityMD West 42nd St Urgent Care",
    address: "345 W 42nd St, New York, NY 10036",
    category: "Hospital",
    lat: 40.7578,
    lng: -73.9902,
    rating: 4.1,
    description: "Quick walk-in medical clinic offering treatment for non-life-threatening illnesses and injuries."
  },
  {
    name: "Times Square - 42 St Metro Station",
    address: "Broadway & 42nd St, New York, NY 10036",
    category: "Metro",
    lat: 40.7548,
    lng: -73.9868,
    rating: 4.3,
    description: "Major subway hub connecting lines 1, 2, 3, 7, N, Q, R, W, and the S shuttle."
  },
  {
    name: "50 St Subway Station",
    address: "8th Ave & 50th St, New York, NY 10019",
    category: "Metro",
    lat: 40.7617,
    lng: -73.9838,
    rating: 4.0,
    description: "Subway station serving the C and E lines, located in the theater district."
  },
  {
    name: "Manhattan Heliport (Downtown)",
    address: "6 E River Bike Path, New York, NY 10004",
    category: "Airport",
    lat: 40.7012,
    lng: -74.0090,
    rating: 4.8,
    description: "Scenic helicopter tours of New York Harbor and private airport transfers."
  },
  {
    name: "Port Authority Bus Terminal",
    address: "625 8th Ave, New York, NY 10018",
    category: "Bus Stop",
    lat: 40.7568,
    lng: -73.9905,
    rating: 3.8,
    description: "The busiest bus terminal in the world, connecting NYC with local and interstate lines."
  },
  {
    name: "The Knickerbocker Hotel",
    address: "6 Metre St, New York, NY 10036",
    category: "Hotel",
    lat: 40.7556,
    lng: -73.9847,
    rating: 4.7,
    description: "Luxury 5-star hotel with a sleek rooftop bar offering stunning views of Times Square."
  },
  {
    name: "Marriott Marquis New York",
    address: "1535 Broadway, New York, NY 10036",
    category: "Hotel",
    lat: 40.7585,
    lng: -73.9862,
    rating: 4.5,
    description: "Modern, iconic hotel with a revolving rooftop restaurant in the heart of Broadway."
  },
  {
    name: "SP+ Parking Garage",
    address: "250 W 43rd St, New York, NY 10036",
    category: "Parking",
    lat: 40.7570,
    lng: -73.9882,
    rating: 3.9,
    description: "Secure, indoor 24-hour self-park garage close to theaters and hotels."
  },
  {
    name: "Chase Bank & ATM",
    address: "1411 Broadway, New York, NY 10018",
    category: "ATM",
    lat: 40.7538,
    lng: -73.9875,
    rating: 4.2,
    description: "Full-service retail bank with 24-hour drive-up and walk-up ATMs."
  },
  {
    name: "Tesla Supercharger Station",
    address: "330 W 42nd St, New York, NY 10036",
    category: "EV Charging",
    lat: 40.7582,
    lng: -73.9898,
    rating: 4.4,
    description: "High-speed charging station for electric vehicles, open 24/7."
  },
  {
    name: "Professional Performing Arts School",
    address: "328 W 48th St, New York, NY 10036",
    category: "School",
    lat: 40.7618,
    lng: -73.9894,
    rating: 4.5,
    description: "Renowned public middle and high school offering specialized performing arts education."
  },
  {
    name: "NYPD Midtown North Precinct",
    address: "306 W 54th St, New York, NY 10019",
    category: "Police",
    lat: 40.7645,
    lng: -73.9842,
    rating: 4.0,
    description: "Local precinct station serving the theater district and northern Midtown Manhattan."
  },
  {
    name: "Manhattan Mall",
    address: "100 W 33rd St, New York, NY 10001",
    category: "Mall",
    lat: 40.7489,
    lng: -73.9888,
    rating: 4.1,
    description: "Multi-level indoor shopping center with high-street retailers, clothing stores, and dining."
  },
  {
    name: "Central Park Zoo",
    address: "East 64th St, New York, NY 10021",
    category: "School", // Categorized close to parks/museums
    lat: 40.7678,
    lng: -73.9718,
    rating: 4.6,
    description: "Charming wildlife park housing sea lions, penguins, red pandas, and a snow leopard."
  },
  {
    name: "Radio City Music Hall",
    address: "1260 6th Ave, New York, NY 10020",
    category: "Mall", // Entertainment/shopping center category
    lat: 40.7599,
    lng: -73.9799,
    rating: 4.8,
    description: "Historic Art Deco theater and home of the precision dance company, the Rockettes."
  }
];

async function main() {
  console.log("Seeding database...");
  await prisma.place.deleteMany();
  for (const place of mockPlaces) {
    const photos = JSON.stringify([
      `https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=60`,
      `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=60`
    ]);
    await prisma.place.create({
      data: {
        ...place,
        photos
      }
    });
  }
  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
