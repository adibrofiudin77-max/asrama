import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, errMsg } from "@/lib/api";
import { PageHeader, Card, Empty } from "@/components/common";
import { FormDialog } from "@/components/FormDialog";

function CrudTable({ path, idKey, columns, fields, title, testId }) {
  const [rows, setRows] = useState([]);
  const [dlg, setDlg] = useState(null);
  const load = useCallback(() => api.get(path).then((r) => setRows(r.data)).catch((e) => toast.error(errMsg(e))), [path]);
  useEffect(() => { load(); }, [load]);

  const submit = async (v) => {
    if (dlg[idKey]) await api.put(`${path}/${dlg[idKey]}`, v); else await api.post(path, v);
    toast.success(`${title} disimpan`); load();
  };
  const del = async (r) => {
    if (!window.confirm(`Hapus ${title.toLowerCase()} ini?`)) return;
    try { await api.delete(`${path}/${r[idKey]}`); toast.success(`${title} dihapus`); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <Card className="overflow-x-auto">
      <div className="flex justify-between items-center p-4 border-b">
        <p className="font-bold text-emerald-950">{rows.length} {title}</p>
        <Button size="sm" className="bg-emerald-800 hover:bg-emerald-900" onClick={() => setDlg({})} data-testid={`${testId}-add-btn`}><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
      </div>
      {rows.length === 0 ? <Empty /> : (
        <table className="w-full text-sm" data-testid={`${testId}-table`}>
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>{columns.map((c) => <th key={c.k} className="px-4 py-3">{c.l}</th>)}<th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r[idKey]} data-testid={`${testId}-row-${r[idKey]}`}>
                {columns.map((c) => <td key={c.k} className="px-4 py-2.5">{r[c.k] ?? "-"}</td>)}
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => setDlg(r)} data-testid={`${testId}-edit-${r[idKey]}`}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => del(r)} data-testid={`${testId}-delete-${r[idKey]}`}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <FormDialog open={!!dlg} onOpenChange={(o) => !o && setDlg(null)} title={`${dlg?.[idKey] ? "Edit" : "Tambah"} ${title}`} fields={fields} initial={dlg} onSubmit={submit} testId={`${testId}-form`} />
    </Card>
  );
}

export default function Master() {
  return (
    <div>
      <PageHeader title="Kamar & Ustadz" subtitle="Data master pondok" />
      <Tabs defaultValue="kamar">
        <TabsList className="mb-6"><TabsTrigger value="kamar" data-testid="master-tab-kamar">Kamar</TabsTrigger><TabsTrigger value="ustadz" data-testid="master-tab-ustadz">Ustadz</TabsTrigger></TabsList>
        <TabsContent value="kamar">
          <CrudTable path="/kamar" idKey="id_kamar" title="Kamar" testId="kamar"
            columns={[{ k: "nama_kamar", l: "Nama Kamar" }, { k: "jumlah", l: "Santri Aktif" }]}
            fields={[{ name: "nama_kamar", label: "Nama Kamar", required: true, full: true }]} />
        </TabsContent>
        <TabsContent value="ustadz">
          <CrudTable path="/ustadz" idKey="id_ustadz" title="Ustadz" testId="ustadz"
            columns={[{ k: "nama_ustadz", l: "Nama" }, { k: "no_hp", l: "No. HP" }, { k: "alamat", l: "Alamat" }]}
            fields={[{ name: "nama_ustadz", label: "Nama Ustadz", required: true }, { name: "no_hp", label: "No. HP" }, { name: "alamat", label: "Alamat", type: "textarea", full: true }]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
