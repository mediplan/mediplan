import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, Stethoscope, Activity, FlaskConical } from 'lucide-react';

const CATEGORIES = [
  {
    key: 'prestazione_medica',
    label: 'Prestazioni Mediche',
    icon: Stethoscope,
    color: 'text-primary',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    key: 'accertamento_strumentale',
    label: 'Accertamenti Strumentali',
    icon: Activity,
    color: 'text-chart-2',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    key: 'esame_laboratorio',
    label: 'Esami di Laboratorio',
    icon: FlaskConical,
    color: 'text-chart-3',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
  },
];

function ExamDialog({ open, onOpenChange, exam, defaultCategory, onSave }) {
  const [form, setForm] = useState({ name: '', category: defaultCategory || 'prestazione_medica', notes: '', active: true });

  React.useEffect(() => {
    setForm(exam
      ? { name: exam.name, category: exam.category, notes: exam.notes || '', active: exam.active !== false }
      : { name: '', category: defaultCategory || 'prestazione_medica', notes: '', active: true }
    );
  }, [exam, open, defaultCategory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{exam ? 'Modifica accertamento' : 'Nuovo accertamento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-3">
          <div>
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required autoFocus />
          </div>
          <div>
            <Label>Note</Label>
            <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="exam-active" checked={!!form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="h-4 w-4 accent-primary" />
            <Label htmlFor="exam-active" className="font-normal cursor-pointer">Voce attiva</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">{exam ? 'Salva' : 'Crea'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategorySection({ category, exams, onAdd, onEdit, onDelete }) {
  const Icon = category.icon;
  const [search, setSearch] = useState('');

  const filtered = exams.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${category.color}`} />
          <span className="font-semibold text-sm">{category.label}</span>
          <Badge variant="outline" className="text-xs">{exams.length}</Badge>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onAdd(category.key)}>
          <Plus className="h-3 w-3" /> Aggiungi
        </Button>
      </div>
      <div className="p-3 space-y-2">
        {exams.length > 5 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cerca..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        )}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">
            {exams.length === 0 ? 'Nessuna voce. Clicca "Aggiungi" per iniziare.' : 'Nessun risultato.'}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(exam => (
              <div key={exam.id} className="flex items-center gap-2 py-2 group">
                <span className={`text-sm flex-1 ${!exam.active ? 'text-muted-foreground line-through' : ''}`}>{exam.name}</span>
                {!exam.active && <Badge variant="outline" className="text-xs text-muted-foreground">Inattivo</Badge>}
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(exam)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onDelete(exam.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccertamentiTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [defaultCategory, setDefaultCategory] = useState('prestazione_medica');

  const { data: exams = [] } = useQuery({
    queryKey: ['medicalExamCatalog'],
    queryFn: () => base44.entities.MedicalExamCatalog.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.MedicalExamCatalog.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['medicalExamCatalog'] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MedicalExamCatalog.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['medicalExamCatalog'] }); setDialogOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.MedicalExamCatalog.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medicalExamCatalog'] }),
  });

  const handleAdd = (category) => {
    setEditing(null);
    setDefaultCategory(category);
    setDialogOpen(true);
  };

  const handleEdit = (exam) => {
    setEditing(exam);
    setDefaultCategory(exam.category);
    setDialogOpen(true);
  };

  const handleSave = (form) => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <p className="text-sm text-muted-foreground">
        Configura il catalogo degli accertamenti disponibili. Saranno selezionabili durante la compilazione delle mansioni e delle visite mediche.
      </p>

      {CATEGORIES.map(cat => (
        <CategorySection
          key={cat.key}
          category={cat}
          exams={exams.filter(e => e.category === cat.key)}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={id => deleteMutation.mutate(id)}
        />
      ))}

      <ExamDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        exam={editing}
        defaultCategory={defaultCategory}
        onSave={handleSave}
      />
    </div>
  );
}