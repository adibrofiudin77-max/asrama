import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, errMsg, rupiah, tgl, terbilang, kelasLabel, BULAN } from "@/lib/api";

const PAGE_CSS = `
@page { size: 229mm 162mm; margin: 0; }
@media print { html, body { width: 229mm; height: 162mm; margin: 0; } .kw-wrap { padding: 0 !important; background: #fff !important; } .kw-sheet { box-shadow: none !important; } }
`;

function Row({ label, children, testId }) {
  return (
    <div className="flex gap-3 py-[2.2mm] border-b border-dotted border-slate-400">
      <span className="w-[42mm] shrink-0 text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900" data-testid={testId}>{children}</span>
    </div>
  );
}

export default function Kwitansi() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => { api.get(`/pembayaran/${id}`).then((r) => setP(r.data)).catch((e) => setErr(errMsg(e))); }, [id]);

  if (err) return <p className="p-10 text-red-600" data-testid="receipt-error">{err}</p>;
  if (!p) return <p className="p-10 text-slate-500">Memuat kwitansi...</p>;

  const alok = p.alokasi || [];
  const untuk = p.jenis_pembayaran !== "syariah" ? "Biaya Pendaftaran Santri"
    : alok.length ? `Syariah Bulanan: ${alok.map((a) => `${BULAN[a.bulan - 1]} ${a.tahun} (${rupiah(a.nominal)}${Number(a.sisa) > 0 ? `, kurang ${rupiah(a.sisa)}` : ""})`).join("; ")}`
      : `Syariah Bulanan ${p.bulan_tagihan} ${p.tahun_tagihan}`;
  const partial = alok.some((a) => Number(a.sisa) > 0);

  return (
    <div className="kw-wrap min-h-screen bg-slate-200 py-8 px-4">
      <style>{PAGE_CSS}</style>
      <div className="no-print mx-auto mb-4 flex max-w-[229mm] items-center justify-between">
        <p className="text-sm text-slate-600">Ukuran kertas: <b>Envelope C5 Landscape (229 × 162 mm)</b></p>
        <Button onClick={() => window.print()} className="bg-emerald-800 hover:bg-emerald-900" data-testid="receipt-trigger-print-btn"><Printer className="h-4 w-4 mr-1" /> Cetak</Button>
      </div>

      <div className="kw-sheet relative mx-auto bg-white shadow-xl overflow-hidden text-[3.4mm]" style={{ width: "229mm", height: "162mm", padding: "9mm 12mm" }} data-testid="receipt-container-c5">
        <div className="absolute inset-[4mm] border-[0.6mm] border-emerald-900 pointer-events-none" />
        <div className="absolute inset-[5.2mm] border-[0.2mm] border-amber-600 pointer-events-none" />

        <div className="relative flex items-center gap-[4mm] border-b-[0.6mm] border-double border-emerald-900 pb-[3mm]">
          <div className="flex-1">
            <p className="text-[5.4mm] font-extrabold tracking-tight text-emerald-950 leading-tight" data-testid="receipt-header-text">PONDOK PESANTREN ALHASANI LIMPUNG</p>
            <p className="text-[3.2mm] text-slate-600">Jl. KH. Wahid Hasyim No. 01 Limpung</p>
          </div>
          <div className="text-right">
            <p className="text-[6mm] font-extrabold tracking-[0.25em] text-amber-600">KWITANSI</p>
            <p className="mono text-[3mm] text-slate-600" data-testid="receipt-no-transaksi">No: {p.no_transaksi}</p>
          </div>
        </div>

        <div className="relative mt-[4mm]">
          <Row label="Telah terima dari">{p.nama}</Row>
          <Row label="NIS / Kelas" testId="receipt-santri-nis">{p.nis} / Kelas {kelasLabel(p)}{p.nama_kamar ? ` / Kamar ${p.nama_kamar}` : ""}</Row>
          <Row label="Uang sejumlah"><i className="font-semibold">{terbilang(p.nominal)}</i></Row>
          <Row label="Untuk pembayaran" testId="receipt-untuk">{untuk}{p.keterangan ? ` (${p.keterangan})` : ""}</Row>
        </div>

        <div className="relative mt-[6mm] flex items-end justify-between">
          <div>
            <div className="inline-block border-[0.5mm] border-emerald-900 bg-emerald-50 px-[5mm] py-[2.5mm] -skew-x-6">
              <p className="skew-x-6 text-[6.5mm] font-extrabold text-emerald-950 mono" data-testid="receipt-amount-text">{rupiah(p.nominal)}</p>
            </div>
            <p className="mt-[3mm] inline-block rotate-[-4deg] border-[0.5mm] border-green-700 px-[3mm] py-[0.8mm] text-[3.6mm] font-extrabold tracking-[0.3em] text-green-700" data-testid="receipt-stamp">{partial ? "DITERIMA" : "LUNAS"}</p>
          </div>
          <div className="text-center w-[60mm]">
            <p>Limpung, {tgl(p.tanggal_bayar)}</p>
            <p className="text-slate-600">Penerima,</p>
            <div className="h-[16mm]" />
            <p className="font-bold border-t border-slate-800 pt-[1mm]" data-testid="receipt-signature-name">{p.nama_pengurus || "-"}</p>
            <p className="text-[2.8mm] text-slate-500">Pengurus Pondok</p>
          </div>
        </div>
      </div>
    </div>
  );
}
