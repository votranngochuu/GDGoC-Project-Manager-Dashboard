import {
     signInWithPopup,
     onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { auth, provider } from './firebase-init.js';
import { env } from './env.js';

// called when the user clicks the sign‑in button
export async function login() {
     const errorEl = document.getElementById('error-msg');
     try {
          const result = await signInWithPopup(auth, provider);
          // Firebase ID token — sent to backend for verification, also used as Bearer token for subsequent requests
          const idToken = await result.user.getIdToken();

          // POST /gdgoc_dashboard/api/auth/login — backend verifies Firebase token and returns UserResponse
          const res = await fetch(`${env.BACKEND_URL}/auth/login`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ idToken }),
          });

          if (!res.ok) {
               const err = await res.json().catch(() => ({}));
               throw new Error(err.message || `Login failed (${res.status})`);
          }

          const data = await res.json();
          // Backend uses Firebase ID token as the Bearer token for all subsequent API calls
          localStorage.setItem('accessToken', idToken);
          localStorage.setItem('role', data.role);
          localStorage.setItem('userId', data.id);
          localStorage.setItem('displayName', data.displayName);
          localStorage.setItem('userEmail', data.email);
          window.location.href = 'dashboard.html';
     } catch (e) {
          if (errorEl) errorEl.textContent = e.message;
          else console.error('Login error:', e.message);
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
          // Refresh token and store it
          const freshToken = await user.getIdToken();
          localStorage.setItem('accessToken', freshToken);

          // Only redirect if NOT already on the dashboard page
          if (!window.location.pathname.includes('dashboard.html')) {
               const role = localStorage.getItem('role');
               if (role) {
                    window.location.href = 'dashboard.html';
               }
          }
     }
});

export function logout() {
     auth.signOut().then(() => {
          localStorage.clear();
          window.location.href = 'index.html';
     });
}
