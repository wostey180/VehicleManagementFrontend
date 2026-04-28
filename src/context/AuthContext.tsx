import { createContext, useState } from "react";
import type { ReactNode } from "react";
import { parseJwt, isTokenExpired, getRoleFromToken, getNameFromToken } from "../utils/jwt";

interface User {
  token: string;
  role: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
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
    });
  };

  const logout = () => {
    localStorage.removeItem("reviio_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
