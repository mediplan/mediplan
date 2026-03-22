import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileHeart, User, Heart, Pill, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import StatusBadge from '@/components/shared/StatusBadge';
import { Link } from 'react-router-dom';

export default function PatientDetail() {
  const patientId = window.location.pathname.split('/').pop();
  const navigate = useNavigate();

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list(),
  });
  const patient = patients.find(p => String(p.id) === patientId);

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.MedicalVisit.list('-visit_date'),
  });
  const patientVisits = visits.filter(v => String(v.patient_id) === patientId);

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/pazienti')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Torna ai lavoratori
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{patient.last_name} {patient.first_name}</h1>
            <StatusBadge status={patient.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {patient.company_name} {patient.job_role_name ? `· ${patient.job_role_name}` : ''}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dati personali</p>
          </div>
          {patient.fiscal_code && <p className="text-sm">CF: <span className="font-mono text-xs font-medium">{patient.fiscal_code}</span></p>}
          {patient.birth_date && <p className="text-sm">Nato il: {format(new Date(patient.birth_date), 'dd/MM/yyyy')}</p>}
          {patient.birth_place && <p className="text-sm">Luogo: {patient.birth_place}</p>}
          {patient.gender && <p className="text-sm">Sesso: {patient.gender}</p>}
          {patient.phone && <p className="text-sm">Tel: {patient.phone}</p>}
          {patient.email && <p className="text-sm">Email: {patient.email}</p>}
        </Card>
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="h-4 w-4 text-destructive" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Anamnesi</p>
          </div>
          {patient.blood_type && patient.blood_type !== 'unknown' && <p className="text-sm">Gruppo: <span className="font-medium">{patient.blood_type}</span></p>}
          {patient.allergies && <p className="text-sm">Allergie: {patient.allergies}</p>}
          {patient.chronic_conditions && <p className="text-sm">Patologie: {patient.chronic_conditions}</p>}
          {!patient.allergies && !patient.chronic_conditions && <p className="text-sm text-muted-foreground">Nessun dato</p>}
        </Card>
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Pill className="h-4 w-4 text-accent" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Terapie</p>
          </div>
          {patient.current_medications ? (
            <p className="text-sm">{patient.current_medications}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Nessuna terapia in corso</p>
          )}
        </Card>
      </div>

      {/* Visit history */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileHeart className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Storico visite ({patientVisits.length})</h2>
          </div>
          <Link to="/visite">
            <Button variant="outline" size="sm">Gestisci visite</Button>
          </Link>
        </div>
        {patientVisits.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna visita registrata</p>
        ) : (
          <div className="space-y-3">
            {patientVisits.map(v => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium">{v.visit_date ? format(new Date(v.visit_date), 'dd MMMM yyyy', { locale: it }) : ''}</p>
                  <p className="text-xs text-muted-foreground capitalize">{v.visit_type?.replace(/_/g, ' ')}</p>
                </div>
                <StatusBadge status={v.judgment} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}