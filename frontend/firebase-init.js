import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import {
    getAuth,
    GoogleAuthProvider,
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { env } from './env.js';

const hasConfig = !!(env.FIREBASE_API_KEY && env.FIREBASE_PROJECT_ID && env.FIREBASE_AUTH_DOMAIN);
let app, auth, provider;
if (hasConfig) {
    const firebaseConfig = {
        apiKey: env.FIREBASE_API_KEY,
        authDomain: env.FIREBASE_AUTH_DOMAIN,
        projectId: env.FIREBASE_PROJECT_ID,
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
        appId: env.FIREBASE_APP_ID,
        measurementId: env.FIREBASE_MEASUREMENT_ID
    };
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
} else {
    auth = null;
    provider = null;
}

/**
 * Get a fresh Firebase ID token.
 * Firebase SDK automatically refreshes expired tokens.
 * Returns null if the user is not signed in.
 */
export async function getFreshToken() {
    if (!auth) return localStorage.getItem('accessToken');
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken(/* forceRefresh */ false);
        localStorage.setItem('accessToken', token);
        return token;
    }
    return localStorage.getItem('accessToken');
}

export { app, auth, provider };
export const isFirebaseConfigured = () => !!auth;