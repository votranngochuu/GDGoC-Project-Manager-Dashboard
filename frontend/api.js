import { env } from './env.js';

// reusable API helper
const BASE_URL = env.BACKEND_URL; // e.g. 'http://localhost:8080/gdgoc_dashboard/api'

export async function apiRequest(endpoint, method = 'GET', body = null) {
     const token = localStorage.getItem('accessToken');

     try {
          const response = await fetch(BASE_URL + endpoint, {
               method,
               headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token,
               },
               body: body ? JSON.stringify(body) : null,
          });

          if (response.status === 401) {
               // token invalid or expired
               localStorage.clear();
               window.location.href = 'index.html';
               return;
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
