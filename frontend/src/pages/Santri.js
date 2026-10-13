import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, KeyRound, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, errMsg, tgl, todayStr, TINGKAT, JURUSAN, kelasLabel } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Card, Empty, StatusBadge } from "@/components/common";
import { FormDialog, NativeSelect } from "@/components/FormDialog";

const TINGKAT_OPTS = TINGKAT.map((k) => ({ value: k, label: `Kelas ${k}` }));
const JURUSAN_OPTS = JURUSAN.map((k) => ({ value: k, label: k }));

function santriFields(kamar, isEdit) {
  const f = [
    { name: "nis", label: "NIS", required: true, disabled: isEdit },
    { name: "nama", label: "Nama Lengkap", required: true },
    { name: "jenis_kelamin", label: "Jenis Kelamin", type: "select", options: [{ value: "L", label: "Laki-laki" }, { value: "P", label: "Perempuan" }] },
    { name: "kelas", label: "Tingkat Kelas", type: "select", options: TINGKAT_OPTS },
    { name: "program_keahlian", label: "Program Keahlian", type: "select", placeholder: "- Pilih program keahlian -", options: JURUSAN_OPTS },
    { name: "tempat_lahir", label: "Tempat Lahir" },
    { name: "tanggal_lahir", label: "Tanggal Lahir", type: "date" },
    { name: "id_kamar", label: "Kamar", type: "select", placeholder: "- Pilih kamar -", options: kamar.map((k) => ({ value: k.id_kamar, label: k.nama_kamar })) },
    { name: "tanggal_daftar", label: "Tanggal Daftar", type: "date", required: true, hint: "Tagihan bulanan mulai 1 bulan setelah tanggal ini" },
    { name: "nama_bapak", label: "Nama Bapak" },
    { name: "nama_ibu", label: "Nama Ibu" },
    { name: "no_hp_santri", label: "No. HP Santri" },
    { name: "no_hp_ortu", label: "No. HP Orang Tua" },
    { name: "alamat", label: "Alamat", type: "textarea", full: true },
  ];
  if (isEdit) f.push({ name: "status", label: "Status", type: "select", options: ["aktif", "nonaktif", "lulus"].map((s) => ({ value: s, label: s })) });
  else f.push(
    { name: "bayar_pendaftaran", label: "Bayar biaya pendaftaran sekarang (Rp 150.000)", type: "checkbox", full: true },
    { name: "nominal_pendaftaran", label: "Nominal Pendaftaran", type: "number", show: (v) => v.bayar_pendaftaran },
  );
  return f;
}

