export const userProfile = {
  name: 'Caden Rowley',
  age: 15,
  languages: ['English', 'Spanish'],
  accessibility: ['Wheelchair accessible', 'Visual impairment'],
  interests: ['Food', 'Nightlife', 'Hiking', 'Museums', 'Beaches'],
  travelStyle: 'Balanced',
  groupSize: 3,
  transportation: ['Public Transit', 'Walking'],
};

export const places = [
  {
    id: 'griffith',
    name: 'Griffith Observatory',
    category: 'Landmark',
    distance: '1.2 mi away',
    rating: '4.7',
    reviews: '2,100 reviews',
    quote: 'Breathtaking views and a perfect sunset stop for a relaxed evening.',
    tags: ['Family friendly', 'Sunset', 'Scenic'],
    color: '#4C6FFF',
  },
  {
    id: 'pier',
    name: 'Santa Monica Pier',
    category: 'Beach / Entertainment',
    distance: '4.8 mi away',
    rating: '4.5',
    reviews: '3,600 reviews',
    quote: 'A lively oceanfront stop with food, fun, and sunset energy.',
    tags: ['Walkable', 'Nightlife', 'Food'],
    color: '#0EA5E9',
  },
  {
    id: 'getty',
    name: 'The Getty Center',
    category: 'Museum',
    distance: '3.1 mi away',
    rating: '4.8',
    reviews: '1,850 reviews',
    quote: 'World-class art and architecture with a calm, elevated experience.',
    tags: ['Museum', 'Quiet', 'Views'],
    color: '#8B5CF6',
  },
];

export const savedPlaces = [
  {
    id: 'hollywood-sign',
    name: 'Hollywood Sign',
    category: 'Landmark',
    tags: ['landmark', 'scenic', 'photo spot', 'outdoor'],
    rating: '4.6',
    notes: 'Great photo spot. Go early to avoid crowds.',
  },
  {
    id: 'santa-monica',
    name: 'Santa Monica Pier',
    category: 'Beach / Entertainment',
    tags: ['beach', 'entertainment', 'restaurant', 'food', 'nightlife'],
    rating: '4.5',
    notes: 'Fun at sunset. Lots of food options and a lively boardwalk.',
  },
  {
    id: 'getty-center',
    name: 'The Getty Center',
    category: 'Museum',
    tags: ['museum', 'culture', 'art', 'views', 'quiet'],
    rating: '4.8',
    notes: 'Ideal for a calm cultural stop with beautiful views.',
  },
];

export const plannerItems = [
  { id: '1', time: '9:00 AM', category: 'Breakfast', title: 'Grand Central Market', note: 'Quick bite before heading out.' },
  { id: '2', time: '11:00 AM', category: 'Outdoor Activity', title: 'Runyon Canyon Hike', note: 'Great morning trail and city views.' },
  { id: '3', time: '2:00 PM', category: 'Cultural Stop', title: 'The Getty Center', note: 'Art, architecture, and relaxing indoor time.' },
  { id: '4', time: '5:00 PM', category: 'Sunset / Relax', title: 'Santa Monica Pier', note: 'Perfect for a casual evening walk.' },
  { id: '5', time: '7:30 PM', category: 'Dinner / Nightlife', title: 'Otium Rooftop Bar', note: 'Ends the day with food and a skyline view.' },
];
