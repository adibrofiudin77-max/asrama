import { useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Moon, UserCog, GraduationCap, Info } from "lucide-react";
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
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-slate-50">
      <div className="relative hidden lg:block overflow-hidden">
        <img src="/login-bg.jpg" alt="Masjid" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-emerald-950/80" />
        <div className="absolute inset-0 islamic-pattern opacity-60" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3 anim-in">
            <div className="h-11 w-11 rounded-lg bg-amber-500 text-emerald-950 grid place-items-center"><Moon className="h-5 w-5" /></div>
            <span className="font-extrabold tracking-tight text-lg">AL-HASANI LIMPUNG</span>
          </div>
          <div className="max-w-lg anim-in-2">
            <p className="font-['Amiri'] text-4xl text-amber-300 mb-6" dir="rtl">طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ</p>
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight">Sistem Manajemen Pondok Pesantren Alhasani</h1>
            <p className="mt-4 text-emerald-100/80">Absensi ngaji, tagihan syariah bulanan, pendaftaran santri, dan kas pondok dalam satu tempat.</p>
          </div>
          <p className="text-xs text-emerald-200/60">Jl. KH. Wahid Hasyim No. 01 Limpung</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <form onSubmit={submit} className="w-full max-w-md anim-in-3" data-testid="login-form">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-lg bg-emerald-900 text-amber-400 grid place-items-center"><Moon className="h-5 w-5" /></div>
            <span className="font-extrabold tracking-tight text-emerald-950">AL-HASANI LIMPUNG</span>
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
            <Button type="submit" disabled={busy} className="w-full h-11 bg-emerald-800 hover:bg-emerald-900 text-base" data-testid="login-submit-button">
              {busy ? "Memproses..." : "Masuk"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
