import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { errMsg } from "@/lib/api";

export const selectCls =
  "flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/40 disabled:opacity-50";

export function NativeSelect({ options, placeholder, className = "", ...props }) {
  return (
    <select className={`${selectCls} ${className}`} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Field({ f, value, onChange, testId }) {
  const common = { id: f.name, "data-testid": `${testId}-${f.name}`, required: f.required, disabled: f.disabled };
  if (f.type === "checkbox")
    return (
      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
        <input type="checkbox" className="h-4 w-4 accent-emerald-700" checked={!!value} onChange={(e) => onChange(e.target.checked)} {...common} />
        {f.label}
      </label>
    );
  return (
    <div className="space-y-1.5">
      <Label htmlFor={f.name} className="text-xs font-semibold uppercase tracking-wider text-slate-500">{f.label}</Label>
      {f.type === "select" ? (
        <NativeSelect options={f.options} placeholder={f.placeholder} value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...common} />
      ) : f.type === "textarea" ? (
        <Textarea rows={2} value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...common} />
      ) : (
        <Input type={f.type || "text"} step={f.type === "number" ? "any" : undefined} value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...common} />
      )}
      {f.hint && <p className="text-xs text-slate-500">{f.hint}</p>}
    </div>
  );
}

export function FormDialog({ open, onOpenChange, title, description, fields, initial, onSubmit, submitLabel = "Simpan", testId }) {
  const [v, setV] = useState({});
  const [busy, setBusy] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) setV(initial || {}); }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    const out = { ...v };
    fields.forEach((f) => {
      if (f.type === "number") out[f.name] = out[f.name] === "" || out[f.name] == null ? null : Number(out[f.name]);
      else if (out[f.name] === "") out[f.name] = null;
    });
    setBusy(true);
    try { await onSubmit(out); onOpenChange(false); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl bg-white" data-testid={`${testId}-dialog`}>
        <DialogHeader>
          <DialogTitle className="text-emerald-950">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.filter((f) => !f.show || f.show(v)).map((f) => (
            <div key={f.name} className={f.full ? "sm:col-span-2" : ""}>
              <Field f={f} value={v[f.name]} onChange={(val) => setV((p) => ({ ...p, [f.name]: val }))} testId={testId} />
            </div>
          ))}
          <DialogFooter className="sm:col-span-2 gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid={`${testId}-cancel`}>Batal</Button>
            <Button type="submit" disabled={busy} className="bg-emerald-800 hover:bg-emerald-900" data-testid={`${testId}-submit`}>
              {busy ? "Menyimpan..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
