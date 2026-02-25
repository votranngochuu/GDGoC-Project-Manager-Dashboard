// reusable API helper
const BASE_URL = 'http://localhost:8080/api'; // adjust to your backend endpoint

export async function apiRequest(endpoint, method = 'GET', body = null) {
     const token = localStorage.getItem('accessToken');

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

     return response.json();
}
