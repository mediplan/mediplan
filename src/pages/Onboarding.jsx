import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Stethoscope, ArrowRight, Loader2, KeyRound, Sparkles } from 'lucide-react';

export default function Onboarding() {
  const { user, checkAppState } = useAuth();
  const [mode, setMode] = useState(null); // 'code' | 'trial'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stato per attivazione con codice
  const [accessCode, setAccessCode] = useState('');

  // Stato per trial
  const [form, setForm] = useState({
    admin_name: user?.full_name || '',
    company_name: '',
    vat_number: '',
    phone: '',
  });
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  // Attivazione tramite codice
  const handleActivateCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const normalizedCode = accessCode.trim().toUpperCase();
    try {
      const licenses = await base44.entities.License.filter({ access_code: normalizedCode });
      if (!licenses || licenses.length === 0) {
        setError('Codice non valido o già utilizzato. Controlla e riprova.');
        setLoading(false);
        return;
      }
      const license = licenses[0];

      // Verifica che non ci sia già un LicenseUser con questo user_id su questa licenza
      const existing = await base44.entities.LicenseUser.filter({ license_id: license.id, user_id: user.id });
      if (existing && existing.length > 0) {
        setError('Questo account è già associato a questa licenza.');
        setLoading(false);
        return;
      }

      await base44.entities.LicenseUser.create({
        license_id: license.id,
        tenant_id: license.tenant_id || license.id,
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: 'amministratore',
        status: 'active',
        activated_at: new Date().toISOString(),
      });

      await checkAppState();
    } catch (err) {
      setError('Errore durante l\'attivazione. Riprova.');
      setLoading(false);
    }
  };

  // Attivazione tramite trial
  const handleStartTrial = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

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
        trial_end: trialEnd.toISOString().split('T')[0],
        max_users: -1,
        tenant_id: user.id,
      });

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

        {/* Scelta modalità */}
        {!mode && (
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Benvenuto in Mediplan!</CardTitle>
              <CardDescription>Come vuoi iniziare?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => setMode('code')}
                className="w-full flex items-start gap-4 p-4 rounded-lg border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <KeyRound className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Ho un codice di attivazione</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Il mio studio ha già una licenza Mediplan. Inserisco il codice ricevuto per collegarmi.</p>
                </div>
              </button>

              <button
                onClick={() => setMode('trial')}
                className="w-full flex items-start gap-4 p-4 rounded-lg border-2 border-border hover:border-accent hover:bg-accent/5 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Inizia il periodo di prova gratuito</p>
                  <p className="text-xs text-muted-foreground mt-0.5">14 giorni gratis, piano Professional completo. Nessuna carta di credito richiesta.</p>
                </div>
              </button>
            </CardContent>
          </Card>
        )}

        {/* Attivazione con codice */}
        {mode === 'code' && (
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" /> Attiva con codice
              </CardTitle>
              <CardDescription>Inserisci il codice di attivazione ricevuto dall'amministratore.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleActivateCode} className="space-y-4">
                <div className="space-y-1">
                  <Label>Codice di attivazione *</Label>
                  <Input
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX"
                    className="font-mono tracking-widest text-center text-lg h-12"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Email (account)</Label>
                  <Input value={user?.email || ''} disabled className="bg-muted" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full gap-2" disabled={loading || !accessCode.trim()}>
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifica in corso...</> : <><ArrowRight className="h-4 w-4" /> Attiva licenza</>}
                </Button>
                <button type="button" onClick={() => { setMode(null); setError(null); }} className="w-full text-xs text-muted-foreground hover:text-foreground text-center">
                  ← Torna indietro
                </button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Trial */}
        {mode === 'trial' && (
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" /> Periodo di prova gratuito
              </CardTitle>
              <CardDescription>Completa il tuo profilo per iniziare i 14 giorni gratuiti.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStartTrial} className="space-y-4">
                <div className="space-y-1">
                  <Label>Nome e Cognome *</Label>
                  <Input value={form.admin_name} onChange={e => set('admin_name', e.target.value)} placeholder="Dr. Mario Rossi" required />
                </div>
                <div className="space-y-1">
                  <Label>Nome studio / azienda *</Label>
                  <Input value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Studio Medico Rossi" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>P.IVA / Codice Fiscale</Label>
                    <Input value={form.vat_number} onChange={e => set('vat_number', e.target.value)} placeholder="IT12345678901" />
                  </div>
                  <div className="space-y-1">
                    <Label>Telefono</Label>
                    <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+39 333 1234567" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Email (account)</Label>
                  <Input value={user?.email || ''} disabled className="bg-muted" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full gap-2" disabled={loading || !form.admin_name || !form.company_name}>
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Configurazione in corso...</> : <><ArrowRight className="h-4 w-4" /> Inizia il periodo di prova</>}
                </Button>
                <p className="text-xs text-center text-muted-foreground">14 giorni gratuiti — nessuna carta di credito richiesta</p>
                <button type="button" onClick={() => { setMode(null); setError(null); }} className="w-full text-xs text-muted-foreground hover:text-foreground text-center">
                  ← Torna indietro
                </button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}