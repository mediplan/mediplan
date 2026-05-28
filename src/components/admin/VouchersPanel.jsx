import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Plus, Copy, Pencil, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const EMPTY = {
  code: '',
  description: '',
  discount_type: 'percent',
  discount_value: '',
  applicable_plans: [],
  max_uses: 0,
  expires_at: '',
  active: true,
  notes: '',
};

const PLANS = ['base', 'standard', 'professional'];

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'MP-';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function VouchersPanel() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['admin-vouchers'],
    queryFn: () => base44.entities.Voucher.list('-created_date', 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editing
        ? base44.entities.Voucher.update(editing.id, data)
        : base44.entities.Voucher.create(data),
    onSuccess: () => { qc.invalidateQueries(['admin-vouchers']); setDialogOpen(false); },
  });

  const toggleMutation = useMutation({
    mutationFn: (v) => base44.entities.Voucher.update(v.id, { active: !v.active }),
    onSuccess: () => qc.invalidateQueries(['admin-vouchers']),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, code: generateCode() });
    setDialogOpen(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm({
      code: v.code || '',
      description: v.description || '',
      discount_type: v.discount_type || 'percent',
      discount_value: v.discount_value ?? '',
      applicable_plans: v.applicable_plans || [],
      max_uses: v.max_uses ?? 0,
      expires_at: v.expires_at || '',
      active: v.active ?? true,
      notes: v.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const data = {
      ...form,
      discount_value: parseFloat(form.discount_value) || 0,
      max_uses: parseInt(form.max_uses) || 0,
      used_count: editing?.used_count ?? 0,
    };
    saveMutation.mutate(data);
  };

  const togglePlan = (plan) => {
    setForm(f => ({
      ...f,
      applicable_plans: f.applicable_plans.includes(plan)
        ? f.applicable_plans.filter(p => p !== plan)
        : [...f.applicable_plans, plan],
    }));
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Voucher & Sconti</h2>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Nuovo voucher
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground p-4">Caricamento…</div>
      ) : vouchers.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Nessun voucher ancora.</CardContent></Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Codice</th>
                <th className="px-4 py-3 text-left">Sconto</th>
                <th className="px-4 py-3 text-left">Piani</th>
                <th className="px-4 py-3 text-left">Utilizzi</th>
                <th className="px-4 py-3 text-left">Scadenza</th>
                <th className="px-4 py-3 text-left">Stato</th>
                <th className="px-4 py-3 text-left">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {vouchers.map(v => (
                <tr key={v.id} className={!v.active ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 font-mono font-semibold">
                    <div className="flex items-center gap-2">
                      {v.code}
                      <button onClick={() => copyCode(v.code)} className="text-muted-foreground hover:text-foreground">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {v.description && <p className="text-xs text-muted-foreground font-sans mt-0.5">{v.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="font-semibold">
                      {v.discount_type === 'percent' ? `${v.discount_value}%` : `€${v.discount_value}`}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {(!v.applicable_plans || v.applicable_plans.length === 0)
                      ? <span className="text-xs text-muted-foreground">Tutti</span>
                      : v.applicable_plans.map(p => (
                          <Badge key={p} variant="secondary" className="mr-1 text-xs capitalize">{p}</Badge>
                        ))}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {v.used_count ?? 0} / {v.max_uses ? v.max_uses : '∞'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {v.expires_at ? format(new Date(v.expires_at), 'd MMM yyyy', { locale: it }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={v.active ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-300'}>
                      {v.active ? 'Attivo' : 'Disattivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(v)} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => toggleMutation.mutate(v)} className="text-muted-foreground hover:text-foreground">
                        {v.active ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifica voucher' : 'Nuovo voucher'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Codice */}
            <div>
              <label className="text-xs font-medium mb-1 block">Codice *</label>
              <div className="flex gap-2">
                <Input
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="MP-XXXX-XXXX"
                  className="font-mono"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => setForm(f => ({ ...f, code: generateCode() }))}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Descrizione */}
            <div>
              <label className="text-xs font-medium mb-1 block">Descrizione</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Es. Promozione maggio 2026" />
            </div>

            {/* Tipo e valore sconto */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block">Tipo sconto *</label>
                <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentuale (%)</SelectItem>
                    <SelectItem value="fixed">Importo fisso (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block">
                  Valore {form.discount_type === 'percent' ? '(%)' : '(€)'} *
                </label>
                <Input
                  type="number"
                  min="0"
                  value={form.discount_value}
                  onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                  placeholder={form.discount_type === 'percent' ? '20' : '30'}
                />
              </div>
            </div>

            {/* Piani applicabili */}
            <div>
              <label className="text-xs font-medium mb-2 block">Piani applicabili (vuoto = tutti)</label>
              <div className="flex gap-2">
                {PLANS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlan(p)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize ${
                      form.applicable_plans.includes(p)
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Max usi + scadenza */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block">Max utilizzi (0 = illimitato)</label>
                <Input type="number" min="0" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block">Scadenza</label>
                <Input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs font-medium mb-1 block">Note interne</label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Note opzionali…" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending || !form.code || !form.discount_value}>
              {saveMutation.isPending ? 'Salvataggio…' : 'Salva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}