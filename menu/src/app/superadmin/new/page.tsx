"use client";

import React, { useState, useRef } from "react";
import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { Store, Eye, EyeOff, Upload, X } from "lucide-react";
import { DEFAULT_TENANT_COLOR } from "@/lib/theme";
import firebaseConfig from "../../../../firebase-applet-config.json";

const SECONDARY = "sa-create";
const secondaryApp =
  getApps().find((a) => a.name === SECONDARY) ||
  initializeApp(firebaseConfig, SECONDARY);
const secondaryAuth = getAuth(secondaryApp);
const secondaryDb = getFirestore(secondaryApp);

const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD as string;
const CLOUDINARY_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET as string;

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const CreateRestaurant: React.FC = () => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [themeColor, setThemeColor] = useState(DEFAULT_TENANT_COLOR);
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleNameChange(val: string) {
    setName(val);
    setSlug(toSlug(val));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nome obrigatório.";
    if (!slug.trim() || !/^[a-z0-9-]+$/.test(slug))
      errs.slug = "Slug inválido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "E-mail inválido.";
    if (password.length < 6) errs.password = "Mínimo 6 caracteres.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Máximo 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    formData.append("public_id", `logos_${slug || Date.now()}`);

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable)
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        setLogoUrl(JSON.parse(xhr.responseText).secure_url);
        setUploadProgress(null);
        toast.success("Logo carregada!");
      } else {
        toast.error("Erro no upload.");
        setUploadProgress(null);
      }
    });
    xhr.addEventListener("error", () => {
      toast.error("Erro de conexão.");
      setUploadProgress(null);
    });
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    );
    xhr.send(formData);
    setUploadProgress(0);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password,
      );
      await setDoc(doc(secondaryDb, "tenants", cred.user.uid), {
        ownerId: cred.user.uid,
        name: name.trim(),
        slug: slug.trim(),
        whatsapp: whatsapp.trim(),
        themeColor,
        logoUrl,
        createdAt: Date.now(),
      });
      await signOut(secondaryAuth);
      toast.success(`Restaurante "${name}" criado!`);
      setName("");
      setSlug("");
      setWhatsapp("");
      setEmail("");
      setPassword("");
      setThemeColor(DEFAULT_TENANT_COLOR);
      setLogoUrl("");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setErrors((p) => ({ ...p, email: "E-mail já em uso." }));
      } else {
        toast.error(err.message || "Erro ao criar restaurante.");
      }
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-line-2 bg-surface-2 px-4 py-2.5 text-sm text-content placeholder:text-faint " +
    "focus:outline-none focus:ring-2 focus:ring-accent focus:bg-elevated";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content">
            Novo Restaurante
          </h1>
          <p className="text-sm text-muted mt-1">
            Cria a conta e o perfil do restaurante de uma vez.
          </p>
        </div>
        <button
          form="new-restaurant-form"
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent-2 text-accent-ink font-bold text-sm transition-colors disabled:opacity-60 shrink-0"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-accent-ink/30 border-t-accent-ink rounded-full animate-spin" />
          ) : (
            <>
              <Store className="h-4 w-4" /> Criar
            </>
          )}
        </button>
      </div>

      <form
        id="new-restaurant-form"
        onSubmit={handleSubmit}
        noValidate
        className="bg-surface rounded-2xl border border-line p-6 space-y-6"
      >
        {/* Row 1: Nome · Slug · WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-bold text-muted mb-1.5">
              Nome do restaurante
            </label>
            <input
              type="text"
              placeholder="Ex: Burger do João"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={fieldClass}
            />
            {errors.name && (
              <p className="text-xs text-warn mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-muted mb-1.5">
              Slug <span className="text-faint font-normal">(URL)</span>
            </label>
            <div className="flex items-center rounded-xl border border-line-2 overflow-hidden focus-within:ring-2 focus-within:ring-accent">
              <span className="px-3 py-2.5 text-sm text-faint border-r border-line-2 bg-elevated shrink-0">
                /r/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  )
                }
                className="flex-1 px-3 py-2.5 text-sm text-content bg-surface-2 focus:outline-none"
              />
            </div>
            {errors.slug && (
              <p className="text-xs text-warn mt-1">{errors.slug}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-muted mb-1.5">
              WhatsApp
            </label>
            <input
              type="tel"
              placeholder="5511999999999"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        {/* Row 2: Cor · Logo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-bold text-muted mb-1.5">
              Cor Principal
            </label>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-11 h-11 rounded-xl border border-line-2 overflow-hidden shrink-0">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-[150%] h-[150%] -m-2 cursor-pointer"
                />
              </div>
              <div>
                <span className="text-sm font-bold uppercase text-content">
                  {themeColor}
                </span>
                <p className="text-xs text-faint font-mono">
                  RGB({parseInt(themeColor.slice(1, 3), 16)},{" "}
                  {parseInt(themeColor.slice(3, 5), 16)},{" "}
                  {parseInt(themeColor.slice(5, 7), 16)})
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-bold text-muted mb-1.5">
              Logo do Restaurante
            </label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative shrink-0">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-14 h-14 rounded-full object-cover border border-line-2"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-warn text-white rounded-full flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-line-2 flex items-center justify-center shrink-0 text-faint">
                  <Upload className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1 space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoUpload(f);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadProgress !== null}
                  className="w-full py-2 px-4 rounded-xl border border-dashed border-line-2 text-sm text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
                >
                  {uploadProgress !== null
                    ? `A carregar… ${uploadProgress}%`
                    : logoUrl
                      ? "Trocar imagem"
                      : "Clica para fazer upload"}
                </button>
                {uploadProgress !== null && (
                  <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                <p className="text-xs text-faint">
                  PNG, JPG ou WEBP · máx. 5 MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Credenciais */}
        <div className="border-t border-line pt-5">
          <p className="text-xs font-bold text-faint uppercase tracking-wider mb-4">
            Credenciais de acesso
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-bold text-muted mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                placeholder="dono@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((p) => {
                    const n = { ...p };
                    delete n.email;
                    return n;
                  });
                }}
                className={fieldClass}
              />
              {errors.email && (
                <p className="text-xs text-warn mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-muted mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${fieldClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted transition-colors"
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-warn mt-1">{errors.password}</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateRestaurant;