export default function Santri() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [kamar, setKamar] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("aktif");
  const [kelas, setKelas] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [dlg, setDlg] = useState(null);

  const load = useCallback(() => {
    api.get("/santri", { params: { status: status || undefined, kelas: kelas || undefined, jurusan: jurusan || undefined } }).then((r) => setRows(r.data)).catch((e) => toast.error(errMsg(e)));
  }, [status, kelas, jurusan]);
  useEffect(load, [load]);
  useEffect(() => { api.get("/kamar").then((r) => setKamar(r.data)); }, []);

  const filtered = useMemo(() => rows.filter((r) => !q || r.nama.toLowerCase().includes(q.toLowerCase()) || r.nis.includes(q)), [rows, q]);

  const submit = async (v) => {
    const body = { ...v, id_kamar: v.id_kamar ? Number(v.id_kamar) : null };
    if (dlg.edit) {
      await api.put(`/santri/${dlg.edit.nis}`, body);
      toast.success("Data santri diperbarui");
    } else {
      const { data } = await api.post("/santri", body);
      toast.success(`Santri ${v.nama} terdaftar. Login: NIS ${data.nis} / 111111`);
      if (data.pembayaran) window.open(`/kwitansi/${data.pembayaran.id_pembayaran}`, "_blank");
    }
    load();
  };

  const remove = async (s) => {
    if (!window.confirm(`Hapus santri ${s.nama}? Semua data pembayaran & kehadiran ikut terhapus.`)) return;
    try { await api.delete(`/santri/${s.nis}`); toast.success("Santri dihapus"); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const resetPw = async (s) => {
    try { await api.post(`/santri/${s.nis}/reset-password`); toast.success(`Password ${s.nama} direset ke 111111`); } catch (e) { toast.error(errMsg(e)); }
  };

  const initialNew = { jenis_kelamin: "L", kelas: "X", tanggal_daftar: todayStr(), bayar_pendaftaran: true, nominal_pendaftaran: 150000 };

  return (
    <div>
      <PageHeader title="Data Santri" subtitle={`${filtered.length} santri ditampilkan`}>
        <Button onClick={() => setDlg({ edit: null })} className="bg-emerald-800 hover:bg-emerald-900" data-testid="santri-add-button"><Plus className="h-4 w-4 mr-1" /> Pendaftaran Santri Baru</Button>
      </PageHeader>

      <Card className="p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau NIS..." className="pl-9" data-testid="santri-search-input" />
        </div>
        <NativeSelect className="sm:w-44" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Semua status" data-testid="santri-filter-status"
          options={["aktif", "nonaktif", "lulus"].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
        <NativeSelect className="sm:w-44" value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="Semua tingkat" options={TINGKAT_OPTS} data-testid="santri-filter-kelas" />
        <NativeSelect className="sm:w-44" value={jurusan} onChange={(e) => setJurusan(e.target.value)} placeholder="Semua program" options={JURUSAN_OPTS} data-testid="santri-filter-jurusan" />
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="santri-table">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr><th className="px-4 py-3">NIS</th><th className="px-4 py-3">Nama</th><th className="px-4 py-3">L/P</th><th className="px-4 py-3">Kelas</th><th className="px-4 py-3">Kamar</th><th className="px-4 py-3">Tgl Daftar</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s) => (
              <tr key={s.nis} className="hover:bg-emerald-50/40 transition-colors" data-testid={`santri-row-${s.nis}`}>
                <td className="px-4 py-3 mono text-xs">{s.nis}</td>
                <td className="px-4 py-3 font-semibold">{s.nama}<p className="text-xs font-normal text-slate-500">{s.no_hp_ortu || ""}</p></td>
                <td className="px-4 py-3">{s.jenis_kelamin}</td>
                <td className="px-4 py-3 whitespace-nowrap">{kelasLabel(s)}</td>
                <td className="px-4 py-3">{s.nama_kamar || "-"}</td>
                <td className="px-4 py-3 whitespace-nowrap">{tgl(s.tanggal_daftar)}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" title="Tagihan" onClick={() => nav(`/pembayaran?nis=${s.nis}`)} data-testid={`santri-tagihan-${s.nis}`}><Wallet className="h-4 w-4" /></Button>
                    {isAdmin && <>
                      <Button size="sm" variant="ghost" title="Edit" onClick={() => setDlg({ edit: s })} data-testid={`santri-edit-${s.nis}`}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" title="Reset password" onClick={() => resetPw(s)} data-testid={`santri-resetpw-${s.nis}`}><KeyRound className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" title="Hapus" className="text-red-600" onClick={() => remove(s)} data-testid={`santri-delete-${s.nis}`}><Trash2 className="h-4 w-4" /></Button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <Empty text="Tidak ada santri" />}
      </Card>

      <FormDialog open={!!dlg} onOpenChange={(o) => !o && setDlg(null)} testId="santri-form"
        title={dlg?.edit ? `Edit Santri: ${dlg.edit.nama}` : "Pendaftaran Santri Baru"}
        description={dlg?.edit ? null : "Akun santri otomatis dibuat (login NIS, password 111111)."}
        fields={santriFields(kamar, !!dlg?.edit)}
        initial={dlg?.edit ? { ...dlg.edit, id_kamar: dlg.edit.id_kamar ?? "", program_keahlian: dlg.edit.program_keahlian ?? "" } : initialNew}
        onSubmit={submit} submitLabel={dlg?.edit ? "Simpan" : "Daftarkan"} />
    </div>
  );
}
