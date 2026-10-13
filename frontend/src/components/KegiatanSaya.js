import { Clock } from "lucide-react";
import { tgl } from "@/lib/api";
import { Card, Empty, StatusBadge } from "@/components/common";

const COLS = [["hadir", "Hadir", "text-green-700"], ["sakit", "Sakit", "text-yellow-700"], ["izin", "Izin", "text-blue-700"], ["alpha", "Alpha", "text-red-700"]];

function KegiatanCard({ g }) {
  return (
    <Card className="p-5" data-testid={`kegiatan-card-${g.id_jadwal}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-emerald-950 truncate">{g.nama_kegiatan}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3" />{g.hari || "-"} {g.waktu ? g.waktu.slice(0, 5) : ""}</p>
        </div>
        <p className="text-2xl font-extrabold leading-none text-emerald-900">{g.total ? `${g.persen}%` : "-"}</p>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-amber-500" style={{ width: `${g.persen || 0}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1 text-center">
        {COLS.map(([k, l, c]) => (
          <div key={k} className="rounded-md bg-slate-50 py-1.5">
            <p className={`text-base font-bold ${c}`} data-testid={`kegiatan-${g.id_jadwal}-${k}`}>{g[k] || 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{l}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        {g.total ? <>Terakhir {tgl(g.terakhir)} <StatusBadge status={g.status_terakhir} /></> : "Belum ada catatan kehadiran"}
      </div>
    </Card>
  );
}

export function KegiatanSaya({ k, jadwal }) {
  const per = new Map(k.per_kegiatan.map((g) => [g.id_jadwal, g]));
  const list = [
    ...jadwal.map((j) => per.get(j.id_jadwal) || { id_jadwal: j.id_jadwal, nama_kegiatan: j.nama_kegiatan, hari: j.hari, waktu: j.waktu, total: 0, persen: 0 }),
    ...k.per_kegiatan.filter((g) => !jadwal.some((j) => j.id_jadwal === g.id_jadwal)),
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" data-testid="santri-portal-attendance-chart">
        <Card className="p-4 col-span-2 sm:col-span-1 bg-emerald-900 text-white border-amber-500/30">
          <p className="text-xs uppercase tracking-wider text-amber-300">Kehadiran</p>
          <p className="text-3xl font-extrabold text-white mono" data-testid="portal-persen-hadir">{k.persen}%</p>
        </Card>
        {COLS.map(([s, l]) => (
          <Card key={s} className="p-4"><p className="text-xs uppercase tracking-wider text-slate-500">{l}</p><p className="text-2xl font-extrabold text-emerald-950" data-testid={`portal-total-${s}`}>{k.summary[s]}</p></Card>
        ))}
      </div>
      <div>
        <h3 className="text-lg font-bold text-emerald-950 mb-3">Rincian per Kegiatan</h3>
        {list.length === 0 ? <Card><Empty text="Belum ada kegiatan" /></Card> : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="portal-kegiatan-grid">
            {list.map((g) => <KegiatanCard key={g.id_jadwal ?? g.nama_kegiatan} g={g} />)}
          </div>
        )}
      </div>
      <Card className="overflow-x-auto">
        <h3 className="text-lg font-bold text-emerald-950 p-6 pb-2">Riwayat Kegiatan</h3>
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
