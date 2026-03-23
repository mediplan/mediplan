import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, Users, Briefcase } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/shared/PageHeader';

export default function Dashboard() {
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list(),
  });
  const { data: jobRoles = [] } = useQuery({
    queryKey: ['jobRoles'],
    queryFn: () => base44.entities.JobRole.list(),
  });
  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const activePatients = patients.filter(p => p.status === 'active').length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Panoramica della sorveglianza sanitaria"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Aziende attive" value={activeCompanies} icon={Building2} color="blue" />
        <StatCard label="Lavoratori attivi" value={activePatients} icon={Users} color="teal" />
        <StatCard label="Mansioni" value={jobRoles.length} icon={Briefcase} color="purple" />
      </div>
    </div>
  );
}