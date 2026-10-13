import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, errMsg, tgl, todayStr } from "@/lib/api";
import { Card, Empty, StatusBadge } from "@/components/common";
import { FormDialog } from "@/components/FormDialog";

const FIELDS = [
  { name: "tanggal_pulang", label: "Tanggal Pulang", type: "date", required: true },
  { name: "tanggal_kembali", label: "Kembali ke Pondok", type: "date", required: true },
  { name: "penjemput", label: "Yang Menjemput", required: true, full: true, hint: "Contoh: Bapak (Ahmad)" },
  { name: "alasan", label: "Alasan Pulang", type: "textarea", required: true, full: true },
];

export const lamaHari = (i) => Math.round((new Date(i.tanggal_kembali) - new Date(i.tanggal_pulang)) / 86400000) + 1;

function IzinCard({ i, onCancel }) {
  return (
    <Card className="p-5" data-testid={`izin-card-${i.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Pulang · {lamaHari(i)} hari</p>
          <p className="font-semibold text-emerald-950">{tgl(i.tanggal_pulang)} → {tgl(i.tanggal_kembali)}</p>
        </div>
        <StatusBadge status={i.status} testId={`izin-status-${i.id}`} />
      </div>
      <p className="mt-3 text-sm"><span className="text-slate-500">Penjemput:</span> {i.penjemput}</p>
      <p className="text-sm"><span className="text-slate-500">Alasan:</span> {i.alasan}</p>
      {i.catatan && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Catatan pengurus: {i.catatan}</p>}
      {i.diproses_oleh && <p className="mt-2 text-xs text-slate-400">Diproses oleh {i.diproses_oleh}</p>}
      {i.status === "menunggu" && <Button size="sm" variant="outline" className="mt-3 text-red-600" onClick={() => onCancel(i)} data-testid={`izin-cancel-${i.id}`}>Batalkan</Button>}
    </Card>
  );
}

export function IzinSantri() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const load = useCallback(() => api.get("/izin/saya").then((r) => setItems(r.data)).catch((e) => toast.error(errMsg(e))), []);
  useEffect(() => { load(); }, [load]);

  const submit = async (v) => {
    await api.post("/izin", v);
    toast.success("Pengajuan izin terkirim. Pengurus akan menerima notifikasi WhatsApp.");
    load();
  };
  const cancel = async (i) => {
    if (!window.confirm("Batalkan pengajuan izin ini?")) return;
    try { await api.delete(`/izin/${i.id}`); toast.success("Pengajuan dibatalkan"); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-emerald-950">Izin Kepulangan</h3>
          <p className="text-sm text-slate-500">Anda sudah pulang <b className="text-emerald-900" data-testid="izin-total-pulang">{items.filter((i) => i.status === "disetujui").length}</b> kali (izin disetujui).</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-emerald-800 hover:bg-emerald-900" data-testid="izin-ajukan-btn"><Plus className="h-4 w-4 mr-1" /> Ajukan Izin Pulang</Button>
      </Card>
      {items.length === 0 ? <Card><Empty text="Belum ada pengajuan izin" /></Card> : (
        <div className="grid md:grid-cols-2 gap-4" data-testid="izin-santri-list">
          {items.map((i) => <IzinCard key={i.id} i={i} onCancel={cancel} />)}
        </div>
      )}
      <FormDialog open={open} onOpenChange={setOpen} title="Ajukan Izin Pulang" description="Pengajuan dikirim ke pengurus melalui WhatsApp dan menunggu persetujuan (ACC)."
        fields={FIELDS} initial={{ tanggal_pulang: todayStr(), tanggal_kembali: todayStr() }} onSubmit={submit} submitLabel="Kirim Pengajuan" testId="izin-form" />
    </div>
  );
}
