'use client';

import React, { useState, useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { MenuQrCode } from "@/components/admin/MenuQrCode";
import { DEFAULT_TENANT_COLOR } from "@/lib/theme";
import { Upload, X } from "lucide-react";

const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD as string;
const CLOUDINARY_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET as string;

export const Settings: React.FC = () => {
  const { tenant, refreshTenant } = useAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [themeColor, setThemeColor] = useState(DEFAULT_TENANT_COLOR);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tenant) {
      setName(tenant.name || "");
      setSlug(tenant.slug || "");
      setWhatsapp(tenant.whatsapp || "");
      setLogoUrl(tenant.logoUrl || "");
      setThemeColor(tenant.themeColor || DEFAULT_TENANT_COLOR);
    }
  }, [tenant]);

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem válida."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("A imagem deve ter no máximo 5MB."); return; }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    formData.append("public_id", `logos_${tenant?.id}`);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        setLogoUrl(data.secure_url);
        setUploadProgress(null);
        toast.success("Logo carregada! Clica em Salvar para confirmar.");
      } else {
        toast.error("Erro ao fazer upload. Tenta novamente.");
        setUploadProgress(null);
      }
    });

    xhr.addEventListener("error", () => {
      toast.error("Erro de conexão durante o upload.");
      setUploadProgress(null);
    });

    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`);
    xhr.send(formData);
    setUploadProgress(0);
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-content">Configurações</h1>
        <Button type="button" isLoading={loading} onClick={save}>
          Salvar Configurações
        </Button>
      </div>

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
            </div>

            {/* Logo upload */}
            <div>
              <label className="block text-sm font-bold text-muted mb-3">Logo do Restaurante</label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative shrink-0">
                    <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover border border-line-2" />
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-warn text-white rounded-full flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-line-2 flex items-center justify-center shrink-0 text-faint">
                    <Upload className="h-5 w-5" />
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadProgress !== null}
                    className="w-full py-2.5 px-4 rounded-xl border border-dashed border-line-2 text-sm text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadProgress !== null
                      ? `A carregar… ${uploadProgress}%`
                      : logoUrl ? "Trocar imagem" : "Clica para fazer upload"}
                  </button>

                  {uploadProgress !== null && (
                    <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}

                  <p className="text-xs text-faint">PNG, JPG ou WEBP · máx. 5 MB</p>
                </div>
              </div>
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

export default Settings;
