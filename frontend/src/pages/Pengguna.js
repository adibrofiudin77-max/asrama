import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, errMsg, ROLE_LABEL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Card } from "@/components/common";
import { FormDialog } from "@/components/FormDialog";

const ROLES = ["admin", "pengurus", "ustadz"].map((r) => ({ value: r, label: ROLE_LABEL[r] }));
const ROLE_CLS = { admin: "bg-amber-100 text-amber-800", pengurus: "bg-emerald-100 text-emerald-800", ustadz: "bg-blue-100 text-blue-800" };

export default function Pengguna() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [dlg, setDlg] = useState(null);
  const [pw, setPw] = useState(null);
  const load = useCallback(() => api.get("/users").then((r) => setRows(r.data)).catch((e) => toast.error(errMsg(e))), []);
  useEffect(() => { load(); }, [load]);

  const isEdit = !!dlg?.id;
  const fields = [
    { name: "name", label: "Nama (tampil di tanda tangan kwitansi)", required: true, full: true },
    { name: "email", label: "Email Login", type: "email", required: true },
    { name: "role", label: "Peran", type: "select", options: ROLES, disabled: isEdit },
    { name: "no_hp", label: "No. HP" },
    ...(isEdit ? [] : [{ name: "password", label: "Password (min. 6)", type: "password", required: true }]),
  ];

  const submit = async (v) => {
    if (isEdit) await api.put(`/users/${dlg.id}`, v); else await api.post("/users", v);
    toast.success("Pengguna disimpan"); load();
  };
  const del = async (u) => {
    if (!window.confirm(`Hapus akun ${u.name}?`)) return;
    try { await api.delete(`/users/${u.id}`); toast.success("Akun dihapus"); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader title="Pengguna" subtitle="Akun Administrator, Pengurus, dan Ustadz. Akun santri dibuat otomatis saat pendaftaran.">
        <Button className="bg-emerald-800 hover:bg-emerald-900" onClick={() => setDlg({ role: "pengurus" })} data-testid="user-add-btn"><Plus className="h-4 w-4 mr-1" /> Tambah Akun</Button>
      </PageHeader>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="user-table">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Peran</th><th className="px-4 py-3">No. HP</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((u) => (
              <tr key={u.id} data-testid={`user-row-${u.id}`}>
                <td className="px-4 py-2.5 font-semibold">{u.name}{u.id === user.id && <span className="ml-2 text-xs text-amber-600">(Anda)</span>}</td>
                <td className="px-4 py-2.5 mono text-xs">{u.email}</td>
                <td className="px-4 py-2.5"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_CLS[u.role]}`}>{ROLE_LABEL[u.role]}</span></td>
                <td className="px-4 py-2.5">{u.no_hp || "-"}</td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => setDlg(u)} data-testid={`user-edit-${u.id}`}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setPw(u)} data-testid={`user-password-${u.id}`}><KeyRound className="h-4 w-4" /></Button>
                  {u.id !== user.id && <Button size="sm" variant="ghost" className="text-red-600" onClick={() => del(u)} data-testid={`user-delete-${u.id}`}><Trash2 className="h-4 w-4" /></Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <FormDialog open={!!dlg} onOpenChange={(o) => !o && setDlg(null)} title={isEdit ? "Edit Akun" : "Tambah Akun"} fields={fields} initial={dlg} onSubmit={submit} testId="user-form" />
      <FormDialog open={!!pw} onOpenChange={(o) => !o && setPw(null)} title={`Atur Password: ${pw?.name || ""}`} testId="user-pw-form"
        fields={[{ name: "password", label: "Password Baru (min. 6)", type: "password", required: true, full: true }]} initial={{}}
        onSubmit={async (v) => { await api.post(`/users/${pw.id}/password`, v); toast.success("Password diperbarui"); }} />
    </div>
  );
}
