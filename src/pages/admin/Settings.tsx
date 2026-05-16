import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { MenuQrCode } from '../../components/admin/MenuQrCode';

export const Settings: React.FC = () => {
  const { tenant, refreshTenant } = useAuth();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [themeColor, setThemeColor] = useState('#f97316'); // Default tailwind orange-500
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      setName(tenant.name || '');
      setSlug(tenant.slug || '');
      setWhatsapp(tenant.whatsapp || '');
      setLogoUrl(tenant.logoUrl || '');
      setThemeColor(tenant.themeColor || '#f97316');
      setIsOpen(tenant.isOpen !== false); // default true if undefined
    }
  }, [tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    if (!name.trim()) {
      toast.error('O nome do restaurante é obrigatório.');
      return;
    }
    if (!slug.trim()) {
      toast.error('A URL do cardápio é obrigatória.');
      return;
    }
    if (!whatsapp.trim()) {
      toast.error('O número do WhatsApp é obrigatório.');
      return;
    }

    setLoading(true);

    try {
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
      setSlug(cleanSlug);

      const updateData = {
        ownerId: tenant.ownerId,
        name: name.trim(),
        slug: cleanSlug,
        whatsapp: whatsapp.trim(),
        logoUrl: logoUrl,
        themeColor: themeColor,
        isOpen: isOpen,
      };

      await updateDoc(doc(db, 'tenants', tenant.id), updateData);

      await refreshTenant();
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Update Firestore Error:', error);
      if (error?.code === 'permission-denied') {
        toast.error('Sem permissão para salvar. As regras do Firestore precisam ser publicadas no Firebase Console.', { duration: 6000 });
      } else if (error?.code === 'unavailable') {
        toast.error('Sem conexão com o servidor. Verifique sua internet e tente novamente.');
      } else {
        toast.error('Erro ao salvar as configurações. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const displaySlug = slug || 'seu-restaurante-aqui';
  const menuUrl = `${window.location.origin}/r/${displaySlug}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Configurações</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} noValidate className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            
            <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <input
                type="checkbox"
                id="isOpen"
                className="w-5 h-5 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                checked={isOpen}
                onChange={(e) => setIsOpen(e.target.checked)}
              />
              <div className="flex flex-col">
                <label htmlFor="isOpen" className="text-sm font-bold text-slate-900 cursor-pointer">
                  Restaurante Aberto?
                </label>
                <span className="text-xs text-slate-500">Permite que clientes façam pedidos no cardápio digital.</span>
              </div>
            </div>

            <Input
              label="Nome do Restaurante"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Burger Delivery"
              required
            />
            
            <div>
              <Input
                label="URL do Cardápio (Slug)"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="meu-restaurante"
                required
              />
              <p className="mt-1 text-xs text-slate-500 font-medium">Apenas letras minúsculas, hífen e números.</p>
              <p className="mt-2 text-xs text-slate-500 font-medium">
                Seu cardápio ficará disponível em: <span className="text-orange-500">{menuUrl}</span>
              </p>
            </div>

            <Input
              label="WhatsApp (com DDD)"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="11999999999"
              required
            />

            <Input
              label="URL da Logo (Opcional)"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://exemplo.com/logo.png"
            />

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Cor Principal (Tema)
              </label>
              <div className="flex items-center gap-3 mt-2">
                <div 
                  className="w-12 h-12 rounded-xl border border-slate-200 shadow-inner overflow-hidden flex-shrink-0"
                >
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-[150%] h-[150%] -m-2 cursor-pointer"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold uppercase text-slate-900">{themeColor}</span>
                  <span className="text-xs text-slate-500 font-mono">
                    RGB({parseInt(themeColor.slice(1, 3), 16)}, {parseInt(themeColor.slice(3, 5), 16)}, {parseInt(themeColor.slice(5, 7), 16)})
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button type="submit" isLoading={loading}>
                Salvar Configurações
              </Button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <MenuQrCode slug={tenant?.slug || ''} />
        </div>
      </div>
    </div>
  );
};
