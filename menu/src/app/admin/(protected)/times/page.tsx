'use client';

import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { WeekSchedule, DaySchedule } from "@/types";

const DAYS: { key: keyof WeekSchedule; label: string }[] = [
  { key: "sun", label: "Domingo" },
  { key: "mon", label: "Segunda-feira" },
  { key: "tue", label: "Terça-feira" },
  { key: "wed", label: "Quarta-feira" },
  { key: "thu", label: "Quinta-feira" },
  { key: "fri", label: "Sexta-feira" },
  { key: "sat", label: "Sábado" },
];

const DEFAULT_SCHEDULE: WeekSchedule = {
  sun: { open: false, from: "09:00", to: "18:00" },
  mon: { open: false, from: "09:00", to: "18:00" },
  tue: { open: false, from: "09:00", to: "18:00" },
  wed: { open: false, from: "09:00", to: "18:00" },
  thu: { open: false, from: "09:00", to: "18:00" },
  fri: { open: false, from: "09:00", to: "18:00" },
  sat: { open: false, from: "09:00", to: "18:00" },
};

const timeInputClass =
  "w-24 rounded-lg border border-line-2 bg-surface-2 px-2 py-1.5 text-sm text-content " +
  "focus:outline-none focus:ring-2 focus:ring-accent focus:bg-elevated " +
  "disabled:opacity-30 disabled:cursor-not-allowed";

export const Times: React.FC = () => {
  const { tenant, refreshTenant } = useAuth();
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      setSchedule(tenant.schedule || DEFAULT_SCHEDULE);
    }
  }, [tenant]);

  const updateDay = (key: keyof WeekSchedule, changes: Partial<DaySchedule>) => {
    setSchedule((prev) => ({ ...prev, [key]: { ...prev[key], ...changes } }));
  };

  const save = async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "tenants", tenant.id), { schedule });
      await refreshTenant();
      toast.success("Horários guardados!");
    } catch (error: any) {
      console.error("Schedule update error:", error);
      toast.error("Erro ao guardar horários.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content">Horários de Funcionamento</h1>
          <p className="text-xs text-faint mt-1">
            O banner "Fechado" aparece automaticamente no cardápio fora do horário configurado.
          </p>
        </div>
        <Button type="button" isLoading={loading} onClick={save}>
          Salvar Horários
        </Button>
      </div>

      <div className="bg-surface rounded-xl border border-line p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left text-[11px] font-bold text-faint uppercase tracking-wider pb-2 pr-4 w-36">Dia</th>
                <th className="text-left text-[11px] font-bold text-faint uppercase tracking-wider pb-2 pr-6 w-28">Fechado</th>
                <th className="text-left text-[11px] font-bold text-faint uppercase tracking-wider pb-2 pr-4">Abre</th>
                <th className="text-left text-[11px] font-bold text-faint uppercase tracking-wider pb-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map(({ key, label }) => {
                const day = schedule[key];
                return (
                  <tr key={key} className="border-b border-line last:border-0">
                    <td className="py-3 pr-4">
                      <span className="text-sm font-medium text-muted">{label}</span>
                    </td>
                    <td className="py-3 pr-6">
                      <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                        <input
                          type="checkbox"
                          checked={!day.open}
                          onChange={(e) => updateDay(key, { open: !e.target.checked })}
                          className="w-4 h-4 accent-warn cursor-pointer"
                        />
                        <span className={`text-xs font-bold ${!day.open ? "text-warn" : "text-muted"}`}>
                          Fechado
                        </span>
                      </label>
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="time"
                        value={day.from}
                        disabled={!day.open}
                        onChange={(e) => updateDay(key, { from: e.target.value })}
                        style={{ colorScheme: "dark" }}
                        className={timeInputClass}
                      />
                    </td>
                    <td className="py-3">
                      <input
                        type="time"
                        value={day.to}
                        disabled={!day.open}
                        onChange={(e) => updateDay(key, { to: e.target.value })}
                        style={{ colorScheme: "dark" }}
                        className={timeInputClass}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Times;
