import { useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { UserCog, GraduationCap, Info } from "lucide-react";
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-900 p-6">
      <div className="text-center mb-8 anim-in">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Sistem Manajemen</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Pondok Pesantren Al Hasani</h1>
        <p className="mt-1 text-sm text-emerald-100/80">Limpung · Batang</p>
      </div>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl shadow-black/20 anim-in-2">
        <form onSubmit={submit} data-testid="login-form">
          <h2 className="text-2xl font-extrabold tracking-tight text-emerald-950">Masuk</h2>
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
            <Button type="submit" disabled={busy} className="w-full h-11 bg-emerald-800 hover:bg-emerald-900 text-base rounded-xl" data-testid="login-submit-button">
              {busy ? "Memproses..." : "Masuk"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
