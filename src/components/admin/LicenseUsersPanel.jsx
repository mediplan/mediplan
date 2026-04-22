import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, UserCheck } from 'lucide-react';

const MAX_USERS = { base: 1, standard: 3, professional: Infinity };
const ROLE_COLORS = {
  amministratore:     'bg-primary/10 text-primary border-primary/30',
  medico:             'bg-teal-100 text-teal-700 border-teal-300',
  segreteria:         'bg-amber-100 text-amber-700 border-amber-300',
  operatore_sanitario: 'bg-rose-100 text-rose-700 border-rose-300',
};
const STATUS_COLOR = {
  active:    'bg-green-100 text-green-700',
  suspended: 'bg-orange-100 text-orange-700',
  invited:   'bg-blue-100 text-blue-700',
};

export default function LicenseUsersPanel({ licenseId, plan, maxUsers }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('medico');
  const limit = maxUsers ?? MAX_USERS[plan] ?? 1;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['license-users', licenseId],
    queryFn: () => base44.entities.LicenseUser.filter({ license_id: licenseId }),
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.LicenseUser.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['license-users', licenseId] });
      setEmail(''); setFullName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LicenseUser.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['license-users', licenseId] }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.LicenseUser.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['license-users', licenseId] }),
  });

  const canAdd = limit === Infinity || users.length < limit;

  const handleAdd = () => {
    if (!email) return;
    addMutation.mutate({
      license_id: licenseId,
      email,
      full_name: fullName,
      role,
      status: 'invited',
      invited_at: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          Utenti della licenza
          <span className="text-xs text-muted-foreground font-normal">
            ({users.length}/{limit === Infinity ? '∞' : limit})
          </span>
        </h4>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Caricamento...</p>
      ) : users.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nessun utente aggiunto.</p>
      ) : (
        <div className="space-y-1.5">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{u.full_name || u.email}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <Badge className={`text-xs border ${ROLE_COLORS[u.role] || ''}`}>{u.role}</Badge>
              <Badge className={`text-xs ${STATUS_COLOR[u.status] || ''}`}>{u.status}</Badge>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs px-2"
                onClick={() => toggleStatusMutation.mutate({
                  id: u.id,
                  status: u.status === 'active' ? 'suspended' : 'active',
                })}
              >
                {u.status === 'active' ? 'Sospendi' : 'Attiva'}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive"
                onClick={() => deleteMutation.mutate(u.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add user form */}
      {canAdd && (
        <div className="flex gap-2 flex-wrap items-end pt-1 border-t">
          <Input
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="h-7 text-xs flex-1 min-w-[160px]"
          />
          <Input
            placeholder="Nome completo"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="h-7 text-xs flex-1 min-w-[140px]"
          />
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-7 text-xs w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amministratore">Amministratore</SelectItem>
              <SelectItem value="medico">Medico</SelectItem>
              <SelectItem value="segreteria">Segreteria</SelectItem>
              <SelectItem value="operatore_sanitario">Operatore sanitario</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleAdd}
            disabled={!email || addMutation.isPending}
          >
            <Plus className="h-3 w-3" /> Aggiungi
          </Button>
        </div>
      )}
      {!canAdd && (
        <p className="text-xs text-amber-600">
          Limite utenti raggiunto per il piano {plan}. Effettua un upgrade per aggiungere altri utenti.
        </p>
      )}
    </div>
  );
}