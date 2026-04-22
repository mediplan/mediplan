import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Users, ExternalLink, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import LicenseUsersPanel from './LicenseUsersPanel';

const PLAN_LABELS  = { base: 'Base', standard: 'Standard', professional: 'Professional' };
const PLAN_PRICES  = { base: 29.9, standard: 59.9, professional: 129.9 };
const PLAN_COLORS  = {
  base:         'bg-slate-100 text-slate-700 border-slate-300',
  standard:     'bg-blue-100 text-blue-700 border-blue-300',
  professional: 'bg-purple-100 text-purple-700 border-purple-300',
};
const STATUS_CONFIG = {
  active:    { label: 'Attiva',    color: 'bg-green-100 text-green-700 border-green-300' },
  trial:     { label: 'Trial',     color: 'bg-blue-100 text-blue-700 border-blue-300' },
  past_due:  { label: 'Scaduta',   color: 'bg-red-100 text-red-700 border-red-300' },
  canceled:  { label: 'Annullata', color: 'bg-gray-100 text-gray-500 border-gray-300' },
  suspended: { label: 'Sospesa',   color: 'bg-orange-100 text-orange-700 border-orange-300' },
};

export default function LicenseList({ licenses, isLoading, onEdit, onRefetch }) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.License.delete(id),
    onSuccess: () => { onRefetch(); },
  });

  const filtered = licenses.filter(l =>
    (l.admin_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.admin_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.company_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return (
    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
      Caricamento...
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Licenze ({licenses.length})</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca intestatario..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            {licenses.length === 0 ? 'Nessuna licenza ancora creata.' : 'Nessun risultato.'}
          </p>
        ) : (
          <div className="divide-y">
            {filtered.map(lic => {
              const sc = STATUS_CONFIG[lic.status] || STATUS_CONFIG.trial;
              const pc = PLAN_COLORS[lic.plan] || PLAN_COLORS.base;
              const isExpanded = expandedId === lic.id;
              const isExpiring = lic.current_period_end && !isPast(parseISO(lic.current_period_end));
              const isExpired  = lic.current_period_end && isPast(parseISO(lic.current_period_end));

              return (
                <div key={lic.id}>
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : lic.id)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>

                    {/* Info principale */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{lic.admin_name || lic.admin_email}</span>
                        {lic.company_name && (
                          <span className="text-xs text-muted-foreground">— {lic.company_name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{lic.admin_email}</span>
                        {lic.current_period_end && (
                          <span className={`text-xs ${isExpired ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                            Scad. {format(parseISO(lic.current_period_end), 'dd/MM/yyyy')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <Badge className={`text-xs border ${pc}`}>
                        {PLAN_LABELS[lic.plan] || lic.plan} — €{PLAN_PRICES[lic.plan]}/{lic.billing_cycle === 'annual' ? 'anno' : 'mese'}
                      </Badge>
                      <Badge className={`text-xs border ${sc.color}`}>{sc.label}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {lic.billing_cycle === 'annual' ? '📅 Annuale' : '🔄 Mensile'}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {lic.stripe_customer_id && (
                        <a
                          href={`https://dashboard.stripe.com/customers/${lic.stripe_customer_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Apri in Stripe">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(lic)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => {
                          if (confirm(`Eliminare la licenza di ${lic.admin_email}?`)) deleteMutation.mutate(lic.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded: users panel */}
                  {isExpanded && (
                    <div className="bg-muted/20 border-t px-6 py-4">
                      <LicenseUsersPanel licenseId={lic.id} plan={lic.plan} maxUsers={lic.max_users} />
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