import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, errMsg, rupiah, tgl, HARI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, Empty, StatusBadge } from "@/components/common";
import { PendaftaranCard, TagihanGrid, RiwayatTable } from "@/components/Tagihan";

function Kehadiran({ k }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" data-testid="santri-portal-attendance-chart">
        <Card className="p-4 col-span-2 sm:col-span-1 bg-emerald-950 text-white border-emerald-900">
          <p className="text-xs uppercase tracking-wider text-emerald-300">Kehadiran</p>
          <p className="text-3xl font-extrabold text-amber-300 mono" data-testid="portal-persen-hadir">{k.persen}%</p>
        </Card>
        {["hadir", "sakit", "izin", "alpha"].map((s) => (
          <Card key={s} className="p-4"><p className="text-xs uppercase tracking-wider text-slate-500 capitalize">{s}</p><p className="text-2xl font-extrabold text-emerald-950">{k.summary[s]}</p></Card>
        ))}
      </div>
      <Card className="overflow-x-auto">
        {k.items.length === 0 ? <Empty text="Belum ada catatan kehadiran" /> : (
          <table className="w-full text-sm" data-testid="portal-kehadiran-table">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Kegiatan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Keterangan</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {k.items.map((i) => (
                <tr key={i.id_kehadiran}><td className="px-4 py-2.5 whitespace-nowrap">{tgl(i.tanggal)}</td><td className="px-4 py-2.5">{i.nama_kegiatan || "Ngaji"}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={i.status} /></td><td className="px-4 py-2.5 text-slate-500">{i.keterangan || "-"}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export default function Portal() {
  const { user } = useAuth();
  const [t, setT] = useState(null);
  const [jadwal, setJadwal] = useState([]);
  const [k, setK] = useState(null);

  useEffect(() => {
    api.get(`/tagihan/${user.nis}`).then((r) => setT(r.data)).catch((e) => toast.error(errMsg(e)));
    api.get("/jadwal").then((r) => setJadwal(r.data));
    api.get("/kehadiran/saya").then((r) => setK(r.data));
  }, [user.nis]);

  if (!t || !k) return <p className="text-slate-500">Memuat...</p>;
  const s = t.santri;

  return (
    <div>
      <Card className="p-6 sm:p-8 mb-8 bg-emerald-950 text-white border-emerald-900 islamic-pattern anim-in">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Assalamu'alaikum</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1" data-testid="portal-santri-nama">{s.nama}</h1>
        <p className="text-sm text-emerald-200 mt-2">NIS {s.nis} · Kelas {s.kelas} · Kamar {s.nama_kamar || "-"} · Terdaftar {tgl(s.tanggal_daftar)}</p>
        <div className="mt-6 flex flex-wrap gap-8">
          <div><p className="text-xs uppercase tracking-wider text-emerald-300">Total Tagihan</p><p className="text-2xl font-extrabold text-amber-300 mono" data-testid="portal-total-tunggakan">{rupiah(t.total_tunggakan)}</p></div>
          <div><p className="text-xs uppercase tracking-wider text-emerald-300">Kehadiran Ngaji</p><p className="text-2xl font-extrabold mono">{k.persen}%</p></div>
        </div>
      </Card>

      <Tabs defaultValue="tagihan">
        <TabsList className="mb-6">
          <TabsTrigger value="tagihan" data-testid="portal-tab-tagihan">Tagihan</TabsTrigger>
          <TabsTrigger value="jadwal" data-testid="portal-tab-jadwal">Jadwal Ngaji</TabsTrigger>
          <TabsTrigger value="kehadiran" data-testid="portal-tab-kehadiran">Kehadiran</TabsTrigger>
        </TabsList>
        <TabsContent value="tagihan" className="space-y-6" data-testid="santri-portal-bills-card">
          <PendaftaranCard p={t.pendaftaran} />
          <Card className="p-6"><h3 className="text-lg font-bold text-emerald-950 mb-4">Syariah Bulanan</h3><TagihanGrid months={t.bulanan} /></Card>
          <Card><h3 className="text-lg font-bold text-emerald-950 p-6 pb-2">Riwayat Pembayaran</h3>{t.pembayaran.length ? <RiwayatTable items={t.pembayaran} /> : <Empty />}</Card>
        </TabsContent>
        <TabsContent value="jadwal">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="santri-portal-schedule-list">
            {HARI.filter((h) => jadwal.some((j) => j.hari === h)).map((h) => (
              <Card key={h} className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">{h}</p>
                {jadwal.filter((j) => j.hari === h).map((j) => (
                  <div key={j.id_jadwal} className="mb-3 last:mb-0"><p className="font-semibold text-sm">{j.nama_kegiatan}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3" />{j.waktu.slice(0, 5)} · {j.nama_ustadz || "-"}</p></div>
                ))}
              </Card>
            ))}
          </div>
          {jadwal.length === 0 && <Empty />}
        </TabsContent>
        <TabsContent value="kehadiran"><Kehadiran k={k} /></TabsContent>
      </Tabs>
    </div>
  );
}
