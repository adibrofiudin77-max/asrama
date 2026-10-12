import axios from "axios";

export const api = axios.create({ baseURL: `${process.env.REACT_APP_BACKEND_URL}/api` });

api.interceptors.request.use((c) => {
  const t = localStorage.getItem("alh_token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && !e.config?.url?.includes("/auth/login")) {
      localStorage.removeItem("alh_token");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(e);
  }
);

export function errMsg(e) {
  const d = e?.response?.data?.detail;
  if (!d) return e?.message || "Terjadi kesalahan, coba lagi.";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || JSON.stringify(x)).join(" ");
  return d.msg || String(d);
}

export const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export const rupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

export const tgl = (d) =>
  d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";

export const ymd = (d) => {
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
export const todayStr = () => ymd(new Date());
export const firstOfMonthStr = () => { const d = new Date(); return ymd(new Date(d.getFullYear(), d.getMonth(), 1)); };

const SAT = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
function tb(x) {
  const n = Math.floor(x);
  if (n < 12) return SAT[n];
  if (n < 20) return `${tb(n - 10)} belas`;
  if (n < 100) return `${tb(n / 10)} puluh ${tb(n % 10)}`;
  if (n < 200) return `seratus ${tb(n - 100)}`;
  if (n < 1000) return `${tb(n / 100)} ratus ${tb(n % 100)}`;
  if (n < 2000) return `seribu ${tb(n - 1000)}`;
  if (n < 1e6) return `${tb(n / 1000)} ribu ${tb(n % 1000)}`;
  if (n < 1e9) return `${tb(n / 1e6)} juta ${tb(n % 1e6)}`;
  return `${tb(n / 1e9)} milyar ${tb(n % 1e9)}`;
}
export const terbilang = (n) => {
  const s = `${tb(Number(n) || 0)} rupiah`.replace(/\s+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const ROLE_LABEL = { admin: "Administrator", pengurus: "Pengurus", ustadz: "Ustadz", santri: "Santri" };
