import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/PageHeader';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';

const categoryLabels = {
  standard: { label: 'Standard', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  stampa_multipla: { label: 'Stampa Multipla', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  comunicazione: { label: 'Comunicazione', className: 'bg-teal-50 text-teal-700 border-teal-200' },
};

const emptyForm = { name: '', category: 'standard', description: '', active: true, notes: '' };

function ModuloDialog({ open, onOpenChange, modulo, onSave }) {
  const [form, setForm] = useState(emptyForm);

  React.useEffect(() => {
    setForm(modulo ? { ...emptyForm, ...modulo } : emptyForm);
  }, [modulo, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{modulo ? 'Modifica Modello' : 'Nuovo Modello'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="stampa_multipla">Stampa Multipla</SelectItem>
                <SelectItem value="comunicazione">Comunicazione</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descrizione</Label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
          </div>
          <div>
            <Label>Note</Label>
            <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={!!form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="h-4 w-4 accent-primary" />
            <Label htmlFor="active" className="font-normal cursor-pointer">Modello attivo</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">{modulo ? 'Salva' : 'Crea'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const { data: moduli = [] } = useQuery({
    queryKey: ['modulistica'],
    queryFn: () => base44.entities.Modulistica.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.Modulistica.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['modulistica'] }); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Modulistica.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['modulistica'] }); setDialogOpen(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.Modulistica.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modulistica'] }),
  });

  const handleSave = (form) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (m) => { setEditing(m); setDialogOpen(true); };
  const handleNew = () => { setEditing(null); setDialogOpen(true); };

  const filtered = moduli.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || m.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div>
      <PageHeader
        title="Impostazioni"
        description="Gestione della modulistica e configurazioni"
      />

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">Modulistica</h2>
          <Badge variant="outline" className="ml-auto">{moduli.length} modelli</Badge>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <Input
            placeholder="Cerca modello..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le categorie</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="stampa_multipla">Stampa Multipla</SelectItem>
              <SelectItem value="comunicazione">Comunicazione</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleNew} className="ml-auto gap-2">
            <Plus className="h-4 w-4" /> Nuovo modello
          </Button>
        </div>

        <div className="space-y-1.5">
          {filtered.map(m => (
            <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-muted/40 transition-colors">
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${!m.active ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {m.name}
                </span>
              </div>
              <Badge variant="outline" className={`text-xs ${categoryLabels[m.category]?.className}`}>
                {categoryLabels[m.category]?.label}
              </Badge>
              {!m.active && <Badge variant="outline" className="text-xs text-muted-foreground">Inattivo</Badge>}
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(m)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(m.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nessun modello trovato</p>
          )}
        </div>
      </Card>

      <ModuloDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        modulo={editing}
        onSave={handleSave}
      />
    </div>
  );
}