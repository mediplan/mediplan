import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Copy, ChevronDown, ChevronRight, Euro } from 'lucide-react';

const VAT_OPTIONS = [0, 4, 5, 10, 22];

const emptyItem = { code: '', description: '', amount: '', vat_rate: 22 };

function PriceListItemsEditor({ items, onChange }) {
  const addItem = () => onChange([...items, { ...emptyItem }]);
  const updateItem = (i, field, value) => {
    const updated = items.map((it, idx) => idx === i ? { ...it, [field]: value } : it);
    onChange(updated);
  };
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="hidden sm:grid grid-cols-[80px_1fr_100px_80px_36px] gap-2 px-1">
        <span className="text-xs font-medium text-muted-foreground">Codice</span>
        <span className="text-xs font-medium text-muted-foreground">Descrizione</span>
        <span className="text-xs font-medium text-muted-foreground">Importo €</span>
        <span className="text-xs font-medium text-muted-foreground">IVA %</span>
        <span />
      </div>
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-[80px_1fr_100px_80px_36px] gap-2 items-center">
          <Input
            value={item.code}
            onChange={e => updateItem(i, 'code', e.target.value)}
            placeholder="COD"
            className="h-8 text-sm"
          />
          <Input
            value={item.description}
            onChange={e => updateItem(i, 'description', e.target.value)}
            placeholder="Descrizione"
            className="h-8 text-sm"
          />
          <Input
            type="number"
            value={item.amount}
            onChange={e => updateItem(i, 'amount', e.target.value)}
            placeholder="0.00"
            className="h-8 text-sm"
            step="0.01"
          />
          <select
            value={item.vat_rate}
            onChange={e => updateItem(i, 'vat_rate', Number(e.target.value))}
            className="h-8 text-sm border border-input rounded-md bg-transparent px-2"
          >
            {VAT_OPTIONS.map(v => <option key={v} value={v}>{v}%</option>)}
          </select>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(i)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-1.5 mt-1" onClick={addItem}>
        <Plus className="h-3.5 w-3.5" /> Aggiungi voce
      </Button>
    </div>
  );
}

function PriceListDialog({ open, onOpenChange, priceList, onSave }) {
  const [form, setForm] = useState({ name: '', description: '', active: true, items: [] });

  React.useEffect(() => {
    setForm(priceList
      ? { name: priceList.name || '', description: priceList.description || '', active: priceList.active !== false, items: priceList.items || [] }
      : { name: '', description: '', active: true, items: [] }
    );
  }, [priceList, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{priceList ? 'Modifica Listino' : 'Nuovo Listino'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave({ ...form, items: form.items.map(it => ({ ...it, amount: Number(it.amount) })) }); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome listino *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <Label>Descrizione</Label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Voci del listino</Label>
            <PriceListItemsEditor items={form.items} onChange={items => setForm(p => ({ ...p, items }))} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pl-active" checked={!!form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="h-4 w-4 accent-primary" />
            <Label htmlFor="pl-active" className="font-normal cursor-pointer">Listino attivo</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">{priceList ? 'Salva' : 'Crea'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PriceListsTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [expanded, setExpanded] = useState({});

  const { data: priceLists = [] } = useQuery({
    queryKey: ['priceLists'],
    queryFn: () => base44.entities.PriceList.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.PriceList.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['priceLists'] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PriceList.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['priceLists'] }); setDialogOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.PriceList.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['priceLists'] }); setDeleteId(null); },
  });
  const duplicateMutation = useMutation({
    mutationFn: pl => base44.entities.PriceList.create({ ...pl, id: undefined, name: `${pl.name} (copia)` }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['priceLists'] }),
  });

  const handleSave = (form) => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Gestisci i listini prezzi da associare alle aziende.</p>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nuovo Listino
        </Button>
      </div>

      {priceLists.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground text-sm border-dashed">
          Nessun listino creato. Crea il primo listino per associarlo alle aziende.
        </Card>
      )}

      <div className="space-y-3">
        {priceLists.map(pl => (
          <Card key={pl.id} className="overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <button onClick={() => toggleExpand(pl.id)} className="text-muted-foreground hover:text-foreground">
                {expanded[pl.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-semibold ${!pl.active ? 'text-muted-foreground line-through' : ''}`}>{pl.name}</span>
                {pl.description && <span className="text-xs text-muted-foreground ml-2">{pl.description}</span>}
              </div>
              <Badge variant="outline" className="text-xs">{pl.items?.length || 0} voci</Badge>
              {!pl.active && <Badge variant="outline" className="text-xs text-muted-foreground">Inattivo</Badge>}
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Duplica" onClick={() => duplicateMutation.mutate(pl)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(pl); setDialogOpen(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(pl.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {expanded[pl.id] && pl.items?.length > 0 && (
              <div className="border-t border-border bg-muted/20 px-4 py-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="text-left pb-2 font-medium w-20">Codice</th>
                        <th className="text-left pb-2 font-medium">Descrizione</th>
                        <th className="text-right pb-2 font-medium w-24">Importo</th>
                        <th className="text-right pb-2 font-medium w-16">IVA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {pl.items.map((item, i) => (
                        <tr key={i}>
                          <td className="py-1.5 text-muted-foreground font-mono">{item.code}</td>
                          <td className="py-1.5">{item.description}</td>
                          <td className="py-1.5 text-right font-medium">
                            <span className="flex items-center justify-end gap-0.5">
                              <Euro className="h-3 w-3 text-muted-foreground" />{Number(item.amount).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-1.5 text-right text-muted-foreground">{item.vat_rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <PriceListDialog open={dialogOpen} onOpenChange={setDialogOpen} priceList={editing} onSave={handleSave} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina listino</AlertDialogTitle>
            <AlertDialogDescription>Sei sicuro di voler eliminare questo listino? Le aziende che lo utilizzano non saranno più associate.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}