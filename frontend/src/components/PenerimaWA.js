import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Send, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { api, errMsg } from "@/lib/api";
import { Card, Empty } from "@/components/common";
import { FormDialog } from "@/components/FormDialog";

const FIELDS = [
  { name: "nama", label: "Nama Pengurus", required: true },
  { name: "no_hp", label: "Nomor WhatsApp", required: true, hint: "Format 08xxxxxxxxxx" },
  { name: "aktif", label: "Aktif menerima notifikasi", type: "checkbox", full: true },
];

export function PenerimaWA() {
  const [items, setItems] = useState([]);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api.get("/wa-penerima").then((r) => setItems(r.data)).catch((e) => toast.error(errMsg(e))), []);
  useEffect(() => { load(); }, [load]);

  const save = async (v) => {
    const body = { ...v, aktif: !!v.aktif };
    if (edit.id) await api.put(`/wa-penerima/${edit.id}`, body); else await api.post("/wa-penerima", body);
    toast.success("Nomor WA tersimpan");
    load();
  };
  const toggle = async (p) => {
    try { await api.put(`/wa-penerima/${p.id}`, { nama: p.nama, no_hp: p.no_hp, aktif: !p.aktif }); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const del = async (p) => {
    if (!window.confirm(`Hapus nomor ${p.no_hp}?`)) return;
    try { await api.delete(`/wa-penerima/${p.id}`); toast.success("Nomor dihapus"); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const test = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/wa-penerima/test");
      (data.hasil.startsWith("Terkirim") ? toast.success : toast.error)(data.hasil);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <>
      <Card className="p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-emerald-950">Penerima Notifikasi WhatsApp</h3>
          <p className="text-sm text-slate-500">Setiap ada pengajuan izin pulang, sistem mengirim pesan WA ke semua nomor yang aktif.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={test} disabled={busy} data-testid="wa-test-btn"><Send className="h-4 w-4 mr-1" /> {busy ? "Mengirim..." : "Kirim Tes"}</Button>
          <Button className="bg-emerald-800 hover:bg-emerald-900" onClick={() => setEdit({ aktif: true })} data-testid="wa-add-btn"><Plus className="h-4 w-4 mr-1" /> Tambah Nomor</Button>
        </div>
      </Card>
      <Card className="overflow-x-auto">
        {items.length === 0 ? <Empty text="Belum ada nomor penerima" /> : (
          <table className="w-full text-sm" data-testid="wa-table">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Nomor WhatsApp</th><th className="px-4 py-3">Aktif</th><th className="px-4 py-3 text-right">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((p) => (
                <tr key={p.id} data-testid={`wa-row-${p.id}`}>
                  <td className="px-4 py-3 font-semibold">{p.nama}</td>
                  <td className="px-4 py-3 mono">{p.no_hp}</td>
                  <td className="px-4 py-3"><Switch checked={p.aktif} onCheckedChange={() => toggle(p)} data-testid={`wa-toggle-${p.id}`} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEdit(p)} data-testid={`wa-edit-${p.id}`}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => del(p)} data-testid={`wa-delete-${p.id}`}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <FormDialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? "Edit Nomor WA" : "Tambah Nomor WA"} fields={FIELDS}
        initial={edit} onSubmit={save} testId="wa-form" />
    </>
  );
}
