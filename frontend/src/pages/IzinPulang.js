import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X, Trash2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, errMsg, tgl, kelasLabel } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Card, Empty, StatusBadge, GenderSwitch } from "@/components/common";
import { FormDialog } from "@/components/FormDialog";
import { PenerimaWA } from "@/components/PenerimaWA";
import { lamaHari } from "@/components/IzinSantri";

const FILTERS = [["menunggu", "Menunggu"], ["disetujui", "Disetujui"], ["ditolak", "Ditolak"], ["", "Semua"]];
const TH = "px-4 py-3";

function Aksi({ i, isAdmin, onAct, onDelete }) {
  return (
    <div className="flex justify-end gap-1">
      {i.status !== "disetujui" && <Button size="sm" className="bg-emerald-800 hover:bg-emerald-900" onClick={() => onAct(i, "disetujui")} data-testid={`izin-acc-${i.id}`}><Check className="h-4 w-4 mr-1" />ACC</Button>}
      {i.status !== "ditolak" && <Button size="sm" variant="outline" className="text-red-600" onClick={() => onAct(i, "ditolak")} data-testid={`izin-tolak-${i.id}`}><X className="h-4 w-4 mr-1" />Tolak</Button>}
      {isAdmin && <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onDelete(i)} data-testid={`izin-delete-${i.id}`}><Trash2 className="h-4 w-4" /></Button>}
    </div>
  );
}

