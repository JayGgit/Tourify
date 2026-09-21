# Tourify Mobile

Tourify is a mobile Expo app using React Navigation for its tab navigation. The application entry point is `App.js`; it does not use Expo Router or file-based routing.

## Get started

Install dependencies and start Expo:

```bash
npm install
npm start
```

Use the Expo CLI prompts to open the app on a development build, Android emulator, or iOS simulator.

## Project structure

- `App.js` - application providers, login state, and React Navigation tab navigator
- `src/screens` - tab screen implementations
- `src/context` - shared application state and theme providers
- `src/services` - API integrations

The For You feed loads recommendations from `http://34.201.233.58:3000/fyp`. Its `query` parameter is generated automatically from the profile interests and preferences; users do not enter it. To use a different endpoint, set `EXPO_PUBLIC_FYP_API_URL` in `Frontend/.env.local`.
