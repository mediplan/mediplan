import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Clock, Building2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClienteDipendenti from '@/components/cliente/ClienteDipendenti';
import ClienteReferti from '@/components/cliente/ClienteReferti';
import ClienteScadenze from '@/components/cliente/ClienteScadenze';

export default function ClienteDashboard() {
  const { user, tenantId, logout } = useAuth();

  // Trova l'azienda associata all'utente tramite email
  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['cliente-companies', user?.email],
    queryFn: () => base44.entities.Company.filter({ tenant_id: tenantId }),
    enabled: !!tenantId,
  });

  // Cerca la company_id legata a questo utente cliente
  // L'utente cliente ha il ruolo nella LicenseUser; cerchiamo la company dal tenant
  const { data: licenseUsers = [] } = useQuery({
    queryKey: ['licenseUser-email', user?.email],
    queryFn: () => base44.entities.LicenseUser.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const licenseUser = licenseUsers[0];

  // Trova la company collegata a questo utente cliente
  // Usiamo il campo company_id se presente nel LicenseUser, altrimenti mostriamo tutte del tenant
  const { data: allPatients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['cliente-patients', tenantId],
    queryFn: () => base44.entities.Patient.filter({ tenant_id: tenantId }),
    enabled: !!tenantId,
  });

  const { data: allVisits = [], isLoading: loadingVisits } = useQuery({
    queryKey: ['cliente-visits', tenantId],
    queryFn: () => base44.entities.MedicalVisit.filter({ tenant_id: tenantId }),
    enabled: !!tenantId,
  });

  const isLoading = loadingCompanies || loadingPatients || loadingVisits;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalEmployees = allPatients.filter(p => p.status === 'active').length;
  const concludedVisits = allVisits.filter(v => v.visit_status === 'conclusa');
  const today = new Date();
  const in60Days = new Date(today);
  in60Days.setDate(today.getDate() + 60);
  const expiringVisits = allVisits.filter(v => {
    if (!v.next_visit_date || v.visit_status !== 'conclusa') return false;
    const d = new Date(v.next_visit_date);
    return d >= today && d <= in60Days;
  });
  const expiredVisits = allVisits.filter(v => {
    if (!v.next_visit_date) return false;
    return new Date(v.next_visit_date) < today;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Portale Aziendale</h1>
              <p className="text-xs text-muted-foreground">
                {companies[0]?.name || user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.full_name || user?.email}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" /> Esci
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Dipendenti attivi</span>
              </div>
              <div className="text-2xl font-bold">{totalEmployees}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-accent" />
                <span className="text-xs text-muted-foreground">Referti disponibili</span>
              </div>
              <div className="text-2xl font-bold">{concludedVisits.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-muted-foreground">Scadenze entro 60gg</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">{expiringVisits.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-destructive" />
                <span className="text-xs text-muted-foreground">Visite scadute</span>
              </div>
              <div className="text-2xl font-bold text-destructive">{expiredVisits.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dipendenti">
          <TabsList>
            <TabsTrigger value="dipendenti" className="gap-2">
              <Users className="h-4 w-4" /> Dipendenti
            </TabsTrigger>
            <TabsTrigger value="referti" className="gap-2">
              <FileText className="h-4 w-4" /> Referti
            </TabsTrigger>
            <TabsTrigger value="scadenze" className="gap-2">
              <Clock className="h-4 w-4" />
              Scadenze
              {(expiringVisits.length + expiredVisits.length) > 0 && (
                <Badge className="ml-1 h-4 px-1 text-[10px] bg-destructive text-white">
                  {expiringVisits.length + expiredVisits.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dipendenti" className="mt-4">
            <ClienteDipendenti patients={allPatients} visits={allVisits} />
          </TabsContent>
          <TabsContent value="referti" className="mt-4">
            <ClienteReferti visits={concludedVisits} patients={allPatients} />
          </TabsContent>
          <TabsContent value="scadenze" className="mt-4">
            <ClienteScadenze visits={allVisits} patients={allPatients} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}