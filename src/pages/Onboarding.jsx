import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Stethoscope, ArrowRight, Loader2 } from 'lucide-react';

export default function Onboarding() {
  const { user, checkAppState } = useAuth();
  const [form, setForm] = useState({
    admin_name: user?.full_name || '',
    company_name: '',
    vat_number: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Calcola fine trial a 14 giorni
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      const trialEndStr = trialEnd.toISOString().split('T')[0];

      // Crea la licenza trial
      const license = await base44.entities.License.create({
        plan: 'professional',
        billing_cycle: 'monthly',
        status: 'trial',
        admin_name: form.admin_name,
        admin_email: user.email,
        admin_user_id: user.id,
        company_name: form.company_name,
        vat_number: form.vat_number,
        phone: form.phone,
        trial_end: trialEndStr,
        max_users: -1,
        tenant_id: user.id, // tenant_id = user.id del primo admin
      });

      // Crea il LicenseUser per questo utente come amministratore
      await base44.entities.LicenseUser.create({
        license_id: license.id,
        tenant_id: user.id,
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: 'amministratore',
        status: 'active',
        activated_at: new Date().toISOString(),
      });

      // Ricarica il contesto auth per aggiornare tenantId
      await checkAppState();
    } catch (err) {
      setError('Errore durante la configurazione. Riprova.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-foreground">MEDIPLAN</span>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Benvenuto in Mediplan!</CardTitle>
            <CardDescription>
              Completa il tuo profilo per iniziare il periodo di prova gratuito di 14 giorni.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label>Nome e Cognome *</Label>
                <Input
                  value={form.admin_name}
                  onChange={e => set('admin_name', e.target.value)}
                  placeholder="Dr. Mario Rossi"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Nome studio / azienda *</Label>
                <Input
                  value={form.company_name}
                  onChange={e => set('company_name', e.target.value)}
                  placeholder="Studio Medico Rossi"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>P.IVA / Codice Fiscale</Label>
                  <Input
                    value={form.vat_number}
                    onChange={e => set('vat_number', e.target.value)}
                    placeholder="IT12345678901"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Telefono</Label>
                  <Input
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+39 333 1234567"
                  />
                </div>
              </div>

              {/* Email (readonly) */}
              <div className="space-y-1">
                <Label>Email (account)</Label>
                <Input value={user?.email || ''} disabled className="bg-muted" />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading || !form.admin_name || !form.company_name}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Configurazione in corso...</>
                ) : (
                  <><ArrowRight className="h-4 w-4" /> Inizia il periodo di prova</>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                14 giorni gratuiti — nessuna carta di credito richiesta
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}