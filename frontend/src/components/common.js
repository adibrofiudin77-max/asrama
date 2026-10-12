const STYLES = {
  hadir: "bg-green-50 text-green-700 ring-green-600/20",
  lunas: "bg-green-50 text-green-700 ring-green-600/20",
  sakit: "bg-yellow-50 text-yellow-800 ring-yellow-600/30",
  izin: "bg-blue-50 text-blue-700 ring-blue-600/20",
  alpha: "bg-red-50 text-red-700 ring-red-600/20",
  belum: "bg-red-50 text-red-700 ring-red-600/20",
  dibebaskan: "bg-violet-50 text-violet-700 ring-violet-600/20",
  aktif: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  nonaktif: "bg-slate-100 text-slate-600 ring-slate-500/20",
  lulus: "bg-amber-50 text-amber-700 ring-amber-600/30",
  pemasukan: "bg-green-50 text-green-700 ring-green-600/20",
  pengeluaran: "bg-red-50 text-red-700 ring-red-600/20",
};
const LABEL = { belum: "Belum Lunas", lunas: "Lunas", dibebaskan: "Dibebaskan", alpha: "Alpha" };

export function StatusBadge({ status, testId }) {
  return (
    <span data-testid={testId} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset capitalize ${STYLES[status] || STYLES.nonaktif}`}>
      {LABEL[status] || status || "-"}
    </span>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8 anim-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 mb-1">Pondok Pesantren Alhasani</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-950">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2 no-print">{children}</div>}
    </div>
  );
}

export function Card({ className = "", children, ...p }) {
  return <div className={`bg-white border border-slate-200/80 shadow-sm rounded-xl ${className}`} {...p}>{children}</div>;
}

export function Empty({ text = "Belum ada data" }) {
  return <div className="py-10 text-center text-sm text-slate-400">{text}</div>;
}
