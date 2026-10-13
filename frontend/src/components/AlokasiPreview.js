import { useEffect, useState } from "react";
import { api, rupiah } from "@/lib/api";

export function AlokasiPreview({ nis, nominal, tarif, tunggakan, onPick }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const n = Number(nominal);
    if (!n || n <= 0) { setRows([]); return undefined; }
    const t = setTimeout(() => api.post("/pembayaran/preview", { nis, nominal: n }).then((r) => setRows(r.data.alokasi)).catch(() => setRows([])), 350);
    return () => clearTimeout(t);
  }, [nis, nominal]);

  const quick = [["1 bulan", tarif], ["3 bulan", tarif * 3], ["6 bulan", tarif * 6]];
  if (tunggakan > 0) quick.unshift(["Lunasi tunggakan", tunggakan]);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4" data-testid="alokasi-preview">
      <div className="flex flex-wrap gap-1.5 mb-4">
        {quick.map(([l, n]) => (
          <button type="button" key={l} onClick={() => onPick(n)} data-testid={`alokasi-quick-${l.replace(/\s+/g, "-").toLowerCase()}`}
            className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100">
            {l} · {rupiah(n)}
          </button>
        ))}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Alokasi otomatis (1 kwitansi)</p>
      {rows.length === 0 ? <p className="text-sm text-slate-500">Masukkan nominal untuk melihat pembagian ke bulan tagihan.</p> : (
        <ul className="space-y-1.5 text-sm">
          {rows.map((r) => (
            <li key={`${r.tahun}-${r.bulan}`} className="flex items-center justify-between gap-3" data-testid={`alokasi-row-${r.tahun}-${r.bulan}`}>
              <span className="font-semibold text-emerald-950">{r.label}</span>
              <span className="flex items-center gap-2">
                <span className="mono">{rupiah(r.nominal)}</span>
                {r.sisa > 0 ? <span className="text-xs font-semibold text-red-600">kurang {rupiah(r.sisa)}</span> : <span className="text-xs font-semibold text-green-700">lunas</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
