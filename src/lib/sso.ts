const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

/**
 * Generate OTT and redirect to event website via SSO callback
 * ★ ใช้ events.websiteUrl จาก database (ถ้ามี eventId)
 * ★ Default fallback ไป conference-web (main hub)
 * 
 * @param eventId - Event ID to get websiteUrl from (optional)
 * @param redirectPath - Path to redirect after SSO login (default: '/')
 */
export async function ssoRedirectToEventWebsite(
  eventId?: number | null,
  redirectPath: string = '/'
): Promise<void> {
  const token = localStorage.getItem('token');
  const fallbackUrl = window.location.origin; // Stay on conference-web if no token

  if (!token) {
    // ถ้าไม่มี token ให้ redirect ไป login
    window.location.href = '/login';
    return;
  }

  try {
    const url = eventId 
      ? `${API_URL}/auth/sso-token?eventId=${eventId}`
      : `${API_URL}/auth/sso-token`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source-App': 'conference-web',
        'ngrok-skip-browser-warning': 'true',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    const data = await res.json();

    if (data.success && data.ssoToken && data.targetUrl) {
      const redirect = encodeURIComponent(redirectPath);
      window.location.href = `${data.targetUrl}/auth/sso?sso=${data.ssoToken}&redirect=${redirect}`;
      return;
    }
  } catch (error) {
    console.error('Failed to generate SSO token:', error);
  }

  // Fallback: stay on current page
  console.warn('SSO redirect failed, staying on current page');
}

/**
 * Generate OTT and redirect to a specific URL via SSO callback
 * ★ ใช้เมื่อรู้ target URL แน่นอน (ไม่ต้องดึงจาก event)
 */
export async function ssoRedirectTo(
  targetBaseUrl: string,
  redirectPath: string = '/',
  targetApp: string = 'unknown'
): Promise<void> {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = targetBaseUrl + redirectPath;
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/sso-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source-App': 'conference-web',
        'ngrok-skip-browser-warning': 'true',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ targetApp }),
    });

    const data = await res.json();

    if (data.success && data.ssoToken) {
      const redirect = encodeURIComponent(redirectPath);
      // ใช้ targetUrl จาก API ถ้ามี หรือ fallback ไป targetBaseUrl ที่ส่งมา
      const finalUrl = data.targetUrl || targetBaseUrl;
      window.location.href = `${finalUrl}/auth/sso?sso=${data.ssoToken}&redirect=${redirect}`;
      return;
    }
  } catch (error) {
    console.error('Failed to generate SSO token:', error);
  }

  // Fallback: redirect โดยไม่มี SSO
  window.location.href = targetBaseUrl + redirectPath;
}
