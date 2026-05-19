import { createContext, useState } from "react";
import type { ReactNode } from "react";
import { parseJwt, isTokenExpired, getRoleFromToken, getNameFromToken, getUserIdFromToken } from "../utils/jwt";
import { API } from "../utils/api";

interface User {
  token: string;
  role: string;
  name: string;
  email: string;
  userId: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
loginWithResponse: (data: { token: string; userId: string | number; role: string; fullName: string; email: string }) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
loginWithResponse: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem("reviio_token");
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("reviio_token");
      return null;
    }
    const payload = parseJwt(token);
    return {
      token,
      role: getRoleFromToken(token),
      name: getNameFromToken(token),
      email: payload?.email || "",
      userId: getUserIdFromToken(token),
    };
  });

  const login = (token: string) => {
    localStorage.setItem("reviio_token", token);
    const payload = parseJwt(token);
    setUser({
      token,
      role: getRoleFromToken(token),
      name: getNameFromToken(token),
      email: payload?.email || "",
      userId: getUserIdFromToken(token),
    });
  };

  const loginWithResponse = async (data: { token: string; userId: string | number; role: string; fullName: string; email: string }) => {
  localStorage.setItem("reviio_token", data.token);
  localStorage.setItem("reviio_userId", String(data.userId));

  if (data.role === "Customer") {
    try {
      const r = await fetch(`${API}/customer/by-user/${data.userId}`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      if (r.ok) {
        const customer = await r.json();
        localStorage.setItem("reviio_customerId", String(customer.id));
      }
    } catch { /* silent */ }
  }

  setUser({
    token: data.token,
    role: data.role,
    name: data.fullName,
    email: data.email,
    userId: String(data.userId),
  });
};

  const logout = () => {
    localStorage.removeItem("reviio_token");
    localStorage.removeItem("reviio_customerId");
    localStorage.removeItem("reviio_userId");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithResponse, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
