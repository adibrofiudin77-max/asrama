import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Minus, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, errMsg, rupiah, tgl, todayStr, firstOfMonthStr } from "@/lib/api";
import { PageHeader, Card, Empty, StatusBadge } from "@/components/common";
import { FormDialog } from "@/components/FormDialog";

const FIELDS = [
  { name: "kategori", label: "Kategori", required: true, hint: "Contoh: Listrik, ATK & Operasional, Donasi, Konsumsi" },
  { name: "tanggal", label: "Tanggal", type: "date", required: true },
  { name: "nominal", label: "Nominal (Rp)", type: "number", required: true },
  { name: "keterangan", label: "Keterangan", full: true },
];

function Box({ label, value, tone, testId }) {
  const c = tone === "in" ? "text-green-700" : tone === "out" ? "text-red-600" : "text-emerald-950";
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-extrabold mono ${c}`} data-testid={testId}>{value}</p>
    </Card>
  );
}

export default function Keuangan() {
  const [dari, setDari] = useState(firstOfMonthStr());
  const [sampai, setSampai] = useState(todayStr());
  const [d, setD] = useState(null);
  const [dlg, setDlg] = useState(null);

  const load = useCallback(() => api.get("/keuangan", { params: { dari, sampai } }).then((r) => setD(r.data)).catch((e) => toast.error(errMsg(e))), [dari, sampai]);
  useEffect(() => { load(); }, [load]);

  const submit = async (v) => { await api.post("/keuangan", { ...v, jenis: dlg }); toast.success("Transaksi disimpan"); load(); };
  const del = async (t) => {
    if (!window.confirm("Hapus transaksi ini?")) return;
    try { await api.delete(`/keuangan/${t.id_transaksi}`); toast.success("Transaksi dihapus"); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader title="Keuangan & Kas" subtitle={`Laporan kas periode ${tgl(dari)} – ${tgl(sampai)}`}>
        <Button className="bg-green-700 hover:bg-green-800" onClick={() => setDlg("pemasukan")} data-testid="keuangan-add-income-btn"><Plus className="h-4 w-4 mr-1" /> Pemasukan</Button>
        <Button className="bg-red-600 hover:bg-red-700" onClick={() => setDlg("pengeluaran")} data-testid="keuangan-add-expense-btn"><Minus className="h-4 w-4 mr-1" /> Pengeluaran</Button>
        <Button variant="outline" onClick={() => window.print()} data-testid="keuangan-print-btn"><Printer className="h-4 w-4 mr-1" /> Cetak Laporan</Button>
      </PageHeader>

      <Card className="p-4 mb-6 flex flex-wrap gap-3 items-end no-print">
        <div><p className="text-xs font-semibold text-slate-500 mb-1">DARI</p><Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} data-testid="keuangan-dari" /></div>
        <div><p className="text-xs font-semibold text-slate-500 mb-1">SAMPAI</p><Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} data-testid="keuangan-sampai" /></div>
      </Card>

      {d && (
        <>
          <div className="hidden print:block mb-4"><p className="font-extrabold text-lg">PONDOK PESANTREN ALHASANI LIMPUNG</p><p className="text-sm">Laporan Kas {tgl(dari)} – {tgl(sampai)}</p></div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Box label="Saldo Awal" value={rupiah(d.saldo_awal)} testId="keuangan-saldo-awal" />
            <Box label="Pemasukan" value={rupiah(d.total_masuk)} tone="in" testId="keuangan-total-masuk" />
            <Box label="Pengeluaran" value={rupiah(d.total_keluar)} tone="out" testId="keuangan-total-keluar" />
            <Box label="Saldo Akhir Periode" value={rupiah(d.saldo_awal + d.saldo_periode)} testId="keuangan-saldo-akhir" />
            <Box label="Saldo Kas Saat Ini" value={rupiah(d.saldo_kas)} testId="keuangan-balance-card" />
          </div>
          <Card className="overflow-x-auto">
            {d.items.length === 0 ? <Empty text="Tidak ada transaksi di periode ini" /> : (
              <table className="w-full text-sm" data-testid="keuangan-table">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Jenis</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Keterangan</th><th className="px-4 py-3 text-right">Nominal</th><th className="px-4 py-3 no-print"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {d.items.map((t) => (
                    <tr key={t.id_transaksi} data-testid={`keuangan-row-${t.id_transaksi}`}>
                      <td className="px-4 py-2.5 whitespace-nowrap">{t.tanggal}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={t.jenis} /></td>
                      <td className="px-4 py-2.5 capitalize">{t.kategori}</td>
                      <td className="px-4 py-2.5 text-slate-600">{t.keterangan || "-"}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold mono ${t.jenis === "pemasukan" ? "text-green-700" : "text-red-600"}`}>{t.jenis === "pemasukan" ? "+" : "-"}{rupiah(t.nominal)}</td>
                      <td className="px-4 py-2.5 no-print text-right">
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => del(t)} data-testid={`keuangan-delete-${t.id_transaksi}`}><Trash2 className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
      <FormDialog open={!!dlg} onOpenChange={(o) => !o && setDlg(null)} title={`Tambah ${dlg === "pemasukan" ? "Pemasukan" : "Pengeluaran"}`}
        fields={FIELDS} initial={{ tanggal: todayStr() }} onSubmit={submit} testId="keuangan-form" />
    </div>
  );
}
