import {
     signInWithPopup,
     onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { auth, provider, isFirebaseConfigured } from './firebase-init.js';
import { env } from './env.js';

// called when the user clicks the sign‑in button
export async function login() {
     const errorEl = document.getElementById('error-msg');
     try {
          if (!isFirebaseConfigured() || !env.FIREBASE_API_KEY?.trim() || !env.FIREBASE_PROJECT_ID?.trim()) {
               const msg = 'Firebase chưa được cấu hình. Vui lòng thêm app.frontend.firebase trong application.yml (api-key, project-id, auth-domain...) và đặt file firebase-service-account.json vào src/main/resources. Xem README để biết chi tiết.';
               if (errorEl) errorEl.textContent = msg;
               else console.warn(msg);
               return;
          }
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
          let msg = e.message || String(e);
          if (msg.includes('auth/') || msg.includes('Firebase') || msg.includes('invalid-api-key') || msg.includes('network')) {
               msg = 'Đăng nhập Google thất bại. Kiểm tra: (1) Đã cấu hình Firebase trong application.yml (app.frontend.firebase) chưa? (2) Đã đặt file firebase-service-account.json vào src/main/resources chưa? (3) Trong Firebase Console đã bật Authentication → Google Sign-In chưa?';
          }
          if (errorEl) errorEl.textContent = msg;
          else console.error('Login error:', msg);
     }
}

// attach handler for the google button
const signInButton = document.getElementById('google-signin');
if (signInButton) {
     signInButton.addEventListener('click', login);
}

// Hiển thị gợi ý ngay khi trang load nếu Firebase chưa cấu hình
const hintEl = document.getElementById('firebase-hint');
if (hintEl && !isFirebaseConfigured()) {
     hintEl.style.display = 'block';
     hintEl.textContent = 'Đăng nhập Google chưa cấu hình. Thêm app.frontend.firebase trong application.yml và firebase-service-account.json (xem README).';
     hintEl.style.marginTop = '12px';
     hintEl.style.fontSize = '13px';
     hintEl.style.color = '#666';
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
     if (!auth) return;
     auth.signOut().then(() => {
          localStorage.clear();
          window.location.href = 'index.html';
     });
}
