import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, errMsg, HARI } from "@/lib/api";
import { PageHeader, Card, Empty } from "@/components/common";
import { FormDialog } from "@/components/FormDialog";

export default function Jadwal() {
  const [rows, setRows] = useState([]);
  const [ustadz, setUstadz] = useState([]);
  const [dlg, setDlg] = useState(null);
  const load = useCallback(() => api.get("/jadwal").then((r) => setRows(r.data)).catch((e) => toast.error(errMsg(e))), []);
  useEffect(() => { load(); api.get("/ustadz").then((r) => setUstadz(r.data)); }, [load]);

  const fields = [
    { name: "nama_kegiatan", label: "Nama Kegiatan", required: true, full: true },
    { name: "hari", label: "Hari", type: "select", options: HARI.map((h) => ({ value: h, label: h })) },
    { name: "waktu", label: "Waktu", type: "time", required: true },
    { name: "id_ustadz", label: "Ustadz Pengampu", type: "select", placeholder: "- Tanpa ustadz -", full: true, options: ustadz.map((u) => ({ value: u.id_ustadz, label: u.nama_ustadz })) },
  ];

  const submit = async (v) => {
    const body = { ...v, id_ustadz: v.id_ustadz ? Number(v.id_ustadz) : null };
    if (dlg.id_jadwal) await api.put(`/jadwal/${dlg.id_jadwal}`, body); else await api.post("/jadwal", body);
    toast.success("Jadwal disimpan");
    load();
  };
  const del = async (j) => {
    if (!window.confirm(`Hapus jadwal ${j.nama_kegiatan} (${j.hari})? Data absensi jadwal ini ikut terhapus.`)) return;
    try { await api.delete(`/jadwal/${j.id_jadwal}`); toast.success("Jadwal dihapus"); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader title="Jadwal Ngaji" subtitle={`${rows.length} kegiatan terjadwal`}>
        <Button className="bg-emerald-800 hover:bg-emerald-900" onClick={() => setDlg({ hari: "Senin", waktu: "18:00" })} data-testid="jadwal-add-btn"><Plus className="h-4 w-4 mr-1" /> Tambah Jadwal</Button>
      </PageHeader>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {HARI.map((h) => {
          const items = rows.filter((r) => r.hari === h);
          return (
            <Card key={h} className="p-5" data-testid={`jadwal-hari-${h}`}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">{h}</p>
              {items.length === 0 ? <p className="text-xs text-slate-400">Tidak ada kegiatan</p> : (
                <div className="space-y-3">
                  {items.map((j) => (
                    <div key={j.id_jadwal} className="group rounded-lg border border-slate-100 bg-slate-50/60 p-3" data-testid={`jadwal-item-${j.id_jadwal}`}>
                      <p className="font-semibold text-sm text-emerald-950">{j.nama_kegiatan}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> {j.waktu.slice(0, 5)} · {j.nama_ustadz || "-"}</p>
                      <div className="flex gap-1 mt-2">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setDlg({ ...j, waktu: j.waktu.slice(0, 5), id_ustadz: j.id_ustadz ?? "" })} data-testid={`jadwal-edit-${j.id_jadwal}`}><Pencil className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600" onClick={() => del(j)} data-testid={`jadwal-delete-${j.id_jadwal}`}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {rows.length === 0 && <Empty />}
      <FormDialog open={!!dlg} onOpenChange={(o) => !o && setDlg(null)} title={dlg?.id_jadwal ? "Edit Jadwal" : "Tambah Jadwal"} fields={fields} initial={dlg} onSubmit={submit} testId="jadwal-form" />
    </div>
  );
}
