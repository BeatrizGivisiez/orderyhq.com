import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import toast from "react-hot-toast";
import { MenuQrCode } from "../../components/admin/MenuQrCode";
import { DEFAULT_TENANT_COLOR } from "../../lib/theme";

const convertDriveUrl = (url: string): string => {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;
  return url;
};

export const Settings: React.FC = () => {
  const { tenant, refreshTenant } = useAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [themeColor, setThemeColor] = useState(DEFAULT_TENANT_COLOR);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      setName(tenant.name || "");
      setSlug(tenant.slug || "");
      setWhatsapp(tenant.whatsapp || "");
      setLogoUrl(tenant.logoUrl || "");
      setThemeColor(tenant.themeColor || DEFAULT_TENANT_COLOR);
    }
  }, [tenant]);

  const save = async () => {
    if (!tenant) return;
    if (!name.trim()) { toast.error("O nome do restaurante é obrigatório."); return; }
    if (!slug.trim()) { toast.error("A URL do cardápio é obrigatória."); return; }
    if (!whatsapp.trim()) { toast.error("O número do WhatsApp é obrigatório."); return; }

    setLoading(true);
    try {
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
      setSlug(cleanSlug);

      await updateDoc(doc(db, "tenants", tenant.id), {
        ownerId: tenant.ownerId,
        name: name.trim(),
        slug: cleanSlug,
        whatsapp: whatsapp.trim(),
        logoUrl,
        themeColor,
      });

      await refreshTenant();
      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      console.error("Update error:", error);
      if (error?.code === "permission-denied") {
        toast.error("Sem permissão para salvar.", { duration: 6000 });
      } else if (error?.code === "unavailable") {
        toast.error("Sem conexão com o servidor.");
      } else {
        toast.error("Erro ao salvar as configurações.");
      }
    } finally {
      setLoading(false);
    }
  };

  const displaySlug = slug || "seu-restaurante-aqui";
  const menuUrl = `${window.location.origin}/r/${displaySlug}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-content">Configurações</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-xl border border-line p-6 space-y-6">

            <div className="grid grid-cols-2 gap-4">
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
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="meu-restaurante"
                  required
                />
                <p className="mt-1 text-xs text-faint font-medium">Apenas letras minúsculas, hífen e números.</p>
              </div>
            </div>

            <p className="text-xs text-faint font-medium -mt-4">
              Cardápio disponível em: <span className="text-accent">{menuUrl}</span>
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="WhatsApp (com DDD)"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="11999999999"
                required
              />

              <div>
                <label className="block text-sm font-bold text-muted mb-1">
                  Cor Principal (Tema do Cardápio)
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-12 h-12 rounded-xl border border-line-2 overflow-hidden flex-shrink-0">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-[150%] h-[150%] -m-2 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold uppercase text-content">{themeColor}</span>
                    <span className="text-xs text-faint font-mono">
                      RGB({parseInt(themeColor.slice(1, 3), 16)}, {parseInt(themeColor.slice(3, 5), 16)}, {parseInt(themeColor.slice(5, 7), 16)})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 col-span-2">
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-full object-cover border border-line-2 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <Input
                    label="URL da Logo (Opcional)"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(convertDriveUrl(e.target.value))}
                    placeholder="https://... ou link do Google Drive"
                  />
                  <p className="mt-1 text-xs text-faint">Links do Google Drive são convertidos automaticamente.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-line flex justify-end">
              <Button type="button" isLoading={loading} onClick={save}>
                Salvar Configurações
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <MenuQrCode slug={tenant?.slug || ""} />
        </div>
      </div>
    </div>
  );
};
