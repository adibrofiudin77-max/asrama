import { Printer, Ban, RotateCcw, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/api";
import { Card, StatusBadge } from "@/components/common";

export function PendaftaranCard({ p, canPay, onPay }) {
  return (
    <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" data-testid="tagihan-pendaftaran-card">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Biaya Pendaftaran</p>
        <p className="text-xl font-extrabold text-emerald-950 mt-1">{rupiah(p.tagihan)}</p>
        <p className="text-xs text-slate-500">Dibayar {rupiah(p.dibayar)} {p.sisa > 0 && <span className="text-red-600 font-semibold">· Kurang {rupiah(p.sisa)}</span>}</p>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={p.lunas ? "lunas" : "belum"} testId="tagihan-pendaftaran-status" />
        {canPay && !p.lunas && <Button size="sm" onClick={onPay} className="bg-amber-600 hover:bg-amber-700" data-testid="tagihan-pendaftaran-pay-btn"><CreditCard className="h-4 w-4 mr-1" /> Bayar</Button>}
      </div>
    </Card>
  );
}

export function TagihanGrid({ months, canPay, isAdmin, onPay, onExempt, onUnexempt }) {
  if (!months.length) return <p className="text-sm text-slate-500 py-6">Belum ada tagihan bulanan (tagihan dimulai 1 bulan setelah pendaftaran).</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3" data-testid="billing-matrix-table">
      {months.map((m) => {
        const key = `${m.tahun}-${m.bulan}`;
        const border = m.status === "lunas" ? "border-green-200" : m.status === "dibebaskan" ? "border-violet-200 bg-violet-50/40" : "border-red-200";
        return (
          <div key={key} className={`rounded-xl border bg-white p-4 transition-shadow hover:shadow-md ${border}`} data-testid={`billing-month-${key}`}>
            <p className="text-sm font-bold text-emerald-950">{m.label}</p>
            <p className="text-xs text-slate-500 mono">{rupiah(m.nominal)}</p>
            <div className="mt-2"><StatusBadge status={m.status} testId={`billing-status-badge-${key}`} /></div>
            {m.keterangan && <p className="text-[11px] text-violet-700 mt-1 truncate" title={m.keterangan}>{m.keterangan}</p>}
            <div className="mt-3 flex flex-wrap gap-1">
              {m.status === "belum" && canPay && <Button size="sm" className="h-7 px-2 text-xs bg-emerald-800 hover:bg-emerald-900" onClick={() => onPay(m)} data-testid={`billing-pay-btn-${key}`}>Bayar</Button>}
              {m.status === "belum" && isAdmin && <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-violet-700" onClick={() => onExempt(m)} data-testid={`billing-override-status-btn-${key}`}><Ban className="h-3 w-3 mr-1" />Bebaskan</Button>}
              {m.status === "dibebaskan" && isAdmin && <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onUnexempt(m)} data-testid={`billing-unexempt-btn-${key}`}><RotateCcw className="h-3 w-3 mr-1" />Batalkan</Button>}
              {m.status === "lunas" && m.id_pembayaran && <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => window.open(`/kwitansi/${m.id_pembayaran}`, "_blank")} data-testid={`billing-print-btn-${key}`}><Printer className="h-3 w-3 mr-1" />Kwitansi</Button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RiwayatTable({ items, isAdmin, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="riwayat-pembayaran-table">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
          <tr><th className="px-4 py-3">No. Transaksi</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Pembayaran</th><th className="px-4 py-3">Nominal</th><th className="px-4 py-3">Petugas</th><th className="px-4 py-3 text-right">Aksi</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((p) => (
            <tr key={p.id_pembayaran} data-testid={`riwayat-row-${p.id_pembayaran}`}>
              <td className="px-4 py-3 mono text-xs">{p.no_transaksi}</td>
              <td className="px-4 py-3 whitespace-nowrap">{p.tanggal_bayar}</td>
              <td className="px-4 py-3">{p.jenis_pembayaran === "syariah" ? `Syariah ${p.bulan_tagihan} ${p.tahun_tagihan}` : "Pendaftaran"}</td>
              <td className="px-4 py-3 font-semibold mono">{rupiah(p.nominal)}</td>
              <td className="px-4 py-3">{p.nama_pengurus || "-"}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => window.open(`/kwitansi/${p.id_pembayaran}`, "_blank")} data-testid={`billing-print-receipt-btn-${p.id_pembayaran}`}><Printer className="h-4 w-4" /></Button>
                  {isAdmin && onDelete && <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onDelete(p)} data-testid={`riwayat-delete-${p.id_pembayaran}`}>Hapus</Button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
