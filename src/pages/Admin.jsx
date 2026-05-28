import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, CreditCard, AlertTriangle, CheckCircle, Clock, XCircle, Ticket } from 'lucide-react';
import LicenseList from '@/components/admin/LicenseList';
import LicenseFormDialog from '@/components/admin/LicenseFormDialog';
import UnregisteredUsersPanel from '@/components/admin/UnregisteredUsersPanel';
import VouchersPanel from '@/components/admin/VouchersPanel';

const PLAN_LABELS = { base: 'Base', standard: 'Standard', professional: 'Professional' };
const STATUS_CONFIG = {
  active:     { label: 'Attiva',       color: 'bg-green-100 text-green-700 border-green-300',   icon: CheckCircle },
  trial:      { label: 'Trial',        color: 'bg-blue-100 text-blue-700 border-blue-300',      icon: Clock },
  past_due:   { label: 'Scaduta',      color: 'bg-red-100 text-red-700 border-red-300',         icon: AlertTriangle },
  canceled:   { label: 'Annullata',    color: 'bg-gray-100 text-gray-500 border-gray-300',      icon: XCircle },
  suspended:  { label: 'Sospesa',      color: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertTriangle },
};

export default function Admin() {
  const { user, isLoadingAuth } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);

  const { data: licenses = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-licenses'],
    queryFn: () => base44.entities.License.list('-created_date', 200),
    enabled: user?.role === 'admin',
  });

  if (isLoadingAuth) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;

  // Stats
  const active   = licenses.filter(l => l.status === 'active').length;
  const trial    = licenses.filter(l => l.status === 'trial').length;
  const past_due = licenses.filter(l => l.status === 'past_due').length;

  const mrr = licenses
    .filter(l => l.status === 'active')
    .reduce((sum, l) => {
      const prices = { base: 29.9, standard: 59.9, professional: 129.9 };
      const monthly = l.billing_cycle === 'annual'
        ? (prices[l.plan] || 0) * 10 / 12
        : (prices[l.plan] || 0);
      return sum + monthly;
    }, 0);

  const handleNew = () => { setEditingLicense(null); setDialogOpen(true); };
  const handleEdit = (lic) => { setEditingLicense(lic); setDialogOpen(true); };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">⚙️ Mediplan — Admin</h1>
            <p className="text-sm text-muted-foreground">Gestione licenze e abbonamenti</p>
          </div>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" /> Nuova licenza
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Licenze attive</p>
              <p className="text-3xl font-bold text-green-600">{active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">In prova (trial)</p>
              <p className="text-3xl font-bold text-blue-600">{trial}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Pagamenti scaduti</p>
              <p className="text-3xl font-bold text-red-600">{past_due}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">MRR stimato</p>
              <p className="text-3xl font-bold text-primary">€{mrr.toFixed(0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="licenses">
          <TabsList className="mb-4">
            <TabsTrigger value="licenses" className="gap-2"><CreditCard className="h-4 w-4" />Licenze</TabsTrigger>
            <TabsTrigger value="vouchers" className="gap-2"><Ticket className="h-4 w-4" />Voucher</TabsTrigger>
            <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" />Utenti non registrati</TabsTrigger>
          </TabsList>

          <TabsContent value="licenses">
            <LicenseList
              licenses={licenses}
              isLoading={isLoading}
              onEdit={handleEdit}
              onRefetch={refetch}
            />
          </TabsContent>

          <TabsContent value="vouchers">
            <VouchersPanel />
          </TabsContent>

          <TabsContent value="users">
            <UnregisteredUsersPanel />
          </TabsContent>
        </Tabs>
      </div>

      <LicenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        license={editingLicense}
        onSaved={refetch}
      />
    </div>
  );
}