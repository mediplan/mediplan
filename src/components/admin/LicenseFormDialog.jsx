import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const PLAN_MAX_USERS = { base: 1, standard: 3, professional: -1 };

const EMPTY = {
  plan: 'base',
  billing_cycle: 'monthly',
  status: 'trial',
  admin_name: '',
  admin_email: '',
  company_name: '',
  vat_number: '',
  phone: '',
  stripe_customer_id: '',
  stripe_subscription_id: '',
  current_period_start: '',
  current_period_end: '',
  trial_end: '',
  notes: '',
};

export default function LicenseFormDialog({ open, onOpenChange, license, onSaved }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (license) {
      setForm({ ...EMPTY, ...license });
    } else {
      // Default trial: 14 giorni
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      setForm({ ...EMPTY, trial_end: trialEnd.toISOString().split('T')[0] });
    }
  }, [license, open]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, max_users: PLAN_MAX_USERS[data.plan] };
      return data.id
        ? base44.entities.License.update(data.id, payload)
        : base44.entities.License.create(payload);
    },
    onSuccess: () => {
      onSaved();
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{license ? 'Modifica licenza' : 'Nuova licenza'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Piano e ciclo */}
          <div className="space-y-1">
            <Label>Piano *</Label>
            <Select value={form.plan} onValueChange={v => set('plan', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="base">Base — €29,90/mese (1 utente)</SelectItem>
                <SelectItem value="standard">Standard — €59,90/mese (3 utenti)</SelectItem>
                <SelectItem value="professional">Professional — €129,90/mese (illimitati)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Ciclo di fatturazione</Label>
            <Select value={form.billing_cycle} onValueChange={v => set('billing_cycle', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensile</SelectItem>
                <SelectItem value="annual">Annuale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stato */}
          <div className="space-y-1">
            <Label>Stato</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Attiva</SelectItem>
                <SelectItem value="past_due">Scaduta</SelectItem>
                <SelectItem value="suspended">Sospesa</SelectItem>
                <SelectItem value="canceled">Annullata</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Fine trial</Label>
            <Input type="date" value={form.trial_end} onChange={e => set('trial_end', e.target.value)} />
          </div>

          {/* Intestatario */}
          <div className="space-y-1">
            <Label>Nome intestatario *</Label>
            <Input value={form.admin_name} onChange={e => set('admin_name', e.target.value)} placeholder="Dr. Mario Rossi" />
          </div>
          <div className="space-y-1">
            <Label>Email amministratore *</Label>
            <Input type="email" value={form.admin_email} onChange={e => set('admin_email', e.target.value)} placeholder="medico@studio.it" />
          </div>
          <div className="space-y-1">
            <Label>Studio / Azienda</Label>
            <Input value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Studio Medico Rossi" />
          </div>
          <div className="space-y-1">
            <Label>P.IVA / CF</Label>
            <Input value={form.vat_number} onChange={e => set('vat_number', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Telefono</Label>
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>

          {/* Periodo */}
          <div className="space-y-1">
            <Label>Inizio periodo</Label>
            <Input type="date" value={form.current_period_start} onChange={e => set('current_period_start', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Scadenza periodo</Label>
            <Input type="date" value={form.current_period_end} onChange={e => set('current_period_end', e.target.value)} />
          </div>

          {/* Stripe */}
          <div className="space-y-1">
            <Label>Stripe Customer ID</Label>
            <Input value={form.stripe_customer_id} onChange={e => set('stripe_customer_id', e.target.value)} placeholder="cus_..." />
          </div>
          <div className="space-y-1">
            <Label>Stripe Subscription ID</Label>
            <Input value={form.stripe_subscription_id} onChange={e => set('stripe_subscription_id', e.target.value)} placeholder="sub_..." />
          </div>

          {/* Note */}
          <div className="col-span-2 space-y-1">
            <Label>Note interne</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending || !form.admin_email}
          >
            {saveMutation.isPending ? 'Salvataggio...' : 'Salva licenza'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}