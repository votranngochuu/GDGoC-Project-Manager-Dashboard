import { env } from './env.js';
import { getFreshToken } from './firebase-init.js';

// reusable API helper
const BASE_URL = env.BACKEND_URL; // e.g. 'http://localhost:8080/gdgoc_dashboard/api'

export async function apiRequest(endpoint, method = 'GET', body = null) {
     // Get a fresh token from Firebase (auto-refreshes if expired)
     const token = await getFreshToken();

     if (!token) {
          localStorage.clear();
          window.location.href = 'index.html';
          return;
     }

     try {
          const options = {
               method,
               headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token,
               }
          };

          if (body && method !== 'GET') {
               options.body = JSON.stringify(body);
          }

          const response = await fetch(BASE_URL + endpoint, options);

          if (!response.ok && response.status !== 401 && response.status !== 403) {
               const text = await response.text();
               let errorMsg = "API Error";
               try {
                    const errJson = JSON.parse(text);
                    errorMsg = errJson.message || errJson.error || text;
               } catch (e) {
                    errorMsg = text || response.statusText;
               }
               throw new Error(errorMsg);
          }

          if (response.status === 401 || response.status === 403) {
               // Try once more with a force-refreshed token
               const { auth } = await import('./firebase-init.js');
               const user = auth.currentUser;
               if (user) {
                    const freshToken = await user.getIdToken(/* forceRefresh */ true);
                    localStorage.setItem('accessToken', freshToken);
                    options.headers.Authorization = 'Bearer ' + freshToken;
                    const retryResponse = await fetch(BASE_URL + endpoint, options);

                    if (!retryResponse.ok) {
                         const text = await retryResponse.text();
                         let errorMsg = "API Error after retry";
                         try {
                              const errJson = JSON.parse(text);
                              errorMsg = errJson.message || errJson.error || text;
                         } catch (e) {
                              errorMsg = text || retryResponse.statusText;
                         }
                         throw new Error(errorMsg);
                    }

                    if (retryResponse.status === 401 || retryResponse.status === 403) {
                         console.error('Still unauthorized after token refresh, status:', retryResponse.status);
                         // Don't redirect on 403 - might be a permissions issue, not auth
                         if (retryResponse.status === 401) {
                              localStorage.clear();
                              window.location.href = 'index.html';
                              return;
                         }
                    }

                    const text = await retryResponse.text();
                    try {
                         return text ? JSON.parse(text) : null;
                    } catch (e) {
                         console.error("Failed to parse JSON:", text);
                         throw new Error("Invalid JSON response from server");
                    }
               } else {
                    // No Firebase user - redirect to login
                    localStorage.clear();
                    window.location.href = 'index.html';
                    return;
               }
          }

          const text = await response.text();
          try {
               return text ? JSON.parse(text) : null;
          } catch (e) {
               console.error("Failed to parse JSON:", text);
               throw new Error("Invalid JSON response from server");
          }
     } catch (error) {
          console.error("API Request Failed:", {
               url: BASE_URL + endpoint,
               method,
               error: error.message
          });
          throw error;
     }
}