function Pengajuan({ isAdmin }) {
  const [status, setStatus] = useState("menunggu");
  const [items, setItems] = useState([]);
  const [act, setAct] = useState(null);
  const load = useCallback(() => api.get("/izin", { params: status ? { status } : {} }).then((r) => setItems(r.data)).catch((e) => toast.error(errMsg(e))), [status]);
  useEffect(() => { load(); }, [load]);

  const proses = async (v) => {
    await api.post(`/izin/${act.i.id}/proses`, { status: act.status, catatan: v.catatan });
    toast.success(act.status === "disetujui" ? `Izin ${act.i.nama} disetujui` : `Izin ${act.i.nama} ditolak`);
    load();
  };
  const del = async (i) => {
    if (!window.confirm(`Hapus pengajuan izin ${i.nama}?`)) return;
    try { await api.delete(`/izin/${i.id}`); toast.success("Pengajuan dihapus"); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <>
      <div className="inline-flex flex-wrap gap-1 rounded-lg bg-white ring-1 ring-amber-900/10 p-1 mb-6">
        {FILTERS.map(([k, l]) => (
          <button key={l} onClick={() => setStatus(k)} data-testid={`izin-filter-${k || "semua"}`}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${status === k ? "bg-emerald-900 text-amber-200 shadow-sm" : "text-slate-500 hover:text-emerald-900"}`}>{l}</button>
        ))}
      </div>
      <Card className="overflow-x-auto">
        {items.length === 0 ? <Empty text="Tidak ada pengajuan" /> : (
          <table className="w-full text-sm" data-testid="izin-table">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className={TH}>Santri</th><th className={TH}>Tanggal</th><th className={TH}>Penjemput & Alasan</th><th className={TH}>Status</th><th className={`${TH} text-right`}>Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((i) => (
                <tr key={i.id} data-testid={`izin-row-${i.id}`}>
                  <td className={TH}><p className="font-semibold">{i.nama}</p><p className="text-xs text-slate-500">{i.nis} · {i.jenis_kelamin === "P" ? "Putri" : "Putra"} · Kelas {kelasLabel(i)} · Kamar {i.nama_kamar || "-"}</p></td>
                  <td className={`${TH} whitespace-nowrap`}><p>{tgl(i.tanggal_pulang)}</p><p className="text-xs text-slate-500">kembali {tgl(i.tanggal_kembali)} · {lamaHari(i)} hari</p></td>
                  <td className={`${TH} max-w-xs`}><p className="font-medium">{i.penjemput}</p><p className="text-xs text-slate-500">{i.alasan}</p></td>
                  <td className={TH}>
                    <StatusBadge status={i.status} testId={`izin-row-status-${i.id}`} />
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400" data-testid={`izin-notif-${i.id}`}><MessageCircle className="h-3 w-3" />{i.notif_wa || "Mengirim WA..."}</p>
                    {i.diproses_oleh && <p className="text-[11px] text-slate-400">oleh {i.diproses_oleh}</p>}
                    {i.catatan && <p className="text-[11px] text-amber-700">“{i.catatan}”</p>}
                  </td>
                  <td className={TH}><Aksi i={i} isAdmin={isAdmin} onAct={(x, s) => setAct({ i: x, status: s })} onDelete={del} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <FormDialog open={!!act} onOpenChange={(o) => !o && setAct(null)} title={`${act?.status === "disetujui" ? "Setujui" : "Tolak"} Izin · ${act?.i.nama || ""}`}
        fields={[{ name: "catatan", label: "Catatan untuk santri (opsional)", type: "textarea", full: true }]} initial={{ catatan: act?.i.catatan || "" }}
        onSubmit={proses} submitLabel={act?.status === "disetujui" ? "Setujui (ACC)" : "Tolak"} testId="izin-proses" />
    </>
  );
}

function RekapIzin() {
  const [rows, setRows] = useState([]);
  const [jk, setJk] = useState("L");
  useEffect(() => { api.get("/izin/rekap").then((r) => setRows(r.data)).catch((e) => toast.error(errMsg(e))); }, []);
  const shown = rows.filter((r) => r.jenis_kelamin === jk);
  const counts = { L: rows.filter((r) => r.jenis_kelamin === "L").length, P: rows.filter((r) => r.jenis_kelamin === "P").length };
  return (
    <>
      <div className="mb-6"><GenderSwitch value={jk} onChange={setJk} counts={counts} testId="izin-rekap-gender" /></div>
      <Card className="overflow-x-auto">
        {shown.length === 0 ? <Empty /> : (
          <table className="w-full text-sm" data-testid="izin-rekap-table">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className={TH}>Santri</th><th className={TH}>Kelas</th><th className={`${TH} text-center`}>Jumlah Pulang</th><th className={`${TH} text-center`}>Total Hari</th><th className={TH}>Terakhir Pulang</th><th className={`${TH} text-center`}>Menunggu</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((r) => (
                <tr key={r.nis} data-testid={`izin-rekap-row-${r.nis}`}>
                  <td className={`${TH} font-semibold`}>{r.nama}</td><td className={TH}>{kelasLabel(r)}</td>
                  <td className={`${TH} text-center text-xl font-extrabold text-emerald-900`} data-testid={`izin-rekap-jumlah-${r.nis}`}>{r.jumlah_pulang}</td>
                  <td className={`${TH} text-center`}>{r.total_hari}</td><td className={TH}>{r.terakhir_pulang ? tgl(r.terakhir_pulang) : "-"}</td>
                  <td className={`${TH} text-center`}>{r.menunggu ? <StatusBadge status="menunggu" /> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}

export default function IzinPulang() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  return (
    <div>
      <PageHeader title="Izin Pulang" subtitle="Pengajuan kepulangan santri, persetujuan pengurus & rekap" />
      <Tabs defaultValue="pengajuan">
        <TabsList className="mb-6">
          <TabsTrigger value="pengajuan" data-testid="izin-tab-pengajuan">Pengajuan</TabsTrigger>
          <TabsTrigger value="rekap" data-testid="izin-tab-rekap">Rekap Kepulangan</TabsTrigger>
          {isAdmin && <TabsTrigger value="wa" data-testid="izin-tab-wa">Nomor WA Notifikasi</TabsTrigger>}
        </TabsList>
        <TabsContent value="pengajuan"><Pengajuan isAdmin={isAdmin} /></TabsContent>
        <TabsContent value="rekap"><RekapIzin /></TabsContent>
        {isAdmin && <TabsContent value="wa"><PenerimaWA /></TabsContent>}
      </Tabs>
    </div>
  );
}
