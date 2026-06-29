import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Tenant } from '../../types';
import { Store, ExternalLink, Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { DEFAULT_TENANT_COLOR } from '../../lib/theme';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const SuperAdminDashboard: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'tenants'),
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Tenant));
        data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setTenants(data);
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao buscar tenants:', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-elevated rounded w-1/4"></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-elevated rounded-2xl"></div>)}
      </div>
      <div className="h-64 bg-elevated rounded-2xl"></div>
    </div>
  );

  const thisMonth = tenants.filter(t => {
    if (!t.createdAt) return false;
    const d = new Date(t.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-content">Painel Master</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl border border-line shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-faint" />
            <p className="text-xs font-bold text-faint uppercase tracking-wider">Total clientes</p>
          </div>
          <p className="text-3xl font-bold text-content">{tenants.length}</p>
        </div>

        <div className="bg-surface rounded-2xl border border-line shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-accent" />
            <p className="text-xs font-bold text-faint uppercase tracking-wider">Cadastrados</p>
          </div>
          <p className="text-3xl font-bold text-accent">{tenants.length}</p>
        </div>

        <div className="bg-surface rounded-2xl border border-line shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-4 w-4 text-faint" />
            <p className="text-xs font-bold text-faint uppercase tracking-wider">Inativos</p>
          </div>
          <p className="text-3xl font-bold text-muted">0</p>
        </div>

        <div className="bg-surface rounded-2xl border border-line shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <p className="text-xs font-bold text-faint uppercase tracking-wider">Novos este mês</p>
          </div>
          <p className="text-3xl font-bold text-orange-500">{thisMonth}</p>
        </div>
      </div>

      {/* Tenants list */}
      <div className="bg-surface rounded-2xl border border-line overflow-hidden">
        {tenants.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-faint mx-auto mb-3" />
            <p className="text-muted font-medium text-sm">Nenhum restaurante cadastrado ainda.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-faint uppercase tracking-wider">Restaurante</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-faint uppercase tracking-wider hidden sm:table-cell">Slug</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-faint uppercase tracking-wider hidden md:table-cell">Cadastro</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-elevated transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 overflow-hidden"
                        style={{ backgroundColor: tenant.themeColor || DEFAULT_TENANT_COLOR }}
                      >
                        {tenant.logoUrl
                          ? <img src={tenant.logoUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          : <Store className="h-4 w-4" />
                        }
                      </div>
                      <div>
                        <p className="font-bold text-content">{tenant.name}</p>
                        <p className="text-xs text-faint">{tenant.whatsapp || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="font-mono text-xs text-muted">{tenant.slug}</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-xs text-muted">
                    {tenant.createdAt ? format(new Date(tenant.createdAt), "dd/MM/yyyy", { locale: ptBR }) : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <a
                      href={`/r/${tenant.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-faint hover:text-accent transition-colors inline-flex"
                      title="Ver cardápio"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
