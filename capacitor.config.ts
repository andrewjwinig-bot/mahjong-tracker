import type { CapacitorConfig } from '@capacitor/cli';

// Native wrapper config for the App Store / Play Store builds. The web app is
// unchanged — Capacitor loads it in a native shell. See docs/capacitor.md.
//
// This uses the hosted-URL approach (Option A): the shell points at the live
// Vercel deployment, so content updates ship without an app-store review. Set
// CAP_SERVER_URL to your production domain before `npx cap sync`. For an
// offline-first static bundle instead, drop `server` and switch Next to
// `output: 'export'` (Option B in the doc).
//
// First-time setup (run on a Mac with Xcode):
//   npm i -D @capacitor/cli
//   npm i @capacitor/core @capacitor/ios @capacitor/android \
//          @capacitor/status-bar @capacitor/splash-screen @capacitor/app \
//          @capacitor/push-notifications @capacitor/share @capacitor/haptics
//   npx cap add ios && npx cap add android
//   npx cap sync && npx cap open ios

const serverUrl = process.env.CAP_SERVER_URL || 'https://clubmahj.com';

const config: CapacitorConfig = {
  appId: 'com.clubmahj.app',
  appName: 'Club Mahj',
  webDir: 'public',
  server: {
    url: serverUrl,
    cleartext: false,
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#E9F4EC',
  },
  android: {
    backgroundColor: '#E9F4EC',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#E9F4EC',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
