import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Clock, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppointmentFormDialog from './AppointmentFormDialog';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  schedulato: 'bg-primary/80 text-white',
  completato: 'bg-teal-500 text-white',
  annullato: 'bg-muted text-muted-foreground line-through',
};

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export default function AppointmentCalendar() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const queryClient = useQueryClient();

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Appointment.list('-date', 500),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => data.id
      ? base44.entities.Appointment.update(data.id, data)
      : base44.entities.Appointment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setDialogOpen(false);
      setEditingAppt(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Appointment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });

  // 3 weeks: current + 2 following
  const weeks = [0, 1, 2].map(offset => {
    const wStart = addWeeks(currentWeekStart, offset);
    const days = Array.from({ length: 7 }, (_, i) => addDays(wStart, i));
    return { wStart, days, isCurrent: offset === 0 };
  });

  const getAppointmentsForDay = (day) =>
    appointments.filter(a => a.date && isSameDay(parseISO(a.date), day));

  const selectedDayAppts = selectedDay ? getAppointmentsForDay(selectedDay) : [];

  const handleNewAppt = (day) => {
    setEditingAppt(null);
    setSelectedDay(day);
    setDialogOpen(true);
  };

  const handleEdit = (appt) => {
    setEditingAppt(appt);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Eliminare questo appuntamento?')) deleteMutation.mutate(id);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base capitalize">
            Agenda — {format(today, "MMMM yyyy", { locale: it })}
          </CardTitle>
          <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => handleNewAppt(selectedDay || today)}>
            <Plus className="h-3.5 w-3.5" /> Nuovo
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b">
          {WEEKDAYS.map(wd => (
            <div key={wd} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {wd}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map(({ wStart, days, isCurrent }) => (
          <div key={wStart.toISOString()}>
            {/* Week label */}
            <div className={cn(
              'px-3 py-1 text-xs font-medium border-b',
              isCurrent ? 'bg-primary/10 text-primary' : 'bg-muted/40 text-muted-foreground'
            )}>
              {isCurrent
                ? `Settimana corrente — ${format(wStart, "d MMM", { locale: it })} › ${format(addDays(wStart, 6), "d MMM", { locale: it })}`
                : `${format(wStart, "d MMM", { locale: it })} › ${format(addDays(wStart, 6), "d MMM", { locale: it })}`
              }
            </div>

            {/* Days row */}
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const dayAppts = getAppointmentsForDay(day);
                const isToday = isSameDay(day, today);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const maxVisible = isCurrent ? 4 : 2;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={cn(
                      'p-1.5 border-b border-r cursor-pointer transition-colors',
                      isCurrent ? 'min-h-[110px]' : 'min-h-[64px]',
                      isCurrent && !isSelected && 'bg-primary/[0.02]',
                      isSelected && 'bg-primary/5 ring-1 ring-inset ring-primary/30',
                      'hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        'flex items-center justify-center rounded-full font-medium',
                        isCurrent ? 'text-sm w-7 h-7' : 'text-xs w-5 h-5',
                        isToday && 'bg-primary text-white',
                        !isToday && 'text-foreground',
                        isCurrent && !isToday && 'font-semibold',
                      )}>
                        {format(day, 'd')}
                      </span>
                      {isSelected && (
                        <button
                          onClick={e => { e.stopPropagation(); handleNewAppt(day); }}
                          className="text-primary hover:text-primary/70"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayAppts.slice(0, maxVisible).map(a => (
                        <div
                          key={a.id}
                          className={cn(
                            'px-1 rounded truncate',
                            isCurrent ? 'text-[11px] py-0.5' : 'text-[10px]',
                            STATUS_COLORS[a.status] || 'bg-primary/80 text-white'
                          )}
                          title={a.title}
                        >
                          {a.time && <span className="opacity-80 mr-1">{a.time}</span>}
                          {a.title}
                        </div>
                      ))}
                      {dayAppts.length > maxVisible && (
                        <div className="text-[10px] text-muted-foreground px-1">
                          +{dayAppts.length - maxVisible} altri
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Selected day panel */}
        {selectedDay && (
          <div className="border-t p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold capitalize">
                {format(selectedDay, "EEEE d MMMM yyyy", { locale: it })}
              </h3>
              <div className="flex gap-2">
                <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => handleNewAppt(selectedDay)}>
                  <Plus className="h-3.5 w-3.5" /> Aggiungi
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedDay(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {selectedDayAppts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun appuntamento per questo giorno.</p>
            ) : (
              <div className="space-y-2">
                {selectedDayAppts.map(a => (
                  <div key={a.id} className="flex items-start justify-between p-3 rounded-lg border bg-card gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {a.time && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />{a.time}
                          </span>
                        )}
                        <Badge className={cn('text-xs', STATUS_COLORS[a.status])}>{a.status}</Badge>
                        {a.visit_type && <Badge variant="outline" className="text-xs">{a.visit_type}</Badge>}
                      </div>
                      <p className="text-sm font-medium mt-1">{a.title}</p>
                      {a.patient_name && <p className="text-xs text-muted-foreground">{a.patient_name}</p>}
                      {a.company_name && <p className="text-xs text-muted-foreground">{a.company_name}</p>}
                      {a.notes && <p className="text-xs text-muted-foreground mt-1 italic">{a.notes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(a)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <AppointmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={editingAppt}
        initialDate={selectedDay ? format(selectedDay, 'yyyy-MM-dd') : ''}
        onSave={(data) => saveMutation.mutate(data)}
      />
    </Card>
  );
}