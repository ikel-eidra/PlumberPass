import type { CapacitorConfig } from '@capacitor/cli';

const liveServerUrl = process.env.CAP_SERVER_URL?.trim();
const useCleartext = process.env.CAP_ANDROID_CLEAR_TEXT === 'true';

const config: CapacitorConfig = {
  appId: 'com.plumberpass.app',
  appName: 'PlumberPass',
  webDir: 'dist',
  ...(liveServerUrl
    ? {
        server: {
          url: liveServerUrl,
          cleartext: useCleartext,
        },
      }
    : {}),
};

export default config;
