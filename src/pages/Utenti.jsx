import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { canAccess, ROLE_LABELS } from '@/lib/roles';
import AccessDenied from '@/components/shared/AccessDenied';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Mail, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ROLE_COLORS = {
  amministratore: 'bg-primary/10 text-primary',
  medico:         'bg-chart-3/10 text-chart-3',
  operatore:      'bg-accent/10 text-accent',
  segreteria:     'bg-secondary text-secondary-foreground',
};

export default function Utenti() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'operatore' });
  const [loading, setLoading] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  if (!canAccess(user, 'utenti')) return <AccessDenied />;

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // inviteUser accetta solo 'admin' o 'user' a livello piattaforma; usiamo 'user' per tutti
      const platformRole = inviteForm.role === 'amministratore' ? 'admin' : 'user';
      await base44.users.inviteUser(inviteForm.email, platformRole);
      toast({ title: 'Invito inviato', description: `${inviteForm.email} è stato invitato come ${ROLE_LABELS[inviteForm.role]}` });
      setInviteOpen(false);
      setInviteForm({ email: '', role: 'operatore' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err) {
      toast({ title: 'Errore', description: err.message || 'Impossibile inviare l\'invito', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    await base44.entities.User.update(userId, { role: newRole });
    queryClient.invalidateQueries({ queryKey: ['users'] });
    toast({ title: 'Ruolo aggiornato' });
  };

  return (
    <div>
      <PageHeader
        title="Gestione Utenti"
        description="Invita e gestisci gli utenti del sistema"
        action={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invita utente
          </Button>
        }
      />

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
                      {u.id === user?.id ? (
                        <Badge className={ROLE_COLORS[u.role] || ''}>
                          <Shield className="h-3 w-3 mr-1" />
                          {ROLE_LABELS[u.role] || u.role}
                        </Badge>
                      ) : (
                        <Select
                          value={u.role || 'operatore'}
                          onValueChange={val => handleRoleChange(u.id, val)}
                        >
                          <SelectTrigger className="h-7 text-xs w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="amministratore">Amministratore</SelectItem>
                            <SelectItem value="medico">Medico Incaricato</SelectItem>
                            <SelectItem value="operatore">Operatore Sanitario</SelectItem>
                            <SelectItem value="segreteria">Segreteria</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.created_date ? new Date(u.created_date).toLocaleDateString('it-IT') : '—'}
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
              <Input
                type="email"
                placeholder="esempio@email.com"
                value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Ruolo *</Label>
              <Select value={inviteForm.role} onValueChange={val => setInviteForm(f => ({ ...f, role: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amministratore">Amministratore</SelectItem>
                  <SelectItem value="medico">Medico Incaricato</SelectItem>
                  <SelectItem value="operatore">Operatore Sanitario</SelectItem>
                  <SelectItem value="segreteria">Segreteria</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {inviteForm.role === 'amministratore' && 'Accesso completo + gestione utenti e medici incaricati.'}
                {inviteForm.role === 'medico' && 'Dati clinici delle aziende dove è nominato medico incaricato.'}
                {inviteForm.role === 'operatore' && 'Accesso ad aziende, lavoratori e accertamenti integrativi.'}
                {inviteForm.role === 'segreteria' && 'Accesso ad aziende, lavoratori (no dati clinici), scadenze e fatturazione.'}
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Annulla</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Invio...' : 'Invia invito'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}