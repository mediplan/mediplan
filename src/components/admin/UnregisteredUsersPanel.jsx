import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserX, Plus, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

export default function UnregisteredUsersPanel() {
  const qc = useQueryClient();
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [forms, setForms] = useState({}); // { userId: { company_name, plan, action } }
  const [processing, setProcessing] = useState({});

  // Tutti gli utenti Base44
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  // Tutti i LicenseUser esistenti
  const { data: allLicenseUsers = [], isLoading: loadingLU } = useQuery({
    queryKey: ['all-license-users'],
    queryFn: () => base44.entities.LicenseUser.list(),
  });

  // Tutte le licenze
  const { data: allLicenses = [] } = useQuery({
    queryKey: ['admin-licenses'],
  });

  // Utenti senza LicenseUser
  const registeredEmails = new Set(allLicenseUsers.map(lu => lu.email));
  const unregistered = allUsers.filter(u => u.role !== 'admin' && !registeredEmails.has(u.email));

  const getForm = (userId) => forms[userId] || { company_name: '', plan: 'professional', role: 'amministratore' };
  const setForm = (userId, field, val) => setForms(f => ({
    ...f,
    [userId]: { ...getForm(userId), [field]: val },
  }));

  const handleCreateTrial = async (user) => {
    const form = getForm(user.id);
    setProcessing(p => ({ ...p, [user.id]: true }));
    try {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      const license = await base44.entities.License.create({
        plan: form.plan,
        billing_cycle: 'monthly',
        status: 'trial',
        admin_name: user.full_name,
        admin_email: user.email,
        admin_user_id: user.id,
        company_name: form.company_name || user.full_name,
        trial_end: trialEnd.toISOString().split('T')[0],
        max_users: form.plan === 'base' ? 1 : form.plan === 'standard' ? 3 : -1,
        tenant_id: user.id,
      });

      await base44.entities.LicenseUser.create({
        license_id: license.id,
        tenant_id: user.id,
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: form.role,
        status: 'active',
        activated_at: new Date().toISOString(),
      });

      qc.invalidateQueries({ queryKey: ['all-license-users'] });
      qc.invalidateQueries({ queryKey: ['admin-licenses'] });
      setExpandedUserId(null);
    } catch (e) {
      alert('Errore: ' + e.message);
    }
    setProcessing(p => ({ ...p, [user.id]: false }));
  };

  const handleAddToExisting = async (user) => {
    const form = getForm(user.id);
    if (!form.existing_license_id) return;
    setProcessing(p => ({ ...p, [user.id]: true }));
    try {
      const lic = allLicenses.find(l => l.id === form.existing_license_id);
      await base44.entities.LicenseUser.create({
        license_id: form.existing_license_id,
        tenant_id: lic?.tenant_id || form.existing_license_id,
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: form.role,
        status: 'active',
        activated_at: new Date().toISOString(),
      });
      qc.invalidateQueries({ queryKey: ['all-license-users'] });
      setExpandedUserId(null);
    } catch (e) {
      alert('Errore: ' + e.message);
    }
    setProcessing(p => ({ ...p, [user.id]: false }));
  };

  const isLoading = loadingUsers || loadingLU;

  return (
    <Card className="border-orange-300/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserX className="h-4 w-4 text-orange-600" />
          Utenti senza licenza
          {!isLoading && (
            <Badge className="ml-1 bg-orange-100 text-orange-700 border-orange-300">
              {unregistered.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Caricamento...</p>
        ) : unregistered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Tutti gli utenti hanno una licenza assegnata.</p>
        ) : (
          <div className="divide-y">
            {unregistered.map(user => {
              const isExpanded = expandedUserId === user.id;
              const form = getForm(user.id);
              const isProcessing = processing[user.id];

              return (
                <div key={user.id}>
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <button
                      onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{user.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                      Senza licenza
                    </Badge>
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                    >
                      <Plus className="h-3 w-3" /> Assegna
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="bg-muted/20 border-t px-6 py-4 space-y-4">
                      {/* Opzione 1: Nuova licenza trial */}
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Crea nuova licenza trial (14 giorni)</p>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Nome studio</Label>
                            <Input
                              placeholder="Studio Medico..."
                              value={form.company_name}
                              onChange={e => setForm(user.id, 'company_name', e.target.value)}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Piano</Label>
                            <Select value={form.plan} onValueChange={v => setForm(user.id, 'plan', v)}>
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="base">Base</SelectItem>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Ruolo</Label>
                            <Select value={form.role} onValueChange={v => setForm(user.id, 'role', v)}>
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="amministratore">Amministratore</SelectItem>
                                <SelectItem value="medico">Medico</SelectItem>
                                <SelectItem value="segreteria">Segreteria</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleCreateTrial(user)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                          Crea licenza trial
                        </Button>
                      </div>

                      {/* Opzione 2: Aggiungi a licenza esistente */}
                      {allLicenses.length > 0 && (
                        <div className="space-y-3 pt-3 border-t">
                          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Oppure aggiungi a licenza esistente</p>
                          <div className="flex gap-2 items-end">
                            <div className="space-y-1 flex-1">
                              <Label className="text-xs">Licenza</Label>
                              <Select value={form.existing_license_id || ''} onValueChange={v => setForm(user.id, 'existing_license_id', v)}>
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue placeholder="Seleziona licenza..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {allLicenses.map(l => (
                                    <SelectItem key={l.id} value={l.id}>
                                      {l.company_name || l.admin_email} ({l.status})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => handleAddToExisting(user)}
                              disabled={isProcessing || !form.existing_license_id}
                            >
                              {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                              Aggiungi
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}