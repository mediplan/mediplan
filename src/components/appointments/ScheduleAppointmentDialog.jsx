import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export default function ScheduleAppointmentDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  companyId,
  companyName,
  appointmentType = 'visita_medica',
}) {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    visit_type: 'periodica',
    notes: '',
  });

  const queryClient = useQueryClient();

  const createAppointmentMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Appointment.create({
        title: data.title,
        date: data.date,
        time: data.time,
        patient_id: patientId || null,
        patient_name: patientName || '',
        company_id: companyId || null,
        company_name: companyName || '',
        appointment_type: appointmentType,
        visit_type: data.visit_type,
        notes: data.notes,
        status: 'schedulato',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setFormData({
        title: '',
        date: '',
        time: '',
        visit_type: 'periodica',
        notes: '',
      });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      return;
    }
    createAppointmentMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {appointmentType === 'sopralluogo'
              ? 'Programma Sopralluogo'
              : 'Programma Visita'}
          </DialogTitle>
          <DialogDescription>
            {patientName && `Paziente: ${patientName}`}
            {companyName && `Azienda: ${companyName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titolo</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder={
                appointmentType === 'sopralluogo'
                  ? 'es. Sopralluogo tecnico'
                  : 'es. Visita periodica'
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Ora</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
              />
            </div>
          </div>

          {appointmentType === 'visita_medica' && (
            <div>
              <Label htmlFor="visit_type">Tipo Visita</Label>
              <Select
                value={formData.visit_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, visit_type: value })
                }
              >
                <SelectTrigger id="visit_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="periodica">Periodica</SelectItem>
                  <SelectItem value="su_richiesta">Su richiesta</SelectItem>
                  <SelectItem value="cambio_mansione">Cambio mansione</SelectItem>
                  <SelectItem value="rientro_malattia">Rientro malattia</SelectItem>
                  <SelectItem value="cessazione">Cessazione</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Note aggiuntive..."
              className="h-20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createAppointmentMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={createAppointmentMutation.isPending}
            >
              {createAppointmentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Programma
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}