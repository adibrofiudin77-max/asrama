import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { toast } from "sonner";
import { LayoutDashboard, Users, Wallet, ClipboardCheck, CalendarClock, GraduationCap, Landmark, BedDouble, ShieldCheck, Home, LogOut, KeyRound, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, ROLE_LABEL } from "@/lib/api";
import { FormDialog } from "@/components/FormDialog";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "pengurus"] },
  { to: "/santri", label: "Data Santri", icon: Users, roles: ["admin", "pengurus"] },
  { to: "/pembayaran", label: "Pembayaran", icon: Wallet, roles: ["admin", "pengurus"] },
  { to: "/absensi", label: "Absensi Ngaji", icon: ClipboardCheck, roles: ["admin", "pengurus", "ustadz"] },
  { to: "/jadwal", label: "Jadwal Ngaji", icon: CalendarClock, roles: ["admin", "pengurus"] },
  { to: "/kenaikan-kelas", label: "Kenaikan Kelas", icon: GraduationCap, roles: ["admin"] },
  { to: "/keuangan", label: "Keuangan", icon: Landmark, roles: ["admin"] },
  { to: "/master", label: "Kamar & Ustadz", icon: BedDouble, roles: ["admin"] },
  { to: "/pengguna", label: "Pengguna", icon: ShieldCheck, roles: ["admin"] },
  { to: "/portal", label: "Beranda Santri", icon: Home, roles: ["santri"] },
];

const PW_FIELDS = [
  { name: "old_password", label: "Password Lama", type: "password", required: true, full: true },
  { name: "new_password", label: "Password Baru (min. 6 karakter)", type: "password", required: true, full: true },
];

function Sidebar({ user, onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-white border-r border-slate-200/80 text-slate-700">
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo Al Hasani" className="h-11 w-11" data-testid="sidebar-logo" />
          <div>
            <p className="font-extrabold tracking-tight leading-tight text-emerald-900">AL HASANI</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Limpung · Batang</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
          <NavLink key={n.to} to={n.to} onClick={onNavigate} data-testid={`nav-${n.to.slice(1)}`}
            className={({ isActive }) => `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${isActive ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30" : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"}`}>
            <n.icon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 rounded-xl bg-emerald-50 p-4 text-xs text-emerald-700">
        <p className="font-semibold text-emerald-950 text-sm truncate" data-testid="sidebar-user-name">{user.name}</p>
        <p data-testid="sidebar-user-role">{ROLE_LABEL[user.role]}</p>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [mobile, setMobile] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/70">
      <aside className="no-print hidden lg:block fixed inset-y-0 left-0 w-64 z-30"><Sidebar user={user} /></aside>
      {mobile && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobile(false)} />
          <div className="absolute inset-y-0 left-0 w-64"><Sidebar user={user} onNavigate={() => setMobile(false)} /></div>
        </div>
      )}
      <div className="lg:pl-64 print:pl-0">
        <header className="no-print sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
          <div className="flex h-16 items-center justify-between px-4 sm:px-8">
            <button className="lg:hidden p-2 rounded-md hover:bg-slate-100" onClick={() => setMobile(!mobile)} data-testid="mobile-menu-btn">
              {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <p className="hidden sm:block text-sm text-slate-500">Assalamu'alaikum, <span className="font-semibold text-emerald-900">{user.name}</span></p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPwOpen(true)} data-testid="change-password-btn" className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                <KeyRound className="h-4 w-4" /> <span className="hidden sm:inline">Ganti Password</span>
              </button>
              <button onClick={logout} data-testid="logout-btn" className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </header>
        <main className="px-4 py-8 sm:px-8 lg:px-10 max-w-[1400px] print:p-0"><Outlet /></main>
      </div>
      <FormDialog open={pwOpen} onOpenChange={setPwOpen} title="Ganti Password" fields={PW_FIELDS} testId="change-pw"
        onSubmit={async (v) => { await api.post("/auth/change-password", v); toast.success("Password berhasil diganti"); }} />
    </div>
  );
}
