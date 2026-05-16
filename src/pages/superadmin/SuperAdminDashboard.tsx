import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Tenant } from '../../types';
import { Store, ExternalLink, Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TenantWithStats = Tenant;

export const SuperAdminDashboard: React.FC = () => {
  const [tenants, setTenants] = useState<TenantWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'tenants'),
      (snap) => {
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        } as TenantWithStats));
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
      <div className="h-8 bg-slate-200 rounded w-1/4"></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>)}
      </div>
      <div className="h-64 bg-slate-200 rounded-2xl"></div>
    </div>
  );

  const openCount = tenants.filter(t => t.isOpen !== false).length;
  const closedCount = tenants.length - openCount;

  const thisMonth = tenants.filter(t => {
    if (!t.createdAt) return false;
    const d = new Date(t.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Painel Master</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total clientes</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{tenants.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Abertos agora</p>
          </div>
          <p className="text-3xl font-bold text-green-600">{openCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fechados agora</p>
          </div>
          <p className="text-3xl font-bold text-slate-500">{closedCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Novos este mês</p>
          </div>
          <p className="text-3xl font-bold text-orange-500">{thisMonth}</p>
        </div>
      </div>

      {/* Tenants list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {tenants.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium text-sm">Nenhum restaurante cadastrado ainda.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Restaurante</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Slug</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Cadastro</th>
                <th className="text-right px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: tenant.themeColor || '#f97316' }}
                      >
                        {tenant.logoUrl
                          ? <img src={tenant.logoUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                          : <Store className="h-4 w-4" />
                        }
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{tenant.name}</p>
                        <p className="text-xs text-slate-400">{tenant.whatsapp || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="font-mono text-xs text-slate-500">{tenant.slug}</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-xs text-slate-500">
                    {tenant.createdAt ? format(new Date(tenant.createdAt), "dd/MM/yyyy", { locale: ptBR }) : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${tenant.isOpen !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {tenant.isOpen !== false ? 'Aberto' : 'Fechado'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <a
                      href={`/r/${tenant.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-orange-500 transition-colors inline-flex"
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
