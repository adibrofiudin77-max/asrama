import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, errMsg, rupiah, tgl, HARI, kelasLabel } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, Empty } from "@/components/common";
import { PendaftaranCard, TagihanGrid, RiwayatTable } from "@/components/Tagihan";
import { KegiatanSaya } from "@/components/KegiatanSaya";
import { IzinSantri } from "@/components/IzinSantri";

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
      <Card className="lux-dark relative overflow-hidden p-6 sm:p-8 mb-8 text-white border-amber-500/30 anim-in">
        <img src="/logo.png" alt="" className="absolute -right-6 -bottom-8 h-48 w-48 opacity-10 pointer-events-none" />
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300/90">Assalamu'alaikum</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight mt-1 text-gold" data-testid="portal-santri-nama">{s.nama}</h1>
        <p className="text-sm text-emerald-50 mt-2">NIS {s.nis} · Kelas {kelasLabel(s)} · Kamar {s.nama_kamar || "-"} · Terdaftar {tgl(s.tanggal_daftar)}</p>
        <div className="mt-6 flex flex-wrap gap-8">
          <div><p className="text-xs uppercase tracking-wider text-emerald-100">Total Tagihan</p><p className="text-2xl font-extrabold text-white mono" data-testid="portal-total-tunggakan">{rupiah(t.total_tunggakan)}</p></div>
          <div><p className="text-xs uppercase tracking-wider text-emerald-100">Kehadiran Ngaji</p><p className="text-2xl font-extrabold mono">{k.persen}%</p></div>
        </div>
      </Card>

      <Tabs defaultValue="kehadiran">
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="kehadiran" data-testid="portal-tab-kehadiran">Kegiatan & Kehadiran</TabsTrigger>
          <TabsTrigger value="tagihan" data-testid="portal-tab-tagihan">Tagihan</TabsTrigger>
          <TabsTrigger value="jadwal" data-testid="portal-tab-jadwal">Jadwal Ngaji</TabsTrigger>
          <TabsTrigger value="izin" data-testid="portal-tab-izin">Izin Pulang</TabsTrigger>
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
        <TabsContent value="kehadiran"><KegiatanSaya k={k} jadwal={jadwal} /></TabsContent>
        <TabsContent value="izin"><IzinSantri /></TabsContent>
      </Tabs>
    </div>
  );
}
