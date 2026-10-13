import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth, HOME } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Santri from "@/pages/Santri";
import Pembayaran from "@/pages/Pembayaran";
import Kwitansi from "@/pages/Kwitansi";
import Absensi from "@/pages/Absensi";
import Jadwal from "@/pages/Jadwal";
import KenaikanKelas from "@/pages/KenaikanKelas";
import Keuangan from "@/pages/Keuangan";
import Master from "@/pages/Master";
import Pengguna from "@/pages/Pengguna";
import Portal from "@/pages/Portal";
import "@/App.css";

function Guard({ roles, children }) {
  const { user } = useAuth();
  if (user === null) return <div className="min-h-screen grid place-items-center text-emerald-800" data-testid="app-loading">Memuat...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={HOME[user.role]} replace />;
  return children;
}

function Root() {
  const { user } = useAuth();
  return <Navigate to={user ? HOME[user.role] : "/login"} replace />;
}

const A = ["admin"], S = ["admin", "pengurus"];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/kwitansi/:id" element={<Guard roles={["admin", "pengurus", "santri"]}><Kwitansi /></Guard>} />
          <Route element={<Guard><Layout /></Guard>}>
            <Route index element={<Root />} />
            <Route path="dashboard" element={<Guard roles={S}><Dashboard /></Guard>} />
            <Route path="santri" element={<Guard roles={S}><Santri /></Guard>} />
            <Route path="pembayaran" element={<Guard roles={S}><Pembayaran /></Guard>} />
            <Route path="absensi" element={<Guard roles={["admin", "pengurus", "ustadz"]}><Absensi /></Guard>} />
            <Route path="jadwal" element={<Guard roles={S}><Jadwal /></Guard>} />
            <Route path="kenaikan-kelas" element={<Guard roles={A}><KenaikanKelas /></Guard>} />
            <Route path="keuangan" element={<Guard roles={A}><Keuangan /></Guard>} />
            <Route path="master" element={<Guard roles={A}><Master /></Guard>} />
            <Route path="pengguna" element={<Guard roles={A}><Pengguna /></Guard>} />
            <Route path="portal" element={<Guard roles={["santri"]}><Portal /></Guard>} />
          </Route>
          <Route path="*" element={<Root />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
