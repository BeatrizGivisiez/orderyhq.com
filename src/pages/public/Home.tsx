import React from 'react';
import { Link } from 'react-router-dom';
import { Store, Smartphone, MessageCircle, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                <Store className="h-6 w-6" />
              </div>
              <span className="font-bold text-2xl tracking-tight">SaasMenu</span>
            </div>
            <div>
              <Link 
                to="/admin/login" 
                className="text-sm font-bold text-slate-600 hover:text-slate-900 mr-6 transition-colors"
              >
                Entrar
              </Link>
              <Link 
                to="/admin/login?mode=register" 
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm shadow-orange-100 transition-colors"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="relative pt-20 pb-24 sm:pt-32 sm:pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mb-8">
              O cardápio digital que <br className="hidden sm:block" />
              <span className="text-orange-500">vende no WhatsApp</span>
            </h1>
            <p className="mt-4 text-xl text-slate-500 max-w-2xl mx-auto font-medium">
              Receba pedidos em tempo real no seu painel e envie mensagens de status direto no WhatsApp do cliente. Sem taxas, sem comissões.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/admin/login?mode=register" 
                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
              >
                Criar meu cardápio agora <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            <div className="mt-8 flex justify-center items-center gap-6 text-sm font-bold text-slate-500">
              <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Sem taxas por pedido</span>
              <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Setup em 2 minutos</span>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900">Tudo que o seu delivery precisa</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#F8FAFC] border border-slate-200 rounded-3xl p-8 hover:border-orange-200 transition-colors">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                  <Smartphone className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Cardápio PWA UI</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  Um cardápio lindo, rápido e responsivo. Se parece com os grandes apps de delivery, mas é acessado direto pelo link (Instagram/WhatsApp).
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-slate-200 rounded-3xl p-8 hover:border-orange-200 transition-colors">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Painel em Tempo Real</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  Gerencie seus pedidos em uma tela como um Kanban profissional. Quando um pedido novo chega, você é avisado instantaneamente.
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-slate-200 rounded-3xl p-8 hover:border-orange-200 transition-colors">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                  <MessageCircle className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">WhatsApp 1 Clique</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  Avançou o status do pedido? Avisamos o cliente direto no WhatsApp dele com mensagens automáticas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-6 relative z-10">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
            <Store className="h-4 w-4" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">SaasMenu</span>
        </div>
        <p className="text-slate-500 text-sm font-medium">
          © {new Date().getFullYear()} SaasMenu. A forma mais elegante de vender pelo WhatsApp.
        </p>
      </footer>
    </div>
  );
};
