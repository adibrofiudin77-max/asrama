import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Search, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, errMsg, rupiah, BULAN, todayStr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Card, Empty } from "@/components/common";
import { FormDialog } from "@/components/FormDialog";
import { PendaftaranCard, TagihanGrid, RiwayatTable } from "@/components/Tagihan";

const PAY_FIELDS = [
  { name: "jenis", label: "Jenis Pembayaran", type: "select", options: [{ value: "syariah", label: "Syariah Bulanan" }, { value: "pendaftaran", label: "Pendaftaran" }] },
  { name: "tanggal_bayar", label: "Tanggal Bayar", type: "date", required: true },
  { name: "bulan", label: "Bulan Tagihan", type: "select", options: BULAN.map((b, i) => ({ value: i + 1, label: b })), show: (v) => v.jenis === "syariah" },
  { name: "tahun", label: "Tahun Tagihan", type: "number", show: (v) => v.jenis === "syariah" },
  { name: "nominal", label: "Nominal (Rp)", type: "number", required: true },
  { name: "keterangan", label: "Keterangan", full: true },
];
const EXEMPT_FIELDS = [{ name: "keterangan", label: "Alasan dibebaskan", required: true, full: true, hint: "Contoh: PKL (tidak di pondok)" }];

export default function Pembayaran() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const [params, setParams] = useSearchParams();
  const sel = params.get("nis");
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [onlyDebt, setOnlyDebt] = useState(false);
  const [detail, setDetail] = useState(null);
  const [pay, setPay] = useState(null);
  const [exempt, setExempt] = useState(null);

  const loadList = useCallback(() => api.get("/tagihan").then((r) => setList(r.data)).catch((e) => toast.error(errMsg(e))), []);
  const loadDetail = useCallback(() => {
    if (!sel) { setDetail(null); return; }
    api.get(`/tagihan/${sel}`).then((r) => setDetail(r.data)).catch((e) => toast.error(errMsg(e)));
  }, [sel]);
  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { loadDetail(); }, [loadDetail]);
  const refresh = () => { loadList(); loadDetail(); };

  const filtered = useMemo(() => list.filter((s) => (!q || s.nama.toLowerCase().includes(q.toLowerCase()) || s.nis.includes(q)) && (!onlyDebt || s.total_tunggakan > 0)), [list, q, onlyDebt]);

  const submitPay = async (v) => {
    const { data } = await api.post("/pembayaran", { ...v, nis: sel, bulan: v.bulan ? Number(v.bulan) : null });
    toast.success(`Pembayaran tersimpan (${data.no_transaksi})`, { action: { label: "Cetak Kwitansi", onClick: () => window.open(`/kwitansi/${data.id_pembayaran}`, "_blank") } });
    refresh();
  };
  const setStatus = async (m, status, keterangan) => {
    await api.post(`/tagihan/${sel}/status`, { bulan: m.bulan, tahun: m.tahun, status, keterangan });
    toast.success(status === "dibebaskan" ? `${m.label} dibebaskan dari tagihan` : `${m.label} kembali ditagihkan`);
    refresh();
  };
  const del = async (p) => {
    if (!window.confirm(`Hapus pembayaran ${p.no_transaksi}?`)) return;
    try { await api.delete(`/pembayaran/${p.id_pembayaran}`); toast.success("Pembayaran dihapus"); refresh(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader title="Pembayaran Santri" subtitle="Syariah bulanan Rp 100.000 · Pendaftaran Rp 150.000" />
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        <Card className="p-4 h-fit lg:sticky lg:top-24">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari santri..." className="pl-9" data-testid="pembayaran-search-input" />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 mb-3 cursor-pointer">
            <input type="checkbox" className="accent-emerald-700" checked={onlyDebt} onChange={(e) => setOnlyDebt(e.target.checked)} data-testid="pembayaran-filter-tunggakan" /> Hanya yang menunggak
          </label>
          <div className="max-h-[60vh] overflow-y-auto -mx-2">
            {filtered.map((s) => (
              <button key={s.nis} onClick={() => setParams({ nis: s.nis })} data-testid={`pembayaran-santri-${s.nis}`}
                className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${sel === s.nis ? "bg-emerald-900 text-white" : "hover:bg-slate-50"}`}>
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-semibold truncate">{s.nama}</p>
                  {s.total_tunggakan > 0 ? <span className={`text-xs font-bold mono ${sel === s.nis ? "text-amber-300" : "text-red-600"}`}>{rupiah(s.total_tunggakan)}</span>
                    : <span className={`text-xs font-semibold ${sel === s.nis ? "text-emerald-200" : "text-green-600"}`}>Lunas</span>}
                </div>
                <p className={`text-xs ${sel === s.nis ? "text-emerald-200" : "text-slate-500"}`}>{s.nis} · Kelas {s.kelas}{s.bulan_belum ? ` · ${s.bulan_belum} bln belum` : ""}</p>
              </button>
            ))}
            {filtered.length === 0 && <Empty text="Tidak ada santri" />}
          </div>
        </Card>

        <div className="space-y-6 min-w-0">
          {!detail ? <Card className="p-10"><Empty text="Pilih santri di sebelah kiri untuk melihat tagihan" /></Card> : (
            <>
              <Card className="p-6 bg-emerald-950 text-white border-emerald-900 islamic-pattern">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-300">{detail.santri.nis}</p>
                    <h2 className="text-2xl font-extrabold" data-testid="pembayaran-santri-nama">{detail.santri.nama}</h2>
                    <p className="text-sm text-emerald-200">Kelas {detail.santri.kelas} · Kamar {detail.santri.nama_kamar || "-"} · Daftar {detail.santri.tanggal_daftar}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs uppercase tracking-wider text-emerald-300">Total Tunggakan</p>
                    <p className="text-2xl font-extrabold text-amber-300 mono" data-testid="pembayaran-total-tunggakan">{rupiah(detail.total_tunggakan)}</p>
                    <Button size="sm" className="mt-2 bg-amber-500 hover:bg-amber-600 text-emerald-950" data-testid="pembayaran-input-btn"
                      onClick={() => setPay({ jenis: "syariah", tanggal_bayar: todayStr(), bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear(), nominal: 100000 })}>
                      <CreditCard className="h-4 w-4 mr-1" /> Input Pembayaran
                    </Button>
                  </div>
                </div>
              </Card>
              <PendaftaranCard p={detail.pendaftaran} canPay onPay={() => setPay({ jenis: "pendaftaran", tanggal_bayar: todayStr(), nominal: detail.pendaftaran.sisa })} />
              <Card className="p-6">
                <h3 className="text-lg font-bold text-emerald-950 mb-4">Tagihan Syariah Bulanan</h3>
                <TagihanGrid months={detail.bulanan} canPay isAdmin={isAdmin}
                  onPay={(m) => setPay({ jenis: "syariah", tanggal_bayar: todayStr(), bulan: m.bulan, tahun: m.tahun, nominal: m.nominal })}
                  onExempt={(m) => setExempt(m)}
                  onUnexempt={(m) => setStatus(m, "normal").catch((e) => toast.error(errMsg(e)))} />
              </Card>
              <Card>
                <h3 className="text-lg font-bold text-emerald-950 p-6 pb-2">Riwayat Pembayaran</h3>
                {detail.pembayaran.length ? <RiwayatTable items={detail.pembayaran} isAdmin={isAdmin} onDelete={del} /> : <Empty />}
              </Card>
            </>
          )}
        </div>
      </div>

      <FormDialog open={!!pay} onOpenChange={(o) => !o && setPay(null)} title={`Input Pembayaran · ${detail?.santri.nama || ""}`} fields={PAY_FIELDS}
        initial={pay} onSubmit={submitPay} submitLabel="Simpan Pembayaran" testId="billing-pay" />
      <FormDialog open={!!exempt} onOpenChange={(o) => !o && setExempt(null)} title={`Bebaskan Tagihan ${exempt?.label || ""}`}
        description="Santri tidak dibebani biaya syariah untuk bulan ini." fields={EXEMPT_FIELDS} initial={{ keterangan: "PKL" }}
        onSubmit={(v) => setStatus(exempt, "dibebaskan", v.keterangan)} submitLabel="Bebaskan" testId="billing-exempt" />
    </div>
  );
}
