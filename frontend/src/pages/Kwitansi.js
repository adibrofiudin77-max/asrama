import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, errMsg, rupiah, tgl, terbilang, kelasLabel, BULAN } from "@/lib/api";

const PAGE_CSS = `
@page { size: 229mm 162mm; margin: 0; }
@media print {
  html, body { width: 229mm; margin: 0; background: #fff !important; }
  .kw-wrap { padding: 0 !important; min-height: 0 !important; background: #fff !important; }
  .kw-sheet { box-shadow: none !important; height: auto !important; }
}
.kw-sheet, .kw-sheet * { color: #000 !important; border-color: #000 !important; font-family: Arial, Helvetica, sans-serif; font-weight: 700; }
`;

function Row({ label, children, testId }) {
  return (
    <div className="flex gap-2 py-[1.4mm] border-b-[0.3mm] border-dashed">
      <span className="w-[38mm] shrink-0">{label}</span>
      <span>:</span>
      <span className="flex-1" style={{ fontWeight: 900 }} data-testid={testId}>{children}</span>
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
      <div className="no-print mx-auto mb-4 flex max-w-[229mm] items-center justify-between gap-4">
        <p className="text-sm text-slate-600">Kertas: <b>229 × 162 mm</b> · Isi kwitansi ±10 cm, rata atas. Saat print pilih <b>Margin: None</b> & <b>Scale 100%</b>.</p>
        <Button onClick={() => window.print()} className="bg-emerald-800 hover:bg-emerald-900" data-testid="receipt-trigger-print-btn"><Printer className="h-4 w-4 mr-1" /> Cetak</Button>
      </div>

      <div className="kw-sheet mx-auto bg-white shadow-xl overflow-hidden text-[3.7mm] leading-snug" style={{ width: "229mm", height: "162mm", padding: "6mm 10mm" }} data-testid="receipt-container-c5">
        <div className="border-[0.6mm] border-solid px-[5mm] py-[3mm]" data-testid="receipt-frame">
          <div className="flex items-end justify-between gap-[4mm] border-b-[0.6mm] border-solid pb-[2mm]">
            <div>
              <p className="text-[5.2mm] leading-tight" style={{ fontWeight: 900 }} data-testid="receipt-header-text">PONDOK PESANTREN ALHASANI LIMPUNG</p>
              <p className="text-[3.3mm]">Jl. KH. Wahid Hasyim No. 01 Limpung</p>
            </div>
            <div className="text-right">
              <p className="text-[5.6mm] tracking-[0.2em]" style={{ fontWeight: 900 }}>KWITANSI</p>
              <p className="text-[3.3mm]" data-testid="receipt-no-transaksi">No: {p.no_transaksi}</p>
            </div>
          </div>

          <div className="mt-[1.5mm]">
            <Row label="Telah terima dari">{p.nama}</Row>
            <Row label="NIS / Kelas" testId="receipt-santri-nis">{p.nis} / Kelas {kelasLabel(p)}{p.nama_kamar ? ` / Kamar ${p.nama_kamar}` : ""}</Row>
            <Row label="Uang sejumlah"><i>{terbilang(p.nominal)}</i></Row>
            <Row label="Untuk pembayaran" testId="receipt-untuk">{untuk}{p.keterangan ? ` (${p.keterangan})` : ""}</Row>
          </div>

          <div className="mt-[3mm] flex items-end justify-between">
            <div>
              <div className="inline-block border-[0.6mm] border-solid px-[5mm] py-[1.8mm]">
                <p className="text-[6.2mm]" style={{ fontWeight: 900 }} data-testid="receipt-amount-text">{rupiah(p.nominal)}</p>
              </div>
              <p className="mt-[2mm] w-fit border-[0.6mm] border-solid px-[3mm] py-[0.6mm] text-[3.8mm] tracking-[0.3em]" style={{ fontWeight: 900 }} data-testid="receipt-stamp">{partial ? "DITERIMA" : "LUNAS"}</p>
            </div>
            <div className="text-center w-[60mm]">
              <p>Limpung, {tgl(p.tanggal_bayar)}</p>
              <p>Penerima,</p>
              <div className="h-[11mm]" />
              <p className="border-t-[0.4mm] border-solid pt-[0.8mm]" style={{ fontWeight: 900 }} data-testid="receipt-signature-name">{p.nama_pengurus || "-"}</p>
              <p className="text-[3.1mm]">Pengurus Pondok</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
