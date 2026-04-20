import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Euro, Tag } from 'lucide-react';

const VAT_OPTIONS = [0, 4, 5, 10, 22];

function CompanyPriceListEditor({ companyPriceList, onSave, onCancel }) {
  const [items, setItems] = useState(companyPriceList?.items || []);

  const updateItem = (i, field, value) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it));
  };
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const addItem = () => setItems(prev => [...prev, { code: '', description: '', amount: '', vat_rate: 22 }]);

  return (
    <div className="space-y-3">
      <div className="hidden sm:grid grid-cols-[80px_1fr_100px_80px_36px] gap-2 px-1">
        <span className="text-xs font-medium text-muted-foreground">Codice</span>
        <span className="text-xs font-medium text-muted-foreground">Descrizione</span>
        <span className="text-xs font-medium text-muted-foreground">Importo €</span>
        <span className="text-xs font-medium text-muted-foreground">IVA %</span>
        <span />
      </div>
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-[80px_1fr_100px_80px_36px] gap-2 items-center">
          <Input value={item.code} onChange={e => updateItem(i, 'code', e.target.value)} placeholder="COD" className="h-8 text-sm" />
          <Input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Descrizione" className="h-8 text-sm" />
          <Input type="number" value={item.amount} onChange={e => updateItem(i, 'amount', e.target.value)} placeholder="0.00" className="h-8 text-sm" step="0.01" />
          <select value={item.vat_rate} onChange={e => updateItem(i, 'vat_rate', Number(e.target.value))} className="h-8 text-sm border border-input rounded-md bg-transparent px-2">
            {VAT_OPTIONS.map(v => <option key={v} value={v}>{v}%</option>)}
          </select>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(i)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItem}>
        <Plus className="h-3.5 w-3.5" /> Aggiungi voce
      </Button>
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button variant="outline" size="sm" onClick={onCancel}>Annulla</Button>
        <Button size="sm" onClick={() => onSave(items.map(it => ({ ...it, amount: Number(it.amount) })))}>
          Salva listino aziendale
        </Button>
      </div>
    </div>
  );
}

export default function CompanyPriceListPanel({ company }) {
  const queryClient = useQueryClient();
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedBaseId, setSelectedBaseId] = useState('');
  const [editing, setEditing] = useState(false);

  const { data: priceLists = [] } = useQuery({
    queryKey: ['priceLists'],
    queryFn: () => base44.entities.PriceList.list('name'),
  });

  const { data: companyPriceLists = [] } = useQuery({
    queryKey: ['companyPriceLists', company.id],
    queryFn: () => base44.entities.CompanyPriceList.filter({ company_id: company.id }),
  });

  const companyPl = companyPriceLists[0] || null;

  const createMutation = useMutation({
    mutationFn: data => base44.entities.CompanyPriceList.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['companyPriceLists', company.id] }); setAssignOpen(false); setEditing(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CompanyPriceList.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['companyPriceLists', company.id] }); setEditing(false); },
  });
  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.CompanyPriceList.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companyPriceLists', company.id] }),
  });

  const handleAssign = () => {
    const base = priceLists.find(pl => pl.id === selectedBaseId);
    if (!base) return;
    createMutation.mutate({
      company_id: company.id,
      company_name: company.name,
      base_price_list_id: base.id,
      base_price_list_name: base.name,
      name: `${base.name} — ${company.name}`,
      items: base.items || [],
    });
  };

  const handleSaveItems = (items) => {
    if (companyPl) updateMutation.mutate({ id: companyPl.id, data: { ...companyPl, items } });
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Listino Prezzi</h2>
        </div>
        {!companyPl && (
          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => setAssignOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Associa listino
          </Button>
        )}
        {companyPl && !editing && (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" /> Modifica
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(companyPl.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {!companyPl && (
        <p className="text-sm text-muted-foreground">Nessun listino associato. Associa un listino base per personalizzare i prezzi per questa azienda.</p>
      )}

      {companyPl && !editing && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-xs">{companyPl.name}</Badge>
            {companyPl.base_price_list_name && (
              <span className="text-xs text-muted-foreground">basato su: {companyPl.base_price_list_name}</span>
            )}
          </div>
          {companyPl.items?.length > 0 ? (
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
                  {companyPl.items.map((item, i) => (
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
          ) : (
            <p className="text-xs text-muted-foreground">Nessuna voce nel listino aziendale.</p>
          )}
        </div>
      )}

      {companyPl && editing && (
        <CompanyPriceListEditor
          companyPriceList={companyPl}
          onSave={handleSaveItems}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* Dialog assegna listino */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Associa listino a {company.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Seleziona listino base</Label>
            {priceLists.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun listino disponibile. Crea prima un listino nelle Impostazioni → Listini.</p>
            ) : (
              <Select value={selectedBaseId} onValueChange={setSelectedBaseId}>
                <SelectTrigger><SelectValue placeholder="Scegli un listino..." /></SelectTrigger>
                <SelectContent>
                  {priceLists.filter(pl => pl.active !== false).map(pl => (
                    <SelectItem key={pl.id} value={pl.id}>{pl.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">Verrà creata una copia del listino selezionato, modificabile indipendentemente per questa azienda.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Annulla</Button>
            <Button onClick={handleAssign} disabled={!selectedBaseId || priceLists.length === 0}>Associa e copia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}