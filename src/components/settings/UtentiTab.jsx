import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ROLE_LABELS } from '@/lib/roles';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Mail, Shield, Pencil } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ROLE_COLORS = {
  admin:          'bg-primary/10 text-primary',
  amministratore: 'bg-primary/10 text-primary',
  medico:         'bg-chart-3/10 text-chart-3',
  operatore:      'bg-accent/10 text-accent',
  segreteria:     'bg-secondary text-secondary-foreground',
};

const emptyInvite = { email: '', role: 'operatore' };
const emptyEdit   = { role: 'operatore' };

export default function UtentiTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [inviteOpen, setInviteOpen]   = useState(false);
  const [inviteForm, setInviteForm]   = useState(emptyInvite);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [editOpen, setEditOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState(null); // { id, full_name, email, role }
  const [editForm, setEditForm]       = useState(emptyEdit);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.User.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Utente aggiornato' });
      setEditOpen(false);
      setEditTarget(null);
    },
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const platformRole = inviteForm.role === 'amministratore' ? 'admin' : 'user';
      await base44.users.inviteUser(inviteForm.email, platformRole);
      toast({ title: 'Invito inviato', description: `${inviteForm.email} invitato come ${ROLE_LABELS[inviteForm.role]}` });
      setInviteOpen(false);
      setInviteForm(emptyInvite);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err) {
      toast({ title: 'Errore', description: err.message || 'Impossibile inviare l\'invito', variant: 'destructive' });
    } finally {
      setInviteLoading(false);
    }
  };

  const openEdit = (u) => {
    setEditTarget(u);
    setEditForm({ role: u.role || 'operatore' });
    setEditOpen(true);
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    updateMutation.mutate({ id: editTarget.id, role: editForm.role });
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" /> Invita utente
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Caricamento...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Registrato</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-sm">{u.full_name || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        {u.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={ROLE_COLORS[u.role] || ''}>
                        <Shield className="h-3 w-3 mr-1" />
                        {ROLE_LABELS[u.role] || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.created_date ? new Date(u.created_date).toLocaleDateString('it-IT') : '—'}
                    </TableCell>
                    <TableCell>
                      {u.id !== user?.id && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog invito */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invita nuovo utente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <Label>Email *</Label>
              <Input type="email" placeholder="esempio@email.com"
                value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Ruolo *</Label>
              <Select value={inviteForm.role} onValueChange={val => setInviteForm(f => ({ ...f, role: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="amministratore">Amministratore</SelectItem>
                  <SelectItem value="medico">Medico Incaricato</SelectItem>
                  <SelectItem value="operatore">Operatore Sanitario</SelectItem>
                  <SelectItem value="segreteria">Segreteria</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {inviteForm.role === 'amministratore' && 'Accesso completo + gestione utenti e medici incaricati.'}
                {inviteForm.role === 'medico' && 'Dati clinici solo per le aziende di cui è medico incaricato.'}
                {inviteForm.role === 'operatore' && 'Accesso ad aziende, lavoratori e accertamenti integrativi.'}
                {inviteForm.role === 'segreteria' && 'Accesso ad aziende, lavoratori (no dati clinici), scadenze e fatturazione.'}
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Annulla</Button>
              <Button type="submit" disabled={inviteLoading}>{inviteLoading ? 'Invio...' : 'Invia invito'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog modifica utente */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Modifica utente</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <p className="text-sm font-medium">{editTarget.full_name || editTarget.email}</p>
                <p className="text-xs text-muted-foreground">{editTarget.email}</p>
              </div>
              <div>
                <Label>Ruolo</Label>
                <Select value={editForm.role} onValueChange={val => setEditForm(f => ({ ...f, role: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amministratore">Amministratore</SelectItem>
                    <SelectItem value="medico">Medico Incaricato</SelectItem>
                    <SelectItem value="operatore">Operatore Sanitario</SelectItem>
                    <SelectItem value="segreteria">Segreteria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Annulla</Button>
                <Button type="submit" disabled={updateMutation.isPending}>Salva</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}