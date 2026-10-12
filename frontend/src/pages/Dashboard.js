import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, UserCheck, Wallet, AlertTriangle, Landmark, Trophy, TrendingDown } from "lucide-react";
import { api, rupiah, tgl, errMsg } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Card, Empty } from "@/components/common";
import { toast } from "sonner";

function Stat({ icon: Icon, label, value, sub, testId, accent = "emerald" }) {
  const c = accent === "amber" ? "bg-amber-100 text-amber-700" : accent === "red" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700";
  return (
    <Card className="p-5 hover:-translate-y-0.5 transition-transform duration-200">
      <div className={`h-9 w-9 rounded-lg grid place-items-center ${c}`}><Icon className="h-4 w-4" /></div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-emerald-950" data-testid={testId}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </Card>
  );
}

function TopList({ title, icon: Icon, items, tone, testId }) {
  const good = tone === "good";
  return (
    <Card className="p-6" data-testid={testId}>
      <div className="flex items-center gap-2 mb-5">
        <Icon className={`h-5 w-5 ${good ? "text-amber-500" : "text-red-500"}`} />
        <h3 className="text-lg font-bold text-emerald-950">{title}</h3>
      </div>
      {items.length === 0 ? <Empty text="Belum ada data kehadiran" /> : (
        <ol className="space-y-4">
          {items.map((s, i) => (
            <li key={s.nis} className="flex items-center gap-4" data-testid={`${testId}-item-${i}`}>
              <span className={`h-8 w-8 shrink-0 rounded-full grid place-items-center text-sm font-bold ${good ? (i === 0 ? "bg-amber-500 text-white" : "bg-emerald-50 text-emerald-800") : "bg-red-50 text-red-700"}`}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <p className="font-semibold text-sm truncate">{s.nama}</p>
                  <p className={`text-sm font-bold mono ${good ? "text-emerald-700" : "text-red-600"}`}>{s.persen}%</p>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${good ? "bg-emerald-600" : "bg-red-500"}`} style={{ width: `${s.persen}%` }} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Kelas {s.kelas} · H {s.hadir} · S {s.sakit} · I {s.izin} · A {s.alpha}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [periode, setPeriode] = useState("bulan");
  const [d, setD] = useState(null);

  useEffect(() => {
    api.get("/dashboard", { params: { periode } }).then((r) => setD(r.data)).catch((e) => toast.error(errMsg(e)));
  }, [periode]);

  if (!d) return <p className="text-slate-500" data-testid="dashboard-loading">Memuat dashboard...</p>;
  const s = d.stats;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Ringkasan pondok · ${tgl(new Date().toISOString())}`}>
        <div className="flex gap-1 rounded-lg bg-slate-200/70 p-1">
          {[["bulan", "Bulan Ini"], ["semua", "Semua Waktu"]].map(([k, l]) => (
            <button key={k} onClick={() => setPeriode(k)} data-testid={`dashboard-periode-${k}`}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${periode === k ? "bg-white text-emerald-900 shadow-sm" : "text-slate-500"}`}>{l}</button>
          ))}
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 anim-in-2">
        <Stat icon={Users} label="Santri Aktif" value={s.total_santri} sub={`Putra ${s.putra} · Putri ${s.putri}`} testId="dashboard-stat-total-santri" />
        <Stat icon={UserCheck} label="Hadir Hari Ini" value={s.hadir_hari_ini} sub={`${s.jumlah_jadwal} jadwal ngaji`} testId="dashboard-stat-kehadiran" />
        <Stat icon={Wallet} label="Pembayaran Bulan Ini" value={rupiah(s.pemasukan_bulan_ini)} testId="dashboard-stat-pemasukan" accent="amber" />
        <Stat icon={AlertTriangle} label="Santri Menunggak" value={s.santri_menunggak} sub={rupiah(s.total_tunggakan)} testId="dashboard-stat-menunggak" accent="red" />
        {user.role === "admin" && <Stat icon={Landmark} label="Saldo Kas" value={rupiah(s.saldo_kas)} testId="dashboard-stat-saldo" />}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8 anim-in-3">
        <TopList title="Top 5 Santri Terajin" icon={Trophy} items={d.top_rajin} tone="good" testId="dashboard-top-rajin-card" />
        <TopList title="Top 5 Santri Termalas" icon={TrendingDown} items={d.top_malas} tone="bad" testId="dashboard-top-malas-card" />
      </div>

      <Card className="p-6 mt-8 anim-in-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-emerald-950">Pembayaran Terbaru</h3>
          <Link to="/pembayaran" className="text-sm font-semibold text-emerald-700 hover:underline" data-testid="dashboard-goto-pembayaran">Lihat semua</Link>
        </div>
        {d.pembayaran_terbaru.length === 0 ? <Empty /> : (
          <div className="divide-y divide-slate-100">
            {d.pembayaran_terbaru.map((p) => (
              <div key={p.id_pembayaran} className="flex justify-between py-3 text-sm">
                <div>
                  <p className="font-semibold">{p.nama}</p>
                  <p className="text-xs text-slate-500">{p.jenis_pembayaran === "syariah" ? `Syariah ${p.bulan_tagihan} ${p.tahun_tagihan}` : "Pendaftaran"} · {tgl(p.tanggal_bayar)}</p>
                </div>
                <p className="font-bold mono text-emerald-800">{rupiah(p.nominal)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
