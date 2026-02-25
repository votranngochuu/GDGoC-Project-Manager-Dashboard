import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import {
     getAuth,
     GoogleAuthProvider,
     signInWithPopup,
     onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { apiRequest } from './api.js';

/*
  Replace the following config with your own Firebase project settings.
  Copy from the Firebase console under project settings > General.
*/
const firebaseConfig = {
     apiKey: 'YOUR_API_KEY',
     authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
     projectId: 'YOUR_PROJECT_ID',
     storageBucket: 'YOUR_PROJECT_ID.appspot.com',
     messagingSenderId: '...',
     appId: '...',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// called when the user clicks the sign‑in button
export async function login() {
     try {
          const result = await signInWithPopup(auth, provider);
          // the ID token from Google; send it to our backend for verification
          const idToken = await result.user.getIdToken();

          // backend endpoint should verify firebase token and return accessToken + role
          const res = await fetch('http://localhost:8080/api/auth/google', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ idToken }),
          });

          if (!res.ok) {
               const err = await res.json();
               throw new Error(err.message || 'Login failed');
          }

          const data = await res.json();
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('role', data.role);
          window.location.href = 'dashboard.html';
     } catch (e) {
          document.getElementById('error').textContent = e.message;
     }
}

// attach handler for the google button
const signInButton = document.getElementById('google-signin');
if (signInButton) {
     signInButton.addEventListener('click', login);
}

// optional: react to auth state changes automatically
onAuthStateChanged(auth, async (user) => {
     if (user) {
          // user already logged in, maybe redirect
          const role = localStorage.getItem('role');
          if (role) {
               window.location.href = 'dashboard.html';
          }
     }
});

export function logout() {
     auth.signOut().then(() => {
          localStorage.clear();
          window.location.href = 'index.html';
     });
}
