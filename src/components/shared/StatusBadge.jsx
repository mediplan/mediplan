import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles = {
  active: 'bg-accent/10 text-accent border-accent/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  suspended: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  on_leave: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  idoneo: 'bg-accent/10 text-accent border-accent/20',
  idoneo_con_prescrizioni: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  idoneo_con_limitazioni: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  temporaneamente_non_idoneo: 'bg-destructive/10 text-destructive border-destructive/20',
  non_idoneo: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusLabels = {
  active: 'Attivo',
  inactive: 'Inattivo',
  suspended: 'Sospeso',
  on_leave: 'In congedo',
  idoneo: 'Idoneo',
  idoneo_con_prescrizioni: 'Idoneo con prescrizioni',
  idoneo_con_limitazioni: 'Idoneo con limitazioni',
  temporaneamente_non_idoneo: 'Temp. non idoneo',
  non_idoneo: 'Non idoneo',
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <Badge variant="outline" className={cn('font-medium text-[11px]', statusStyles[status] || '')}>
      {statusLabels[status] || status.replace(/_/g, ' ')}
    </Badge>
  );
}