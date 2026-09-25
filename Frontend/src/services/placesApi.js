const FYP_API_URL = process.env.EXPO_PUBLIC_FYP_API_URL || 'http://34.201.233.58:3000/fyp';

const interestQueries = {
  Food: 'restaurants',
  Nightlife: 'nightlife',
  Hiking: 'nature',
  Museums: 'museums',
  Beaches: 'beaches',
  Shopping: 'shopping',
};

export function buildAutomaticQuery(profile) {
  const interests = Array.isArray(profile?.interests) ? profile.interests : [];
  const queryTerms = interests.map((interest) => interestQueries[interest] || interest.toLowerCase());

  if (profile?.travelStyle === 'Relaxed') queryTerms.push('quiet');
  if (profile?.travelStyle === 'Packed') queryTerms.push('popular attractions');
  if (profile?.accessibility?.length) queryTerms.push('accessible');
  if (profile?.transportation?.includes('Walking')) queryTerms.push('walkable');

  return [...new Set(queryTerms)].join(',');
}

function normalizePlace(place, index) {
  return {
    id: String(place.id || `place-${index}`),
    name: place.name || 'Unnamed place',
    category: place.category || 'Place',
    distance: place.description || 'Location unavailable',
    rating: Number(place.stars || 0).toFixed(1),
    reviews: place.reviewAmt ? `${Number(place.reviewAmt).toLocaleString()} reviews` : 'No reviews yet',
    quote: place.description || 'A recommended place to explore.',
    tags: [place.category || 'Place'],
    color: '#4C6FFF',
    imageUrl: place.img || '',
    latitude: place.lat,
    longitude: place.long,
  };
}

export async function getRecommendedPlaces(location = 'LosAngeles', offset = 0, profile) {
  console.log('Fetching recommended places...')
  const params = new URLSearchParams({
    location,
    offset: String(offset),
    limit: '10',
    query: buildAutomaticQuery(profile),
  });
  const response = await fetch(`${FYP_API_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Recommended places could not be loaded (${response.status}).`);
  }
  const result = await response.json();
  console.log(result)
  if (!Array.isArray(result)) {
    throw new Error('Recommended places returned an invalid response.');
  }

  return result.map(normalizePlace);
}
