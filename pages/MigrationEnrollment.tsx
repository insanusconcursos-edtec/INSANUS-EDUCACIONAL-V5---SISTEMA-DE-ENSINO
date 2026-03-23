import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { UserPlus, LogIn, CheckCircle2, AlertCircle, Loader2, Mail, Lock, User, CreditCard, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MigrationEnrollment() {
  const { linkId } = useParams<{ linkId: string }>();
  const [linkData, setLinkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoginFlow, setIsLoginFlow] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    confirmEmail: '',
    cpf: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const validateLink = async () => {
      try {
        const response = await fetch(`/api/migration/${linkId}`);
        const data = await response.json();
        if (data.success) {
          setLinkData(data);
        } else {
          setError(data.error || 'Link inválido ou expirado.');
        }
      } catch (_err) {
        setError('Erro ao validar link.');
      } finally {
        setLoading(false);
      }
    };
    validateLink();
  }, [linkId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoginFlow) {
      if (formData.email !== formData.confirmEmail) {
        return toast.error('Os e-mails não coincidem.');
      }
      if (formData.password !== formData.confirmPassword) {
        return toast.error('As senhas não coincidem.');
      }
      if (formData.password.length < 6) {
        return toast.error('A senha deve ter pelo menos 6 caracteres.');
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/migration/${linkId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isLoginOnly: isLoginFlow
        })
      });

      const data = await response.json();

      if (response.status === 409) {
        // Usuário já existe
        setIsLoginFlow(true);
        toast.error('Este e-mail já está cadastrado. Por favor, faça login para vincular sua conta.');
      } else if (data.success) {
        setSuccess(true);
        toast.success('Inscrição realizada com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao processar inscrição.');
      }
    } catch (_err) {
      toast.error('Erro de conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Validando link de migração...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Ops! Algo deu errado</h2>
            <p className="text-zinc-500 text-sm">{error}</p>
          </div>
          <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest">Entre em contato com o suporte se acreditar que isso é um erro.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Migração Concluída!</h2>
            <p className="text-emerald-400 font-bold text-sm">Cadastro migrado com sucesso!</p>
            <p className="text-zinc-400 text-sm">Seu acesso já está liberado na nova plataforma. Você já pode fechar esta janela ou fazer login no portal do aluno.</p>
          </div>
          <div className="pt-4">
            <a 
              href="/login" 
              className="inline-block w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-900/20"
            >
              Ir para o Portal
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-8 bg-zinc-950/50 border-b border-zinc-800 text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
            Migração de Aluno
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
            {linkData.courseName}
          </h1>
          <p className="text-zinc-500 text-sm">Complete seus dados para liberar seu acesso imediato.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {isLoginFlow ? (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3">
                <AlertCircle className="text-blue-500 shrink-0" size={20} />
                <p className="text-zinc-400 text-xs">Identificamos que você já possui uma conta. Insira sua senha para vincular este curso ao seu perfil.</p>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="email"
                    readOnly
                    value={formData.email}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-zinc-500 focus:outline-none"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="password"
                    required
                    placeholder="Sua Senha"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-red-600 transition-all"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-left-4 duration-300">
              <div className="md:col-span-2 relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text"
                  required
                  placeholder="Nome Completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-red-600 transition-all"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="email"
                  required
                  placeholder="E-mail"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-red-600 transition-all"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="email"
                  required
                  placeholder="Confirme o E-mail"
                  value={formData.confirmEmail}
                  onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-red-600 transition-all"
                />
              </div>

              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text"
                  required
                  placeholder="CPF"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-red-600 transition-all"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text"
                  required
                  placeholder="WhatsApp"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-red-600 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="password"
                  required
                  placeholder="Senha"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-red-600 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="password"
                  required
                  placeholder="Confirme a Senha"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-red-600 transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : isLoginFlow ? (
              <>
                <LogIn size={20} />
                Vincular e Liberar Acesso
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Concluir Cadastro e Liberar Acesso
              </>
            )}
          </button>

          <p className="text-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
            Ao clicar em concluir, você concorda com nossos termos de uso e política de privacidade.
          </p>
        </form>
      </div>
    </div>
  );
}
