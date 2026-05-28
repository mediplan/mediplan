import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Stethoscope, CheckCircle2, ArrowRight, Menu, X,
  Building2, Users, Calendar, FileText, BarChart3,
  ClipboardList, Bell, Shield, Zap, HeartPulse,
  ChevronRight, Star, ExternalLink
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Funzionalità', href: '#features' },
  { label: 'Prezzi', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const FEATURES = [
  {
    icon: Users,
    title: 'Gestione Lavoratori',
    desc: 'Anagrafica completa con cartelle sanitarie individuali, storico visite, mansioni e rischi associati.',
  },
  {
    icon: HeartPulse,
    title: 'Visite Mediche',
    desc: 'Compilazione guidata della visita con obiettività, accertamenti strumentali, giudizio di idoneità e stampa referto.',
  },
  {
    icon: Bell,
    title: 'Scadenzario Intelligente',
    desc: 'Monitoraggio automatico delle scadenze di sorveglianza sanitaria con alerting configurabile.',
  },
  {
    icon: Building2,
    title: 'Gestione Aziende',
    desc: 'Multi-azienda: contratti, medico incaricato, piano di sorveglianza, documenti (DVR, DUVRI) e sopralluoghi.',
  },
  {
    icon: ClipboardList,
    title: 'Piano di Sorveglianza AI',
    desc: 'Generazione automatica del piano di sorveglianza a partire dal DVR aziendale tramite intelligenza artificiale.',
  },
  {
    icon: FileText,
    title: 'Allegato 3B',
    desc: 'Compilazione e invio del registro annuale obbligatorio con calcolo automatico dei dati statistici.',
  },
  {
    icon: Calendar,
    title: 'Agenda & Appuntamenti',
    desc: 'Calendario visive degli appuntamenti, pianificazione visite e sopralluoghi direttamente dallo scadenzario.',
  },
  {
    icon: BarChart3,
    title: 'Statistiche & Report',
    desc: 'Dashboard analitica con KPI, export PDF/Excel per fatturazione, report scadenze e statistiche aziendali.',
  },
  {
    icon: Shield,
    title: 'Sicurezza & Multi-utente',
    desc: 'Ruoli granulari (medico, segreteria, operatore), log delle modifiche e protezione dei dati sanitari.',
  },
];

const PLANS = [
  {
    name: 'Base',
    slug: 'base',
    price: { monthly: 49, annual: 39 },
    description: 'Per studi mono-medico con attività limitata.',
    users: '1 utente',
    highlight: false,
    features: [
      'Fino a 3 aziende clienti',
      'Gestione lavoratori illimitata',
      'Visite mediche complete',
      'Scadenzario',
      'Allegato 3B',
      'Supporto email',
    ],
  },
  {
    name: 'Standard',
    slug: 'standard',
    price: { monthly: 99, annual: 79 },
    description: 'Per studi con più collaboratori e aziende.',
    users: 'Fino a 3 utenti',
    highlight: true,
    badge: 'Più scelto',
    features: [
      'Aziende clienti illimitate',
      'Gestione lavoratori illimitata',
      'Visite mediche complete',
      'Scadenzario avanzato',
      'Allegato 3B',
      'Piano sorveglianza AI',
      'Portale clienti azienda',
      'Fatturazione & proforma',
      'Supporto prioritario',
    ],
  },
  {
    name: 'Professional',
    slug: 'professional',
    price: { monthly: 179, annual: 149 },
    description: 'Per strutture mediche e team estesi.',
    users: 'Utenti illimitati',
    highlight: false,
    features: [
      'Tutto di Standard',
      'Utenti illimitati',
      'Statistiche avanzate',
      'Export dati personalizzati',
      'API access',
      'Account manager dedicato',
      'SLA garantito',
      'Onboarding assistito',
    ],
  },
];

const FAQS = [
  {
    q: 'Posso provare Mediplan gratuitamente?',
    a: 'Sì, offriamo 14 giorni di prova gratuita con il piano Professional completo. Nessuna carta di credito richiesta.',
  },
  {
    q: 'I dati sanitari sono al sicuro?',
    a: 'Assolutamente. I dati sono ospitati su server europei certificati, con backup automatici giornalieri e cifratura end-to-end.',
  },
  {
    q: 'Posso passare da un piano all\'altro?',
    a: 'Sì, puoi fare upgrade o downgrade in qualsiasi momento. Il cambio è immediato e la fatturazione viene ricalcolata pro-rata.',
  },
  {
    q: 'Come funziona il codice di attivazione?',
    a: 'Se hai acquistato una licenza, riceverai un codice univoco dal nostro team. Al primo accesso su Mediplan, inserisci il codice per attivare il tuo account.',
  },
  {
    q: 'È conforme al GDPR e alla normativa italiana?',
    a: 'Sì. Mediplan è progettato per la conformità al D.Lgs. 81/2008, al GDPR e alle linee guida del Garante Privacy.',
  },
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billing, setBilling] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);

  const handleLogin = () => {
    base44.auth.redirectToLogin('/app');
  };

  const handleStartTrial = () => {
    base44.auth.redirectToLogin('/app');
  };

  return (
    <div className="min-h-screen bg-white text-foreground font-inter">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#">
            <img src="https://media.base44.com/images/public/69c0209eff24be664ca77e04/977c8fc2c_Screenshot2026-05-24104256.png" alt="MEDIPLAN" className="h-9 object-contain" />
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleLogin}>Accedi</Button>
            <Button size="sm" onClick={handleStartTrial} className="gap-1">
              Prova gratis <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Mobile */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(v => !v)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white px-4 py-4 space-y-3">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground hover:text-foreground">
                {l.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={handleLogin} className="w-full">Accedi</Button>
              <Button size="sm" onClick={handleStartTrial} className="w-full">Prova gratis 14 giorni</Button>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary/30 via-accent/5 to-white pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-5 gap-1.5 px-3 py-1 text-xs font-medium bg-accent text-white border-0">
            <Zap className="h-3 w-3" /> Software per la Medicina del Lavoro
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
            La sorveglianza sanitaria<br />
            <span className="text-accent">semplice e digitale</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Mediplan è il gestionale cloud per medici competenti. Aziende, lavoratori, visite, scadenze, Allegato 3B e fatturazione: tutto in un unico strumento.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={handleStartTrial} className="gap-2 text-base h-12 px-8">
              Inizia la prova gratuita <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleLogin} className="gap-2 text-base h-12 px-8">
              Accedi all'area personale <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">14 giorni gratis · Piano Professional · Nessuna carta di credito</p>
        </div>

        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-secondary/40 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tutto quello che ti serve</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Un unico strumento per gestire l'intera attività del medico competente, dalla cartella clinica all'obbligo normativo.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="group p-6 rounded-xl border border-border hover:border-accent/40 hover:shadow-md transition-all bg-white">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-4 bg-secondary/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Piani e prezzi</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">Scegli il piano adatto alla tua struttura. Tutti i piani includono aggiornamenti automatici e supporto tecnico.</p>

            {/* Toggle mensile/annuale */}
            <div className="inline-flex items-center bg-white border border-border rounded-full p-1 gap-1">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${billing === 'monthly' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Mensile
              </button>
              <button
                onClick={() => setBilling('annual')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${billing === 'annual' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Annuale <span className="ml-1 text-xs text-accent font-semibold">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => (
              <div key={plan.slug} className={`relative rounded-2xl border-2 p-8 bg-white transition-all ${plan.highlight ? 'border-primary shadow-xl scale-[1.02]' : 'border-border shadow-sm'}`}>
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1 px-3 py-1 text-xs font-semibold">
                      <Star className="h-3 w-3" /> {plan.badge}
                    </Badge>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-4xl font-bold text-foreground">€{plan.price[billing]}</span>
                    <span className="text-muted-foreground text-sm mb-1">/mese</span>
                  </div>
                  {billing === 'annual' && (
                    <p className="text-xs text-accent font-medium">Fatturato annualmente · risparmi €{(plan.price.monthly - plan.price.annual) * 12}/anno</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{plan.users}</p>
                </div>

                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={handleStartTrial}
                  className={`w-full gap-1 ${plan.highlight ? '' : 'variant-outline'}`}
                  variant={plan.highlight ? 'default' : 'outline'}
                >
                  Inizia la prova <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Tutti i prezzi sono IVA esclusa. · Hai esigenze particolari? <a href="mailto:info@mediplansuite.it" className="text-primary underline underline-offset-2">Contattaci</a>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Domande frequenti</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-medium text-sm pr-4">{faq.q}</span>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary to-accent text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Pronti a semplificare la tua attività?</h2>
          <p className="text-white/80 mb-8 text-lg">Inizia subito con 14 giorni gratuiti. Nessun vincolo, nessuna carta di credito.</p>
          <Button
            size="lg"
            onClick={handleStartTrial}
            className="bg-white text-primary hover:bg-white/90 gap-2 h-12 px-8 text-base font-semibold"
          >
            Inizia gratis ora <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <div className="mb-3">
              <img src="https://media.base44.com/images/public/69c0209eff24be664ca77e04/977c8fc2c_Screenshot2026-05-24104256.png" alt="MEDIPLAN" className="h-8 object-contain brightness-0 invert" />
            </div>
            <p className="text-xs leading-relaxed max-w-xs">
              Software cloud per la gestione della sorveglianza sanitaria e della medicina del lavoro.
            </p>
            <p className="text-xs mt-3">
              <a href="https://mediplansuite.it" className="hover:text-white transition-colors">mediplansuite.it</a>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-white font-medium mb-3">Prodotto</p>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Funzionalità</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Prezzi</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-medium mb-3">Contatti</p>
              <ul className="space-y-2">
                <li><a href="mailto:info@mediplansuite.it" className="hover:text-white transition-colors">info@mediplansuite.it</a></li>
                <li><a href="mailto:supporto@mediplansuite.it" className="hover:text-white transition-colors">supporto@mediplansuite.it</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>© {new Date().getFullYear()} Mediplan · Tutti i diritti riservati</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Termini di servizio</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}