# Tourify Mobile

Tourify is a mobile Expo app using React Navigation for its tab navigation. The application entry point is `App.js`; it does not use Expo Router or file-based routing.

## Get started

Install dependencies and start Expo:

```bash
npm install
npm start
```

Use the Expo CLI prompts to open the app on a development build, Android emulator, or iOS simulator.

Google sign-in requires `EXPO_PUBLIC_GOOGLE_CLIENT_ID` in `Frontend/.env.local`.
Use the matching Google Web client ID in `Backend/.env` as `GOOGLE_CLIENT_ID`.
The backend verifies the ID token and stores the Google profile in `Backend/users.json`.

## Project structure

- `App.js` - application providers, login state, and React Navigation tab navigator
- `src/screens` - tab screen implementations
- `src/context` - shared application state and theme providers
- `src/services` - API integrations

The For You feed requests one restaurant, park, attraction, landmark, museum, shopping, nightlife, and beach per batch from `http://34.201.233.58:3000/fyp`, plus one result for each selected profile interest. Travel style, age, group size, accessibility, language, and transportation preferences are used for an additional recommendation query. When query terms overlap, separate Yelp offsets keep each requested result distinct across pages. Personal names and account identifiers are not sent. Feed pagination uses a zero-based `page` parameter; the search field searches place names or categories through the matching `/search` endpoint. To use a different endpoint, set `EXPO_PUBLIC_FYP_API_URL` in `Frontend/.env.local`; it should end with `/fyp` so the search endpoint can be derived.
