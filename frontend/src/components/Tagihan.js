import { Printer, Ban, RotateCcw, CreditCard, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/api";
import { Card, StatusBadge } from "@/components/common";

const BORDER = { lunas: "border-green-200", lunas_manual: "border-green-200", dibebaskan: "border-violet-200 bg-violet-50/40", sebagian: "border-amber-200", belum: "border-red-200" };

export function PendaftaranCard({ p, canPay, isAdmin, onPay, onManual, onUnmanual }) {
  return (
    <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" data-testid="tagihan-pendaftaran-card">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Biaya Pendaftaran</p>
        <p className="text-xl font-extrabold text-emerald-950 mt-1">{rupiah(p.tagihan)}</p>
        <p className="text-xs text-slate-500">{p.manual ? "Ditandai lunas manual oleh admin" : <>Dibayar {rupiah(p.dibayar)} {p.sisa > 0 && <span className="text-red-600 font-semibold">· Kurang {rupiah(p.sisa)}</span>}</>}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={p.manual ? "lunas_manual" : p.lunas ? "lunas" : "belum"} testId="tagihan-pendaftaran-status" />
        {canPay && !p.lunas && <Button size="sm" onClick={onPay} className="bg-amber-600 hover:bg-amber-700" data-testid="tagihan-pendaftaran-pay-btn"><CreditCard className="h-4 w-4 mr-1" /> Bayar</Button>}
        {isAdmin && !p.lunas && <Button size="sm" variant="outline" className="text-green-700" onClick={onManual} data-testid="tagihan-pendaftaran-manual-btn"><BadgeCheck className="h-4 w-4 mr-1" /> Tandai Lunas</Button>}
        {isAdmin && p.manual && <Button size="sm" variant="outline" onClick={onUnmanual} data-testid="tagihan-pendaftaran-unmanual-btn"><RotateCcw className="h-4 w-4 mr-1" /> Batalkan</Button>}
      </div>
    </Card>
  );
}

export function TagihanGrid({ months, canPay, isAdmin, onPay, onExempt, onUnexempt, onManual }) {
  if (!months.length) return <p className="text-sm text-slate-500 py-6">Belum ada tagihan bulanan (tagihan dimulai 1 bulan setelah pendaftaran).</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3" data-testid="billing-matrix-table">
      {months.map((m) => {
        const key = `${m.tahun}-${m.bulan}`;
        const open = m.status === "belum" || m.status === "sebagian";
        return (
          <div key={key} className={`rounded-xl border bg-white p-4 transition-shadow hover:shadow-md ${BORDER[m.status] || ""}`} data-testid={`billing-month-${key}`}>
            <p className="text-sm font-bold text-emerald-950">{m.label}</p>
            <p className="text-xs text-slate-500 mono">{rupiah(m.nominal)}</p>
            <div className="mt-2"><StatusBadge status={m.status} testId={`billing-status-badge-${key}`} /></div>
            {m.status === "sebagian" && <p className="text-[11px] text-amber-800 mt-1" data-testid={`billing-sisa-${key}`}>Dibayar {rupiah(m.dibayar)} · kurang {rupiah(m.sisa)}</p>}
            {m.keterangan && <p className={`text-[11px] mt-1 truncate ${m.status === "dibebaskan" ? "text-violet-700" : "text-green-700"}`} title={m.keterangan}>{m.keterangan}</p>}
            <div className="mt-3 flex flex-wrap gap-1">
              {open && canPay && <Button size="sm" className="h-7 px-2 text-xs bg-emerald-800 hover:bg-emerald-900" onClick={() => onPay(m)} data-testid={`billing-pay-btn-${key}`}>Bayar</Button>}
              {open && isAdmin && <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-green-700" title="Tandai lunas (bayar manual, tidak masuk kas)" onClick={() => onManual(m)} data-testid={`billing-manual-btn-${key}`}><BadgeCheck className="h-3 w-3 mr-1" />Tandai Lunas</Button>}
              {m.status === "belum" && isAdmin && <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-violet-700" onClick={() => onExempt(m)} data-testid={`billing-override-status-btn-${key}`}><Ban className="h-3 w-3 mr-1" />Bebaskan</Button>}
              {(m.status === "dibebaskan" || m.status === "lunas_manual") && isAdmin && <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onUnexempt(m)} data-testid={`billing-unexempt-btn-${key}`}><RotateCcw className="h-3 w-3 mr-1" />Batalkan</Button>}
              {m.id_pembayaran && <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => window.open(`/kwitansi/${m.id_pembayaran}`, "_blank")} data-testid={`billing-print-btn-${key}`}><Printer className="h-3 w-3 mr-1" />Kwitansi</Button>}
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
              <td className="px-4 py-3">{p.rincian || (p.jenis_pembayaran === "syariah" ? `Syariah ${p.bulan_tagihan} ${p.tahun_tagihan}` : "Pendaftaran")}</td>
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
