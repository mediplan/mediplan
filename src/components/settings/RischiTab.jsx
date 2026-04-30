import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

const emptyForm = { name: '', category: '', notes: '', active: true };

function RiskDialog({ open, onOpenChange, risk, onSave }) {
  const [form, setForm] = useState(emptyForm);

  React.useEffect(() => {
    setForm(risk ? { ...emptyForm, ...risk } : emptyForm);
  }, [risk, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{risk ? 'Modifica Rischio' : 'Nuovo Rischio'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-3">
          <div>
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <Label>Categoria</Label>
            <Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="es. chimico, fisico, biologico..." />
          </div>
          <div>
            <Label>Note</Label>
            <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="risk-active" checked={!!form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="h-4 w-4 accent-primary" />
            <Label htmlFor="risk-active" className="font-normal cursor-pointer">Voce attiva</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">{risk ? 'Salva' : 'Crea'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function RischiTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const { data: risks = [] } = useQuery({
    queryKey: ['riskCatalog'],
    queryFn: () => base44.entities.RiskCatalog.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.RiskCatalog.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['riskCatalog'] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RiskCatalog.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['riskCatalog'] }); setDialogOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.RiskCatalog.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['riskCatalog'] }),
  });

  const handleSave = (form) => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const filtered = risks.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca rischio..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nuovo Rischio
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline">{risks.length} rischi totali</Badge>
      </div>

      <div className="space-y-1.5">
        {filtered.map(r => (
          <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-muted/40 transition-colors">
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${!r.active ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {r.name}
              </span>
              {r.category && (
                <span className="text-xs text-muted-foreground ml-2">— {r.category}</span>
              )}
            </div>
            {!r.active && <Badge variant="outline" className="text-xs text-muted-foreground">Inattivo</Badge>}
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(r); setDialogOpen(true); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(r.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nessun rischio trovato</p>
        )}
      </div>

      <RiskDialog open={dialogOpen} onOpenChange={setDialogOpen} risk={editing} onSave={handleSave} />
    </div>
  );
}