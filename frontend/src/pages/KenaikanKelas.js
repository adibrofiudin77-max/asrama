import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, errMsg, tgl, kelasLabel } from "@/lib/api";
import { PageHeader, Card, Empty } from "@/components/common";
import { NativeSelect } from "@/components/FormDialog";

const NEXT = { X: "XI", XI: "XII", XII: "LULUS" };
const TUJUAN = ["X", "XI", "XII", "LULUS"].map((k) => ({ value: k, label: k === "LULUS" ? "LULUS (status santri jadi lulus)" : `Kelas ${k}` }));
const y = new Date().getFullYear();

export default function KenaikanKelas() {
  const [kelas, setKelas] = useState([]);
  const [asal, setAsal] = useState("");
  const [santri, setSantri] = useState([]);
  const [checked, setChecked] = useState({});
  const [tujuan, setTujuan] = useState("");
  const [ta, setTa] = useState(`${y}/${y + 1}`);
  const [hist, setHist] = useState([]);
  const [busy, setBusy] = useState(false);

  const loadMeta = useCallback(() => {
    api.get("/kelas").then((r) => setKelas(r.data));
    api.get("/riwayat-kelas").then((r) => setHist(r.data));
  }, []);
  useEffect(loadMeta, [loadMeta]);
  useEffect(() => {
    if (!asal) { setSantri([]); return; }
    const [k, j] = asal.split("|");
    api.get("/santri", { params: { status: "aktif", kelas: k, jurusan: j || "_none" } }).then((r) => {
      setSantri(r.data);
      setChecked(Object.fromEntries(r.data.map((s) => [s.nis, true])));
    });
    setTujuan(NEXT[k] || "");
  }, [asal]);

  const selected = santri.filter((s) => checked[s.nis]);
  const asalLabel = asal.replace("|", " ").trim();
  const run = async () => {
    if (!selected.length || !tujuan) return toast.error("Pilih santri dan kelas tujuan");
    if (!window.confirm(`Proses ${selected.length} santri dari kelas ${asalLabel} ke ${tujuan}?`)) return;
    setBusy(true);
    try {
      const { data } = await api.post("/kenaikan-kelas", { nis_list: selected.map((s) => s.nis), kelas_baru: tujuan, tahun_ajaran: ta });
      toast.success(`${data.jumlah} santri berhasil diproses`);
      setAsal(""); loadMeta();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Kenaikan Kelas" subtitle="Naikkan kelas santri secara massal, tujuan LULUS mengubah status santri menjadi lulus" />
      <Card className="p-5 mb-6 grid md:grid-cols-[1fr_auto_1fr_1fr_auto] gap-4 items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Kelas Asal</p>
          <NativeSelect value={asal} onChange={(e) => setAsal(e.target.value)} placeholder="- Pilih kelas -" options={kelas.filter((k) => k.jumlah > 0).map((k) => ({ value: `${k.kelas}|${k.program_keahlian || ""}`, label: `Kelas ${kelasLabel(k)} (${k.jumlah} santri)` }))} data-testid="kenaikan-kelas-origin-select" />
        </div>
        <ArrowRight className="hidden md:block h-5 w-5 text-amber-600 mb-2.5" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Kelas Tujuan</p>
          <NativeSelect value={tujuan} onChange={(e) => setTujuan(e.target.value)} placeholder="- Pilih tingkat -" options={TUJUAN} data-testid="kenaikan-kelas-target-select" />
          <p className="text-[11px] text-slate-500 mt-1">Program keahlian tetap sama</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Tahun Ajaran</p>
          <Input value={ta} onChange={(e) => setTa(e.target.value)} data-testid="kenaikan-kelas-tahun-ajaran" />
        </div>
        <Button disabled={busy || !selected.length} onClick={run} className="bg-amber-600 hover:bg-amber-700" data-testid="kenaikan-kelas-bulk-promote-btn">
          <GraduationCap className="h-4 w-4 mr-1" /> Proses ({selected.length})
        </Button>
      </Card>

      {asal && (
        <Card className="mb-8 overflow-x-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <p className="text-sm font-semibold">Pratinjau: {selected.length} dari {santri.length} santri kelas {asalLabel} → <span className="text-amber-700">{tujuan || "?"}</span></p>
            <label className="text-xs flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-emerald-700" checked={selected.length === santri.length && santri.length > 0}
                onChange={(e) => setChecked(Object.fromEntries(santri.map((s) => [s.nis, e.target.checked])))} data-testid="kenaikan-kelas-check-all" /> Pilih semua
            </label>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
            {santri.map((s) => (
              <label key={s.nis} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${checked[s.nis] ? "border-emerald-300 bg-emerald-50/60" : "border-slate-200"}`}>
                <input type="checkbox" className="accent-emerald-700" checked={!!checked[s.nis]} onChange={(e) => setChecked((p) => ({ ...p, [s.nis]: e.target.checked }))} data-testid={`kenaikan-kelas-check-${s.nis}`} />
                <span className="text-sm"><b>{s.nama}</b><br /><span className="text-xs text-slate-500">{s.nis}</span></span>
              </label>
            ))}
          </div>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <h3 className="text-lg font-bold text-emerald-950 p-6 pb-2">Riwayat Kenaikan Kelas</h3>
        {hist.length === 0 ? <Empty /> : (
          <table className="w-full text-sm" data-testid="kenaikan-kelas-history-table">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Santri</th><th className="px-4 py-3">Kelas</th><th className="px-4 py-3">Tahun Ajaran</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hist.map((h) => (
                <tr key={h.id}><td className="px-4 py-2.5">{tgl(h.tanggal_naik)}</td><td className="px-4 py-2.5 font-semibold">{h.nama} <span className="text-xs text-slate-500 font-normal">{h.nis}</span></td>
                  <td className="px-4 py-2.5">{h.kelas_lama} → <b className="text-emerald-800">{h.kelas_baru}</b></td><td className="px-4 py-2.5">{h.tahun_ajaran || "-"}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
