const FYP_API_URL = process.env.EXPO_PUBLIC_FYP_API_URL || 'http://34.201.233.58:3000/fyp';
const SEARCH_API_URL = FYP_API_URL.replace(/\/fyp\/?$/, '/search');

const interestQueries = {
  Food: 'restaurants',
  Nightlife: 'nightlife',
  Hiking: 'hiking',
  Museums: 'museums',
  Beaches: 'beaches',
  Shopping: 'shopping',
};

export function buildInterestQueries(profile) {
  const interests = Array.isArray(profile?.interests) ? profile.interests : [];
  return [...new Set(interests
    .map((interest) => {
      if (typeof interest !== 'string') return '';
      return interestQueries[interest] || interest.toLowerCase().trim();
    })
    .filter(Boolean))];
}

export function buildAutomaticQuery(profile) {
  const queryTerms = [];

  if (profile?.travelStyle === 'Relaxed') queryTerms.push('quiet, low-key');
  if (profile?.travelStyle === 'Balanced') queryTerms.push('local favorites, popular attractions');
  if (profile?.travelStyle === 'Packed') queryTerms.push('popular attractions, things to do');

  const age = profile?.age === '' || profile?.age == null ? NaN : Number(profile.age);
  if (Number.isFinite(age) && age >= 0 && age < 13) queryTerms.push('family-friendly activities');
  else if (Number.isFinite(age) && age >= 13 && age < 18) queryTerms.push('teen-friendly activities');
  else if (Number.isFinite(age) && age >= 65) queryTerms.push('senior-friendly activities');

  const groupSize = profile?.groupSize === '' || profile?.groupSize == null ? NaN : Number(profile.groupSize);
  if (Number.isFinite(groupSize) && groupSize === 1) queryTerms.push('solo traveler friendly');
  else if (Number.isFinite(groupSize) && groupSize >= 2 && groupSize < 6) queryTerms.push('small-group friendly');
  else if (Number.isFinite(groupSize) && groupSize >= 6) queryTerms.push('large group friendly, reservations');

  const accessibility = Array.isArray(profile?.accessibility) ? profile.accessibility : [];
  if (accessibility.includes('Wheelchair accessible')) queryTerms.push('wheelchair accessible');
  if (accessibility.includes('Visual impairment')) queryTerms.push('visually accessible');
  if (accessibility.includes('Hearing assistance')) queryTerms.push('hearing assistance');

  const languages = Array.isArray(profile?.languages) ? profile.languages : [];
  languages
    .filter((language) => language && language !== 'English')
    .forEach((language) => queryTerms.push(`${language} language tours`));

  const transportation = Array.isArray(profile?.transportation) ? profile.transportation : [];
  if (transportation.includes('Walking')) queryTerms.push('walkable');
  if (transportation.includes('Public Transit')) queryTerms.push('near public transportation');
  if (transportation.includes('Bike')) queryTerms.push('bike-friendly');
  if (transportation.includes('Rental Car')) queryTerms.push('parking available');

  return [...new Set(queryTerms.map((term) => term.trim()).filter(Boolean))].join(', ');
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

export async function getRecommendedPlaces(location = 'LosAngeles', page = 0, profile) {
  const params = new URLSearchParams({
    location,
    page: String(page),
    query: buildAutomaticQuery(profile),
    interests: buildInterestQueries(profile).join(','),
  });
  const response = await fetch(`${FYP_API_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Recommended places could not be loaded (${response.status}).`);
  }

  const result = await response.json();
  if (!Array.isArray(result)) {
    throw new Error('Recommended places returned an invalid response.');
  }

  return result.map(normalizePlace);
}

export async function searchPlaces(location, query, offset = 0) {
  const params = new URLSearchParams({
    location,
    search: query,
    offset: String(offset),
  });
  const response = await fetch(`${SEARCH_API_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Place search could not be loaded (${response.status}).`);
  }

  const result = await response.json();
  if (!Array.isArray(result)) {
    throw new Error('Place search returned an invalid response.');
  }

  return result.map(normalizePlace);
}
