export function parseJwt(token: string): Record<string, any> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload) return true;
  return payload.exp * 1000 < Date.now();
}

export function getRoleFromToken(token: string): string {
  const payload = parseJwt(token);
  if (!payload) return "";
  return (
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    payload.role ||
    ""
  );
}

export function getNameFromToken(token: string): string {
  const payload = parseJwt(token);
  if (!payload) return "";
  return payload.fullName || payload.email || "";
}

export function getUserIdFromToken(token: string): string {
  const payload = parseJwt(token);
  if (!payload) return "";
  // JWT sub claim holds the user's numeric ID
  return String(payload.sub || payload.userId || "");
}
