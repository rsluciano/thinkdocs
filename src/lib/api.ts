export async function fetchAPI(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('thinkdocs_token') : null;
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401 && !url.includes('/api/auth/')) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('thinkdocs_token');
      localStorage.removeItem('thinkdocs_user');
      window.location.href = '/login';
    }
  }

  return response;
}
