import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatCard({ label, value, icon: Icon, color }) {
  const colorMap = {
    blue: 'bg-primary/10 text-primary',
    teal: 'bg-accent/10 text-accent',
    purple: 'bg-chart-3/10 text-chart-3',
    amber: 'bg-chart-4/10 text-chart-4',
    red: 'bg-destructive/10 text-destructive',
  };

  return (
    <Card className="p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-semibold text-foreground mt-2">{value}</p>
        </div>
        {Icon && (
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", colorMap[color] || colorMap.blue)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
}