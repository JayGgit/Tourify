import { places } from '../data/profile';

// Change this to 'error' to test the error state.
export const MOCK_STATE = 'success';

export async function getRecommendedPlaces() {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (MOCK_STATE === 'error') {
    throw new Error('Recommended places could not be loaded.');
  }

  return Array.from({ length: 10 }, (_, index) => places[index % places.length]);
}
