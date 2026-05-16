import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { Store } from 'lucide-react';
import { SUPER_ADMIN_EMAIL } from '../../contexts/AuthContext';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        toast.success('Bem-vindo de volta!');
        navigate(cred.user.email === SUPER_ADMIN_EMAIL ? '/superadmin' : '/admin');
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Create initial tenant doc
        await setDoc(doc(db, 'tenants', userCred.user.uid), {
          ownerId: userCred.user.uid,
          name: restaurantName || 'Meu Restaurante',
          slug: slug || email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-'),
          whatsapp: '',
          createdAt: Date.now(),
        });
        toast.success('Conta criada com sucesso!');
        navigate('/admin/settings');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg border border-gray-100">
        <div className="text-center">
          <Store className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Gerencie seu cardápio e pedidos em tempo real
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <Input
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
            {!isLogin && (
              <>
                <Input
                  label="Nome do Restaurante"
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Ex: Pizzaria do Zé"
                />
                <Input
                  label="URL do Cardápio (Exclusiva)"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="seu-restaurante"
                />
              </>
            )}
            <Input
              label="Senha"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div>
            <Button type="submit" className="w-full text-lg" isLoading={loading}>
              {isLogin ? 'Entrar' : 'Cadastrar restaurante'}
            </Button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
