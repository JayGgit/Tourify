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
