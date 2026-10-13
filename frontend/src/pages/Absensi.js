import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Save, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, errMsg, todayStr, firstOfMonthStr, kelasLabel } from "@/lib/api";
import { PageHeader, Card, Empty } from "@/components/common";
import { NativeSelect } from "@/components/FormDialog";

const ST = [
  { k: "hadir", l: "H", on: "bg-green-600 text-white border-green-600" },
  { k: "sakit", l: "S", on: "bg-yellow-500 text-white border-yellow-500" },
  { k: "izin", l: "I", on: "bg-blue-600 text-white border-blue-600" },
  { k: "alpha", l: "A", on: "bg-red-600 text-white border-red-600" },
];
const HARI_JS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function InputAbsensi({ jadwal }) {
  const [tanggal, setTanggal] = useState(todayStr());
  const [idJadwal, setIdJadwal] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const hari = HARI_JS[new Date(`${tanggal}T00:00:00`).getDay()];

  const opts = useMemo(() => [...jadwal].sort((a, b) => (b.hari === hari) - (a.hari === hari))
    .map((j) => ({ value: j.id_jadwal, label: `${j.hari === hari ? "● " : ""}${j.nama_kegiatan} — ${j.hari} ${j.waktu.slice(0, 5)}` })), [jadwal, hari]);

  useEffect(() => {
    if (!idJadwal) { setRows([]); return; }
    api.get("/absensi", { params: { tanggal, id_jadwal: idJadwal } }).then((r) => setRows(r.data)).catch((e) => toast.error(errMsg(e)));
  }, [tanggal, idJadwal]);

  const setS = (nis, k, v) => setRows((p) => p.map((r) => (r.nis === nis ? { ...r, [k]: v } : r)));
  const counts = ST.map((s) => rows.filter((r) => r.status === s.k).length);

  const save = async () => {
    const items = rows.filter((r) => r.status).map((r) => ({ nis: r.nis, status: r.status, keterangan: r.keterangan }));
    if (!items.length) return toast.error("Belum ada status yang dipilih");
    setBusy(true);
    try { await api.post("/absensi", { tanggal, id_jadwal: Number(idJadwal), items }); toast.success(`Absensi ${items.length} santri tersimpan`); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <>
      <Card className="p-4 mb-6 grid sm:grid-cols-[180px_1fr_auto] gap-3 items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Tanggal ({hari})</p>
          <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} data-testid="absensi-date-picker" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Jadwal / Kegiatan</p>
          <NativeSelect value={idJadwal} onChange={(e) => setIdJadwal(e.target.value)} placeholder="- Pilih jadwal ngaji -" options={opts} data-testid="absensi-jadwal-select" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!rows.length} onClick={() => setRows((p) => p.map((r) => ({ ...r, status: "hadir" })))} data-testid="absensi-all-hadir-btn"><CheckCheck className="h-4 w-4 mr-1" /> Semua Hadir</Button>
          <Button disabled={!rows.length || busy} onClick={save} className="bg-emerald-800 hover:bg-emerald-900" data-testid="absensi-save-btn"><Save className="h-4 w-4 mr-1" /> {busy ? "Menyimpan..." : "Simpan"}</Button>
        </div>
      </Card>
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 text-xs font-semibold" data-testid="absensi-summary">
          {ST.map((s, i) => <span key={s.k} className={`rounded-full px-3 py-1 border ${s.on}`}>{s.k} {counts[i]}</span>)}
          <span className="rounded-full px-3 py-1 border bg-white text-slate-600">belum diisi {rows.filter((r) => !r.status).length}</span>
        </div>
      )}
      <Card className="overflow-x-auto">
        {!idJadwal ? <Empty text="Pilih tanggal & jadwal untuk mulai absensi" /> : (
          <table className="w-full text-sm" data-testid="absensi-matrix-table">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Santri</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Keterangan</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr key={r.nis} data-testid={`absensi-row-${r.nis}`}>
                  <td className="px-4 py-2.5 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-2.5"><p className="font-semibold">{r.nama}</p><p className="text-xs text-slate-500">{r.nis} · {r.jenis_kelamin} · Kelas {kelasLabel(r)}</p></td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      {ST.map((s) => (
                        <button key={s.k} title={s.k} onClick={() => setS(r.nis, "status", s.k)} data-testid={`absensi-${s.k}-${r.nis}`}
                          className={`h-8 w-8 rounded-md border text-xs font-bold transition-colors ${r.status === s.k ? s.on : "bg-white text-slate-500 hover:border-slate-400"}`}>{s.l}</button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><Input className="h-8 min-w-[140px]" value={r.keterangan || ""} onChange={(e) => setS(r.nis, "keterangan", e.target.value)} data-testid={`absensi-ket-${r.nis}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {idJadwal && rows.length === 0 && <Empty text="Tidak ada santri aktif" />}
      </Card>
    </>
  );
}

function Rekap() {
  const [dari, setDari] = useState(firstOfMonthStr());
  const [sampai, setSampai] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const load = useCallback(() => api.get("/absensi/rekap", { params: { dari, sampai } }).then((r) => setRows(r.data)).catch((e) => toast.error(errMsg(e))), [dari, sampai]);
  useEffect(() => { load(); }, [load]);
  return (
    <>
      <Card className="p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div><p className="text-xs font-semibold text-slate-500 mb-1">DARI</p><Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} data-testid="rekap-dari" /></div>
        <div><p className="text-xs font-semibold text-slate-500 mb-1">SAMPAI</p><Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} data-testid="rekap-sampai" /></div>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="rekap-table">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr><th className="px-4 py-3">Santri</th><th className="px-4 py-3">Kelas</th><th className="px-4 py-3 text-center">Hadir</th><th className="px-4 py-3 text-center">Sakit</th><th className="px-4 py-3 text-center">Izin</th><th className="px-4 py-3 text-center">Alpha</th><th className="px-4 py-3 text-right">% Hadir</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.nis}>
                <td className="px-4 py-2.5 font-semibold">{r.nama}</td><td className="px-4 py-2.5 whitespace-nowrap">{kelasLabel(r)}</td>
                <td className="px-4 py-2.5 text-center text-green-700">{r.hadir}</td><td className="px-4 py-2.5 text-center text-yellow-700">{r.sakit}</td>
                <td className="px-4 py-2.5 text-center text-blue-700">{r.izin}</td><td className="px-4 py-2.5 text-center text-red-700">{r.alpha}</td>
                <td className="px-4 py-2.5 text-right font-bold mono">{r.total ? `${r.persen}%` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

export default function Absensi() {
  const [jadwal, setJadwal] = useState([]);
  useEffect(() => { api.get("/jadwal").then((r) => setJadwal(r.data)).catch((e) => toast.error(errMsg(e))); }, []);
  return (
    <div>
      <PageHeader title="Absensi Ngaji" subtitle="Dicatat per jadwal kegiatan per tanggal" />
      <Tabs defaultValue="input">
        <TabsList className="mb-6"><TabsTrigger value="input" data-testid="absensi-tab-input">Input Absensi</TabsTrigger><TabsTrigger value="rekap" data-testid="absensi-tab-rekap">Rekap Kehadiran</TabsTrigger></TabsList>
        <TabsContent value="input"><InputAbsensi jadwal={jadwal} /></TabsContent>
        <TabsContent value="rekap"><Rekap /></TabsContent>
      </Tabs>
    </div>
  );
}
