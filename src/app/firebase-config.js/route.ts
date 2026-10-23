/** Serves Firebase web config for the service worker / legacy consumers as JS. */

type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
};

const FALLBACK_CONFIG: FirebasePublicConfig = {
  apiKey: "AIzaSyCKEa-c2Qm32Bql6R7IeZ7spSEJN4P1cPA",
  authDomain: "camion-21921.firebaseapp.com",
  projectId: "camion-21921",
  storageBucket: "camion-21921.firebasestorage.app",
  messagingSenderId: "577587095942",
  appId: "1:577587095942:web:f53b9af2db17cc9078a407",
  measurementId: "G-ENY3RFKS4L",
};

function buildConfig(): FirebasePublicConfig {
  return {
    apiKey:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? FALLBACK_CONFIG.apiKey,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
      FALLBACK_CONFIG.authDomain,
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
      FALLBACK_CONFIG.projectId,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
      FALLBACK_CONFIG.storageBucket,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
      FALLBACK_CONFIG.messagingSenderId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? FALLBACK_CONFIG.appId,
    measurementId:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ??
      FALLBACK_CONFIG.measurementId,
  };
}

export async function GET(): Promise<Response> {
  try {
    const cfg = buildConfig();
    const body = `self.firebaseConfig = ${JSON.stringify(cfg)};`;
    return new Response(body, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating firebase config:", error);
    const body = `self.firebaseConfig = ${JSON.stringify(FALLBACK_CONFIG)};`;
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
