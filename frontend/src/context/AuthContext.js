import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("alh_token")) { setUser(false); return; }
    api.get("/auth/me").then((r) => setUser(r.data)).catch(() => setUser(false));
  }, []);

  const login = async (mode, identifier, password) => {
    const { data } = await api.post("/auth/login", { mode, identifier, password });
    localStorage.setItem("alh_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => { localStorage.removeItem("alh_token"); setUser(false); };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
export const HOME = { admin: "/dashboard", pengurus: "/dashboard", ustadz: "/absensi", santri: "/portal" };
