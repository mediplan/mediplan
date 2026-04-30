import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { canAccess, filterCompaniesByRole } from '@/lib/roles';
import { useTenant } from '@/lib/useTenant';
import AccessDenied from '@/components/shared/AccessDenied';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import { Search, AlertTriangle, X } from 'lucide-react';
import { format, isAfter, isBefore, parseISO } from 'date-fns';


const VISIT_TYPE_LABELS = {
  preventiva: 'Preventiva',
  periodica: 'Periodica',
  su_richiesta: 'Su richiesta',
  cambio_mansione: 'Cambio mansione',
  rientro_malattia: 'Rientro malattia',
  cessazione: 'Cessazione',
};

const JUDGMENT_COLORS = {
  idoneo: 'bg-green-50 text-green-700 border-green-200',
  idoneo_con_prescrizioni: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  idoneo_con_limitazioni: 'bg-orange-50 text-orange-700 border-orange-200',
  temporaneamente_non_idoneo: 'bg-red-50 text-red-600 border-red-200',
  non_idoneo: 'bg-red-100 text-red-800 border-red-300',
};

export default function Scadenze() {
  const { user } = useAuth();

  const today = new Date();
  const defaultFrom = '2025-01-01';
  const defaultTo = format(new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()), 'yyyy-MM-dd');

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedExams, setSelectedExams] = useState([]);
  const [inclNoVisit, setInclNoVisit] = useState(false);
  const [inclSospesi, setInclSospesi] = useState(false);
  const [inclDaRivisitare, setInclDaRivisitare] = useState(false);
  const [showCompanyData, setShowCompanyData] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showBirthDate, setShowBirthDate] = useState(false);
  const [showMansione, setShowMansione] = useState(false);
  const [elaborated, setElaborated] = useState(false);

  // Carica il profilo medico dell'utente corrente (se ruolo = medico)
  const { data: allDoctors = [] } = useQuery({
    queryKey: ['doctorProfiles'],
    queryFn: () => base44.entities.DoctorProfile.list(),
    enabled: user?.role === 'medico',
  });
  const myDoctorProfile = user?.role === 'medico'
    ? allDoctors.find(d => d.user_email === user.email)
    : null;

  const { data: examCatalog = [] } = useQuery({
    queryKey: ['medicalExamCatalog'],
    queryFn: () => base44.entities.MedicalExamCatalog.list('name'),
  });
  const activeExams = examCatalog.filter(e => e.active !== false);

  const { tenantId } = useTenant();

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['companies', tenantId],
    queryFn: () => tenantId
      ? base44.entities.Company.filter({ tenant_id: tenantId }, 'name')
      : base44.entities.Company.list('name'),
  });

  const companies = filterCompaniesByRole(user, allCompanies, myDoctorProfile);

  const { data: visits = [], isFetching } = useQuery({
    queryKey: ['visits-all', tenantId],
    queryFn: () => tenantId
      ? base44.entities.MedicalVisit.filter({ tenant_id: tenantId }, '-visit_date', 500)
      : base44.entities.MedicalVisit.list('-visit_date', 500),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients', tenantId],
    queryFn: () => tenantId
      ? base44.entities.Patient.filter({ tenant_id: tenantId })
      : base44.entities.Patient.list(),
  });

  const results = useMemo(() => {
    if (!elaborated) return [];

    const from = parseISO(fromDate);
    const to = parseISO(toDate);

    // Map patients by id
    const patientMap = {};
    patients.forEach(p => { patientMap[p.id] = p; });

    // Filter visits by next_visit_date in range
    let filtered = visits.filter(v => {
      if (!v.next_visit_date) return inclNoVisit;
      const d = parseISO(v.next_visit_date);
      return !isBefore(d, from) && !isAfter(d, to);
    });

    // Applica filtro aziende visibili (per medico: solo sue aziende)
    const visibleCompanyIds = new Set(companies.map(c => c.id));
    filtered = filtered.filter(v => visibleCompanyIds.has(v.company_id));

    if (selectedCompany !== 'all') {
      filtered = filtered.filter(v => v.company_id === selectedCompany);
    }

    if (!inclSospesi) {
      filtered = filtered.filter(v => {
        const p = patientMap[v.patient_id];
        return !p || p.status !== 'on_leave';
      });
    }

    if (inclDaRivisitare) {
      filtered = filtered.filter(v => {
        const p = patientMap[v.patient_id];
        return p && p.to_revisit;
      });
    }

    return filtered.map((v, i) => {
      const p = patientMap[v.patient_id];
      return {
        nr: i + 1,
        ...v,
        patient: p,
      };
    });
  }, [elaborated, visits, patients, fromDate, toDate, selectedCompany, inclNoVisit, inclSospesi, inclDaRivisitare, companies]);

  if (!canAccess(user, 'scadenze')) return <AccessDenied />;

  const toggleExam = (exam) => {
    setSelectedExams(prev =>
      prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam]
    );
  };

  const handleElabora = () => setElaborated(true);

  // Reset elaborated when filters change
  const resetElaborated = () => setElaborated(false);

  return (
    <div>
      <PageHeader
        title="Scadenze"
        description="Controllo scadenze visite mediche"
      />

      {/* Filters Card */}
      <Card className="p-5 mb-4 space-y-0">

        {/* Sezione 1: Periodo e Azienda */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Periodo e Azienda</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label className="text-xs mb-1 block">Da Data</Label>
              <Input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); resetElaborated(); }} className="w-36" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">A Data</Label>
              <Input type="date" value={toDate} onChange={e => { setToDate(e.target.value); resetElaborated(); }} className="w-36" />
            </div>
            <div className="min-w-[220px]">
              <Label className="text-xs mb-1 block">Azienda</Label>
              <Select value={selectedCompany} onValueChange={v => { setSelectedCompany(v); resetElaborated(); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tutte le aziende" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le aziende</SelectItem>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="border-t border-border my-4" />

        {/* Sezione 2: Filtra per accertamento */}
        {activeExams.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Filtra per accertamento
                {selectedExams.length > 0 && (
                  <span className="ml-2 normal-case font-normal text-primary">({selectedExams.length} selezionati)</span>
                )}
              </p>
              {selectedExams.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setSelectedExams([]); resetElaborated(); }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Rimuovi tutti
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeExams.map(exam => {
                const selected = selectedExams.includes(exam.name);
                return (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() => { toggleExam(exam.name); resetElaborated(); }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {exam.name}
                    {selected && <X className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-t border-border my-4" />

        {/* Sezione 3: Opzioni */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Opzioni</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-6">
            <p className="text-[10px] font-medium text-muted-foreground col-span-full mb-0.5">Includi nel risultato</p>
            {[
              [inclNoVisit, setInclNoVisit, 'Dipendenti senza nessuna visita'],
              [inclDaRivisitare, setInclDaRivisitare, 'Dipendenti da rivisitare (assenti o con accertamenti mancanti)'],
              [inclSospesi, setInclSospesi, 'Dipendenti sospesi'],
            ].map(([val, setter, label]) => (
              <label key={label} className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 accent-primary flex-shrink-0" checked={val} onChange={e => { setter(e.target.checked); resetElaborated(); }} />
                <span className="text-xs text-muted-foreground leading-tight">{label}</span>
              </label>
            ))}
            <p className="text-[10px] font-medium text-muted-foreground col-span-full mt-2 mb-0.5">Visualizza in stampa</p>
            {[
              [showCompanyData, setShowCompanyData, 'Solo dati azienda'],
              [showPhone, setShowPhone, 'Telefono ed email azienda'],
              [showBirthDate, setShowBirthDate, 'Data nascita dipendente'],
              [showMansione, setShowMansione, 'Mansione'],
            ].map(([val, setter, label]) => (
              <label key={label} className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 accent-primary flex-shrink-0" checked={val} onChange={e => { setter(e.target.checked); resetElaborated(); }} />
                <span className="text-xs text-muted-foreground leading-tight">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-border mt-4 pt-4">
          <div className="flex gap-2 items-center">
            <Button onClick={handleElabora} disabled={isFetching} className="gap-2">
              <Search className="h-4 w-4" />
              Elabora
            </Button>
            {elaborated && (
              <Badge variant="outline" className="self-center">
                {results.length} risultati
              </Badge>
            )}
          </div>
        </div>

      </Card>

      {/* Results Table */}
      {elaborated && (
        <Card className="overflow-hidden">
          {results.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nessuna scadenza trovata per i filtri selezionati
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-medium w-10">Nr.</th>
                    <th className="px-3 py-2.5 text-left font-medium">Azienda</th>
                    <th className="px-3 py-2.5 text-left font-medium">Dipendente</th>
                    {showBirthDate && <th className="px-3 py-2.5 text-left font-medium">Data Nascita</th>}
                    <th className="px-3 py-2.5 text-left font-medium">Data Visita</th>
                    <th className="px-3 py-2.5 text-left font-medium">Periodicità</th>
                    <th className="px-3 py-2.5 text-left font-medium">Data Scad.</th>
                    <th className="px-3 py-2.5 text-left font-medium">Tipo Visita</th>
                    {showMansione && <th className="px-3 py-2.5 text-left font-medium">Mansione</th>}
                    <th className="px-3 py-2.5 text-left font-medium">Stato Dip.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((row, idx) => {
                    const isOverdue = row.next_visit_date && isBefore(parseISO(row.next_visit_date), today);
                    return (
                      <tr key={row.id} className={`${idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'} hover:bg-muted/60 transition-colors`}>
                        <td className="px-3 py-2 text-muted-foreground">{row.nr}</td>
                        <td className="px-3 py-2 font-medium">{row.company_name}</td>
                        <td className="px-3 py-2">{row.patient_name}</td>
                        {showBirthDate && (
                          <td className="px-3 py-2 text-muted-foreground">
                            {row.patient?.birth_date ? format(parseISO(row.patient.birth_date), 'dd/MM/yyyy') : '—'}
                          </td>
                        )}
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.visit_date ? format(parseISO(row.visit_date), 'dd/MM/yyyy') : '—'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">—</td>
                        <td className="px-3 py-2">
                          {row.next_visit_date ? (
                            <span className={`font-medium ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                              {format(parseISO(row.next_visit_date), 'dd/MM/yyyy')}
                              {isOverdue && ' ⚠'}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {VISIT_TYPE_LABELS[row.visit_type] || row.visit_type || '—'}
                        </td>
                        {showMansione && (
                          <td className="px-3 py-2 text-muted-foreground">
                            {row.patient?.job_role_name || '—'}
                          </td>
                        )}
                        <td className="px-3 py-2">
                          {row.judgment ? (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${JUDGMENT_COLORS[row.judgment] || ''}`}>
                              {row.judgment.replace(/_/g, ' ')}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}