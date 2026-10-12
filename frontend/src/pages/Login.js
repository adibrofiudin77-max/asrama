import { useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { UserCog, GraduationCap, Info, ClipboardCheck, Wallet, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth, HOME } from "@/context/AuthContext";
import { errMsg } from "@/lib/api";

export default function Login() {
  const { user, login } = useAuth();
  const [mode, setMode] = useState("staff");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={HOME[user.role]} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(mode, identifier, password);
      toast.success(`Selamat datang, ${u.name}`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally { setBusy(false); }
  };

  const tab = (m, Icon, label) => (
    <button type="button" onClick={() => { setMode(m); setIdentifier(""); }} data-testid={`login-tab-${m}`}
      className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition-colors duration-200 ${mode === m ? "bg-white text-emerald-900 shadow-sm" : "text-slate-500 hover:text-emerald-800"}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-white">
      <div className="relative hidden lg:flex m-4 rounded-3xl bg-emerald-600 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500" />
        <div className="absolute -left-16 -bottom-28 h-96 w-96 rounded-full bg-emerald-700" />
        <div className="relative z-10 flex h-full w-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3 anim-in">
            <img src="/logo.png" alt="Logo Al Hasani" className="h-12 w-12 rounded-full bg-white p-0.5" />
            <span className="font-extrabold tracking-tight text-lg">AL HASANI LIMPUNG</span>
          </div>
          <div className="max-w-lg anim-in-2">
            <img src="/logo.png" alt="Logo Pondok" className="h-36 w-36 mb-8 drop-shadow-xl" data-testid="login-logo" />
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight">Sistem Manajemen Pondok Pesantren Al Hasani</h1>
            <p className="mt-4 text-emerald-50/90">Absensi ngaji, tagihan syariah bulanan, pendaftaran santri, dan kas pondok dalam satu tempat.</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {[[ClipboardCheck, "Absensi"], [Wallet, "Pembayaran"], [Users, "Data Santri"]].map(([I, l]) => (
                <span key={l} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur"><I className="h-3.5 w-3.5" />{l}</span>
              ))}
            </div>
          </div>
          <p className="text-xs text-emerald-50/70">Jl. KH. Wahid Hasyim No. 01 Limpung</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <form onSubmit={submit} className="w-full max-w-md anim-in-3" data-testid="login-form">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src="/logo.png" alt="Logo" className="h-12 w-12" />
            <span className="font-extrabold tracking-tight text-emerald-950">AL HASANI LIMPUNG</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-emerald-950">Masuk</h2>
          <p className="text-sm text-slate-500 mt-1 mb-8">Pilih jenis akun Anda untuk melanjutkan.</p>

          <div className="flex gap-1 rounded-lg bg-slate-200/70 p-1 mb-6">
            {tab("staff", UserCog, "Pengurus / Ustadz")}
            {tab("santri", GraduationCap, "Santri")}
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{mode === "santri" ? "NIS" : "Email"}</Label>
              <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required className="h-11 bg-white"
                type={mode === "santri" ? "text" : "email"} inputMode={mode === "santri" ? "numeric" : undefined}
                placeholder={mode === "santri" ? "Contoh: 260101016" : "nama@alhasani.pengurus"}
                data-testid={mode === "santri" ? "login-nis-input" : "login-email-input"} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 bg-white" data-testid="login-password-input" />
            </div>
            {mode === "santri" && (
              <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800" data-testid="login-santri-hint">
                <Info className="h-4 w-4 shrink-0" /> Password awal santri adalah <b className="mono">111111</b>. Segera ganti setelah masuk.
              </div>
            )}
            <Button type="submit" disabled={busy} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-base rounded-xl" data-testid="login-submit-button">
              {busy ? "Memproses..." : "Masuk"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
