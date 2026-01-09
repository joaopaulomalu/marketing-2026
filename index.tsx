
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { marked } from 'marked';

// --- Types ---
type ContentStatus = 'pending' | 'draft' | 'completed';

interface Article {
  id: string;
  category: string;
  title: string;
  keyword: string;
  intent: string;
  status: ContentStatus;
}

interface MonthPlan {
  id: number;
  month: string;
  focus: string;
  strategy: string;
  articles: Article[];
}

interface CustomAction {
  id: string;
  monthId: number;
  title: string;
  type: string;
  channel: string;
  status: ContentStatus;
}

// --- Initial Data ---
const INITIAL_PLAN: MonthPlan[] = [
  { id: 0, month: "Janeiro", focus: "Planejamento & Distratos", strategy: "Início de ano, foco em financeiro e distratos imobiliários.", articles: [
    { id: 'jan1', category: "Imobiliário", title: "Comprei imóvel na planta e me arrependi: Distrato 2026", keyword: "distrato", intent: "Educativo", status: 'pending' },
    { id: 'jan2', category: "Execução", title: "Defesa em Execução Cível: Protegendo bens", keyword: "defesa execução", intent: "Autoridade", status: 'pending' },
    { id: 'jan3', category: "Inventário", title: "Planejamento Sucessório: Começando o ano", keyword: "planejamento", intent: "Conscientização", status: 'pending' }
  ]},
  { id: 1, month: "Fevereiro", focus: "Atrasos & Cobrança", strategy: "Volta às aulas/obras. Foco em atrasos de entrega e cobranças.", articles: [
    { id: 'fev1', category: "Imobiliário", title: "Atraso na entrega da obra: Indenizações", keyword: "atraso obra", intent: "Conversão", status: 'pending' },
    { id: 'fev2', category: "Execução", title: "Cobrança de Aluguel: Execução vs Despejo", keyword: "aluguel", intent: "Autoridade", status: 'pending' },
    { id: 'fev3', category: "Imobiliário", title: "Congelamento do Saldo Devedor", keyword: "saldo devedor", intent: "Educativo", status: 'pending' }
  ]},
  { id: 2, month: "Março", focus: "Consumidor & IR", strategy: "Mês do consumidor e impacto legal na declaração de IR.", articles: [
    { id: 'mar1', category: "Inventário", title: "Custos do Inventário Extrajudicial 2026", keyword: "custo inventário", intent: "Educativo", status: 'pending' },
    { id: 'mar2', category: "Imobiliário", title: "Cuidados na Compra de Imóvel na Planta", keyword: "compra planta", intent: "Prevenção", status: 'pending' },
    { id: 'mar3', category: "Execução", title: "Busca de Bens: Sisbajud e Renajud", keyword: "busca bens", intent: "Autoridade", status: 'pending' }
  ]},
  { id: 3, month: "Abril", focus: "Prazos & Multas", strategy: "Multas de inventário e vícios ocultos em construções recentes.", articles: [
    { id: 'abr1', category: "Inventário", title: "Multa no Inventário: Prazos Críticos", keyword: "multa inventário", intent: "Urgência", status: 'pending' },
    { id: 'abr2', category: "Imobiliário", title: "Vícios Construtivos e Garantia Decenal", keyword: "vícios obra", intent: "Educativo", status: 'pending' },
    { id: 'abr3', category: "Execução", title: "Título Extrajudicial: Documentos Essenciais", keyword: "título extrajudicial", intent: "Educativo", status: 'pending' }
  ]},
  { id: 4, month: "Maio", focus: "Família & Imóveis", strategy: "Impacto dos regimes de bens na compra e venda de imóveis.", articles: [
    { id: 'mai1', category: "Imobiliário", title: "Compra de Imóvel e Regime de Bens", keyword: "regime bens", intent: "Educativo", status: 'pending' },
    { id: 'mai2', category: "Inventário", title: "Divergência entre Herdeiros: Soluções Práticas", keyword: "herdeiros", intent: "Solução", status: 'pending' },
    { id: 'mai3', category: "Execução", title: "Penhora de Salário: Novos Entendimentos STJ", keyword: "penhora salário", intent: "Atualidade", status: 'pending' }
  ]},
  { id: 5, month: "Junho", focus: "Revisão Contratual", strategy: "Meio de ano. Revisão de juros abusivos e fraudes patrimoniais.", articles: [
    { id: 'jun1', category: "Imobiliário", title: "Juros de Obra: Quando cobrar a devolução?", keyword: "juros obra", intent: "Conversão", status: 'pending' },
    { id: 'jun2', category: "Execução", title: "Fraude à Execução: Doação de bens para filhos", keyword: "fraude", intent: "Autoridade", status: 'pending' },
    { id: 'jun3', category: "Inventário", title: "Venda de Imóvel durante Inventário: Alvará", keyword: "venda espólio", intent: "Solução", status: 'pending' }
  ]},
  { id: 6, month: "Julho", focus: "Investidores", strategy: "Mês focado em leilões, arrematação e regularização.", articles: [
    { id: 'jul1', category: "Imobiliário", title: "Leilões e Dívidas de Condomínio: Quem paga?", keyword: "leilão", intent: "Nicho", status: 'pending' },
    { id: 'jul2', category: "Imobiliário", title: "Distrato por Culpa da Construtora: 100% devolução", keyword: "culpa construtora", intent: "Conversão", status: 'pending' },
    { id: 'jul3', category: "Execução", title: "Prescrição de Dívidas: Como alegar?", keyword: "prescrição", intent: "Educativo", status: 'pending' }
  ]},
  { id: 7, month: "Agosto", focus: "Pais & Sucessão", strategy: "Dia dos pais. Foco em Doação em Vida vs Inventário.", articles: [
    { id: 'ago1', category: "Inventário", title: "Doação em Vida vs Inventário: Custos", keyword: "doação", intent: "Comparativo", status: 'pending' },
    { id: 'ago2', category: "Execução", title: "Bem de Família e Penhora: Limites Legais", keyword: "bem família", intent: "Defesa", status: 'pending' },
    { id: 'ago3', category: "Imobiliário", title: "Taxa de Corretagem no Distrato: É devida?", keyword: "corretagem", intent: "Dúvida", status: 'pending' }
  ]},
  { id: 8, month: "Setembro", focus: "Defesa do Consumidor", strategy: "Análise de cláusulas abusivas em contratos de adesão.", articles: [
    { id: 'set1', category: "Imobiliário", title: "Cláusulas Abusivas em Contratos Imobiliários", keyword: "abusivas", intent: "Autoridade", status: 'pending' },
    { id: 'set2', category: "Execução", title: "Cobrança de Cheque e Nota Promissória", keyword: "cheque", intent: "Educativo", status: 'pending' },
    { id: 'set3', category: "Inventário", title: "Inventário com Testamento: Trâmite Especial", keyword: "testamento", intent: "Atualidade", status: 'pending' }
  ]},
  { id: 9, month: "Outubro", focus: "Reta Final de Recuperação", strategy: "Acelerar execuções antes do recesso forense.", articles: [
    { id: 'out1', category: "Execução", title: "Recuperação de Crédito antes do Recesso", keyword: "recuperação", intent: "Estratégia", status: 'pending' },
    { id: 'out2', category: "Imobiliário", title: "Checklist de Vistoria: Recuse as chaves se necessário", keyword: "vistoria", intent: "Utilidade", status: 'pending' },
    { id: 'out3', category: "Imobiliário", title: "Distrato por Negativa de Financiamento", keyword: "financiamento", intent: "Dor", status: 'pending' }
  ]},
  { id: 10, month: "Novembro", focus: "Oportunidades & Tributos", strategy: "Black Friday e uso do 13º para regularização tributária.", articles: [
    { id: 'nov1', category: "Imobiliário", title: "Cuidados na Black Friday Imobiliária", keyword: "black friday", intent: "Alerta", status: 'pending' },
    { id: 'nov2', category: "Inventário", title: "Usando 13º para quitar o ITCMD", keyword: "itcmd", intent: "Solução", status: 'pending' },
    { id: 'nov3', category: "Execução", title: "Penhora de Faturamento: Como funciona?", keyword: "faturamento", intent: "Avançado", status: 'pending' }
  ]},
  { id: 11, month: "Dezembro", focus: "Retrospectiva & Recesso", strategy: "Dicas práticas para o período de recesso e prazos.", articles: [
    { id: 'dez1', category: "Geral", title: "Recesso Forense 2026 e a Contagem de Prazos", keyword: "recesso", intent: "Informativo", status: 'pending' },
    { id: 'dez2', category: "Imobiliário", title: "Atraso de Obra e Lucros Cessantes no Fim de Ano", keyword: "atraso", intent: "Prático", status: 'pending' },
    { id: 'dez3', category: "Inventário", title: "Regularizando bens de heranças antigas", keyword: "bens antigos", intent: "Complexidade", status: 'pending' }
  ]}
];

// --- Helper Functions ---
const getNextStatus = (current: ContentStatus): ContentStatus => {
  if (current === 'pending') return 'draft';
  if (current === 'draft') return 'completed';
  return 'pending';
};

const getStatusStyles = (status: ContentStatus) => {
  switch (status) {
    case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'draft': return 'bg-amber-100 text-amber-800 border-amber-200';
    default: return 'bg-slate-100 text-slate-500 border-slate-200';
  }
};

const getStatusLabel = (status: ContentStatus) => {
  switch (status) {
    case 'completed': return 'Finalizado';
    case 'draft': return 'Em Escrita';
    default: return 'A Fazer';
  }
};

const getCategoryIcon = (category: string) => {
  if (category.includes('Imob')) return 'fa-house-chimney';
  if (category.includes('Exec')) return 'fa-gavel';
  if (category.includes('Inv')) return 'fa-scroll';
  return 'fa-file-lines';
};

// --- Custom Checkbox UI ---
const Checkbox = ({ checked, onChange, title }: { checked: boolean, onChange: (checked: boolean) => void, title?: string }) => (
  <div 
    onClick={() => onChange(!checked)}
    title={title}
    className={`w-6 h-6 rounded-md border-2 transition-all cursor-pointer flex items-center justify-center shrink-0 ${
      checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-slate-400 bg-white'
    }`}
  >
    {checked && <i className="fas fa-check text-[10px] font-bold"></i>}
  </div>
);

// --- Components ---

const App: React.FC = () => {
  const [plan, setPlan] = useState<MonthPlan[]>(INITIAL_PLAN);
  const [customActions, setCustomActions] = useState<CustomAction[]>([]);
  const [currentMonthId, setCurrentMonthId] = useState(0);
  const [activeTab, setActiveTab] = useState<'calendar' | 'strategy' | 'report'>('calendar');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [aiContent, setAIContent] = useState('');
  const [aiLoading, setAILoading] = useState(false);
  const [aiTitle, setAITitle] = useState('');
  const [lastSaved, setLastSaved] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist State
  useEffect(() => {
    const saved = localStorage.getItem('adv_mkt_2026_state_v2');
    if (saved) {
      try {
        const { plan: savedPlan, customActions: savedCustom } = JSON.parse(saved);
        if (savedPlan) setPlan(savedPlan);
        if (savedCustom) setCustomActions(savedCustom);
        setLastSaved(new Date().toLocaleTimeString());
      } catch (e) { console.error("Error loading state", e); }
    }
  }, []);

  useEffect(() => {
    setIsSaving(true);
    const timeout = setTimeout(() => {
      localStorage.setItem('adv_mkt_2026_state_v2', JSON.stringify({ plan, customActions }));
      setLastSaved(new Date().toLocaleTimeString());
      setIsSaving(false);
    }, 500);
    return () => clearTimeout(timeout);
  }, [plan, customActions]);

  const stats = useMemo(() => {
    let total = 0, done = 0;
    plan.forEach(m => m.articles.forEach(a => { total++; if (a.status === 'completed') done++; }));
    customActions.forEach(a => { total++; if (a.status === 'completed') done++; });
    return { total, done, percent: total > 0 ? (done / total) * 100 : 0 };
  }, [plan, customActions]);

  const cycleArticleStatus = (articleId: string) => {
    setPlan(prev => prev.map(m => ({
      ...m,
      articles: m.articles.map(a => a.id === articleId ? { ...a, status: getNextStatus(a.status) } : a)
    })));
  };

  const toggleArticleCompleted = (articleId: string, checked: boolean) => {
    setPlan(prev => prev.map(m => ({
      ...m,
      articles: m.articles.map(a => a.id === articleId ? { ...a, status: checked ? 'completed' : 'pending' } : a)
    })));
  };

  const cycleCustomStatus = (id: string) => {
    setCustomActions(prev => prev.map(a => a.id === id ? { ...a, status: getNextStatus(a.status) } : a));
  };

  const toggleCustomCompleted = (id: string, checked: boolean) => {
    setCustomActions(prev => prev.map(a => a.id === id ? { ...a, status: checked ? 'completed' : 'pending' } : a));
  };

  const deleteCustomAction = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta ação?')) {
      setCustomActions(prev => prev.filter(a => a.id !== id));
    }
  };

  const resetPlan = () => {
    if (confirm('ATENÇÃO: Isso apagará todo o seu progresso e voltará ao plano original. Continuar?')) {
      setPlan(INITIAL_PLAN);
      setCustomActions([]);
      localStorage.removeItem('adv_mkt_2026_state_v2');
      window.location.reload();
    }
  };

  const generateWithAI = async (title: string, context?: string) => {
    setAITitle(title);
    setIsAIModalOpen(true);
    setAILoading(true);
    setAIContent('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Atue como um Especialista em Marketing Jurídico Sênior focado em Direito Imobiliário e Cível. 
        Crie um conteúdo completo e persuasivo em Markdown para o tema: "${title}". 
        Considere o seguinte contexto estratégico: "${context || 'Marketing Ético OAB'}".
        O conteúdo deve ser estruturado com: Título atraente, Introdução com dor do cliente, 3 Pontos principais explicativos, Conclusão e CTA (Chamada para ação).`,
      });
      setAIContent(response.text || 'Erro ao gerar conteúdo.');
    } catch (error) {
      setAIContent('Erro na conexão com o servidor de IA. Verifique sua chave API.');
    } finally {
      setAILoading(false);
    }
  };

  const addCustomAction = (data: Partial<CustomAction> & { monthId: number }) => {
    const newAction: CustomAction = {
      id: `cust-${Date.now()}`,
      monthId: data.monthId,
      title: data.title || '',
      type: data.type || 'Post',
      channel: data.channel || 'Instagram',
      status: 'pending'
    };
    setCustomActions([...customActions, newAction]);
    setIsAddModalOpen(false);
  };

  const downloadBackup = () => {
    const data = JSON.stringify({ plan, customActions }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_juridico_2026_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const restoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const { plan: restoredPlan, customActions: restoredCustom } = JSON.parse(event.target?.result as string);
        if (restoredPlan) setPlan(restoredPlan);
        if (restoredCustom) setCustomActions(restoredCustom);
        alert('Backup restaurado com sucesso!');
      } catch (err) {
        alert('Erro ao processar arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  const currentMonthData = plan[currentMonthId];
  const currentMonthCustoms = customActions.filter(a => a.monthId === currentMonthId);

  return (
    <div className="min-h-screen flex flex-col pb-12 transition-colors duration-500">
      <header className="sticky top-0 z-50 glass border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl hover:rotate-6 transition-transform cursor-pointer">
              <i className="fas fa-balance-scale text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Legal Growth 2026</h1>
              <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                Estratégia Imobiliária & Cível
              </p>
            </div>
          </div>

          <nav className="hidden md:flex bg-slate-100 p-1.5 rounded-2xl gap-1">
            <NavTab active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon="fa-calendar-day" label="Calendário" />
            <NavTab active={activeTab === 'strategy'} onClick={() => setActiveTab('strategy')} icon="fa-bullseye" label="Estratégia" />
            <NavTab active={activeTab === 'report'} onClick={() => setActiveTab('report')} icon="fa-chart-line" label="Relatórios" />
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execução</span>
              <span className="text-sm font-black text-slate-700">{stats.done}/{stats.total}</span>
            </div>
            <div className="w-24 h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-1000 ease-out"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
            <div className="flex gap-2 border-l border-slate-200 pl-4">
                <button onClick={downloadBackup} title="Baixar Backup" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all">
                <i className="fas fa-download"></i>
                </button>
                <button onClick={() => fileInputRef.current?.click()} title="Restaurar Backup" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all">
                <i className="fas fa-upload"></i>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={restoreBackup} />
                </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            <aside className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Mês Corrente</h3>
                <div className="grid grid-cols-3 gap-2">
                  {plan.map(m => (
                    <button 
                      key={m.id}
                      onClick={() => setCurrentMonthId(m.id)}
                      className={`py-3 rounded-xl text-xs font-bold transition-all border ${currentMonthId === m.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
                    >
                      {m.month.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group cursor-pointer" onClick={() => setActiveTab('strategy')}>
                <i className="fas fa-lightbulb absolute -bottom-4 -right-4 text-7xl opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform"></i>
                <h4 className="font-bold text-sm mb-2">Estratégia 2026</h4>
                <p className="text-xs text-white/70 leading-relaxed mb-4">Veja como multiplicar o alcance de cada postagem.</p>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                    Acessar guia <i className="fas fa-arrow-right"></i>
                </div>
              </div>

              <div className="pt-4 px-2">
                <button 
                  onClick={resetPlan}
                  className="w-full py-3 px-4 rounded-2xl border border-red-50 border-dashed text-red-300 text-[10px] font-black uppercase tracking-widest hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-rotate-left"></i>
                  Resetar Dados
                </button>
              </div>
            </aside>

            <section className="lg:col-span-9 space-y-6">
              <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700"></div>
                <div className="p-8 md:p-12">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full uppercase tracking-widest">{currentMonthData.month}</span>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tight mt-4">{currentMonthData.focus}</h2>
                    </div>
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all transform hover:-translate-y-1 shadow-xl"
                    >
                      <i className="fas fa-plus"></i> Nova Ação
                    </button>
                  </div>

                  <div className="bg-indigo-50/30 rounded-3xl p-6 border border-indigo-100 mb-10 flex gap-6 items-start">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 shrink-0">
                      <i className="fas fa-compass"></i>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Diretriz do Mês</h4>
                      <p className="text-slate-600 text-sm leading-relaxed font-medium">{currentMonthData.strategy}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-3 mb-6">
                      <span className="w-8 h-[1px] bg-slate-200"></span>
                      Painel de Atividades
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentMonthData.articles.map(article => (
                        <ArticleCard 
                          key={article.id} 
                          article={article} 
                          onCycle={() => cycleArticleStatus(article.id)}
                          onToggle={(checked) => toggleArticleCompleted(article.id, checked)}
                          onAI={() => generateWithAI(article.title, `Categoria: ${article.category}, Palavra-chave: ${article.keyword}`)}
                        />
                      ))}
                      {currentMonthCustoms.map(action => (
                        <CustomActionCard 
                          key={action.id} 
                          action={action} 
                          onCycle={() => cycleCustomStatus(action.id)}
                          onToggle={(checked) => toggleCustomCompleted(action.id, checked)}
                          onAI={() => generateWithAI(action.title, `Tipo: ${action.type}, Canal: ${action.channel}`)}
                          onDelete={() => deleteCustomAction(action.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'strategy' && <StrategyView />}
        {activeTab === 'report' && <ReportView plan={plan} customs={customActions} />}
      </main>

      <footer className="max-w-7xl mx-auto w-full px-4 pt-10 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-100 mt-8">
        <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Legal Marketing Suite 2026</p>
            <span className="hidden md:block w-1 h-1 bg-slate-300 rounded-full"></span>
            <div className="bg-indigo-50 px-3 py-1 rounded-full text-[9px] font-black text-indigo-600 uppercase">v1.2.0 - Jan/2026</div>
        </div>
        <div className="flex items-center gap-4">
           <div className={`flex items-center gap-2 transition-opacity duration-300 ${isSaving ? 'opacity-100' : 'opacity-40'}`}>
              <i className={`fas fa-cloud-arrow-up text-xs ${isSaving ? 'text-indigo-500 animate-bounce' : 'text-slate-400'}`}></i>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isSaving ? 'Salvando Alterações...' : `Sincronizado às ${lastSaved}`}
              </span>
           </div>
        </div>
      </footer>

      {isAIModalOpen && (
        <AIOutputModal 
          title={aiTitle} 
          content={aiContent} 
          loading={aiLoading} 
          onClose={() => setIsAIModalOpen(false)} 
        />
      )}

      {isAddModalOpen && (
        <AddActionModal 
          onClose={() => setIsAddModalOpen(false)}
          onAdd={addCustomAction}
          months={plan}
          initialMonthId={currentMonthId}
        />
      )}
    </div>
  );
};

const NavTab = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${active ? 'bg-white text-indigo-700 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
  >
    <i className={`fas ${icon} text-sm ${active ? 'text-indigo-600' : 'text-slate-400'}`}></i>
    {label}
  </button>
);

const ArticleCard: React.FC<{ article: Article, onCycle: () => void, onToggle: (checked: boolean) => void, onAI: () => void }> = ({ article, onCycle, onToggle, onAI }) => {
  const isCompleted = article.status === 'completed';
  const isDraft = article.status === 'draft';

  return (
    <div className={`p-6 rounded-3xl border transition-all group relative ${isCompleted ? 'bg-emerald-50 border-emerald-100 opacity-80' : isDraft ? 'bg-amber-50 border-amber-100 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50'}`}>
      <div className="flex gap-4 items-start">
        <div className="flex flex-col items-center gap-2 pt-1">
          <Checkbox 
            checked={isCompleted}
            onChange={onToggle}
            title="Concluir atividade"
          />
          <button 
            onClick={onCycle}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-500 text-white shadow-md' : isDraft ? 'bg-amber-400 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            <i className={`fas ${isCompleted ? 'fa-check' : isDraft ? 'fa-pen-to-square' : getCategoryIcon(article.category)}`}></i>
          </button>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg">{article.category}</span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase border ${getStatusStyles(article.status)}`}>{getStatusLabel(article.status)}</span>
          </div>
          <h4 className={`font-black text-slate-800 leading-tight mb-4 text-[15px] ${isCompleted ? 'line-through text-slate-400' : ''}`}>{article.title}</h4>
          <div className="flex justify-between items-center">
             <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Palavra-chave</span>
                <span className="text-[10px] font-black text-slate-600">{article.keyword}</span>
             </div>
             <button 
              onClick={onAI}
              className="text-[10px] font-black text-indigo-600 bg-white border border-indigo-100 px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
             >
               <i className="fas fa-robot text-[12px]"></i> Escrever c/ IA
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomActionCard: React.FC<{ action: CustomAction, onCycle: () => void, onToggle: (checked: boolean) => void, onAI: () => void, onDelete: () => void }> = ({ action, onCycle, onToggle, onAI, onDelete }) => {
  const isCompleted = action.status === 'completed';
  const isDraft = action.status === 'draft';

  return (
    <div className={`p-6 rounded-3xl border transition-all group relative ${isCompleted ? 'bg-emerald-50 border-emerald-100 opacity-80' : isDraft ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100 hover:border-purple-200 hover:shadow-xl'}`}>
      
      <button 
        onClick={onDelete}
        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-1"
        title="Remover"
      >
        <i className="fas fa-trash-can text-sm"></i>
      </button>

      <div className="flex gap-4 items-start">
        <div className="flex flex-col items-center gap-2 pt-1">
          <Checkbox 
            checked={isCompleted}
            onChange={onToggle}
            title="Concluir atividade"
          />
          <button 
            onClick={onCycle}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-500 text-white shadow-md' : isDraft ? 'bg-amber-400 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}
          >
            <i className={`fas ${isCompleted ? 'fa-check' : isDraft ? 'fa-pen-nib' : 'fa-star'}`}></i>
          </button>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-3 mr-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">{action.type}</span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase border ${getStatusStyles(action.status)}`}>{getStatusLabel(action.status)}</span>
          </div>
          <h4 className={`font-black text-slate-800 leading-tight mb-4 text-[15px] ${isCompleted ? 'line-through text-slate-400' : ''}`}>{action.title}</h4>
          <div className="flex justify-between items-center">
             <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Canal</span>
                <span className="text-[10px] font-black text-slate-600">{action.channel}</span>
             </div>
             <button 
              onClick={onAI}
              className="text-[10px] font-black text-purple-600 bg-white border border-purple-100 px-4 py-2 rounded-xl shadow-sm hover:bg-purple-600 hover:text-white transition-all flex items-center gap-2"
            >
              <i className="fas fa-wand-magic-sparkles text-[12px]"></i> Detalhar c/ IA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StrategyView = () => (
  <div className="animate-fade-in space-y-12">
    <div className="bg-slate-900 rounded-[40px] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent"></div>
      <div className="relative z-10 max-w-2xl">
        <h2 className="text-4xl font-black tracking-tighter mb-6">Máquina de Conteúdo</h2>
        <p className="text-lg text-slate-300 leading-relaxed mb-8">
          A consistência é o que diferencia os escritórios líderes. Siga o fluxo de reciclagem para maximizar cada minuto investido.
        </p>
        <div className="flex gap-4">
          <div className="bg-white/10 border border-white/20 px-6 py-3 rounded-2xl">
            <span className="block text-2xl font-black text-white">1 p/ 6</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-center block">Reciclagem</span>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[
        { step: 1, title: 'Blog (Coração)', desc: 'Artigo técnico para SEO. A base de onde tudo nasce.', icon: 'fa-feather-pointed', color: 'bg-slate-800', badge: 'SEO' },
        { step: 2, title: 'LinkedIn (Profissional)', desc: 'Resumo dos 3 tópicos de maior valor + Insight técnico.', icon: 'fa-linkedin-in', color: 'bg-blue-600', badge: 'B2B' },
        { step: 3, title: 'Instagram (Visual)', desc: 'Carrossel educativo: "3 coisas que você precisa saber sobre...".', icon: 'fa-instagram', color: 'bg-indigo-500', badge: 'Social' },
        { step: 4, title: 'WhatsApp (Status)', desc: 'Pergunta rápida + Link para o artigo. Gera chamadas diretas.', icon: 'fa-whatsapp', color: 'bg-emerald-500', badge: 'Conversão' },
        { step: 5, title: 'Google Maps (Local)', desc: 'Atualização semanal do perfil. Crucial para advogados locais.', icon: 'fa-location-dot', color: 'bg-red-500', badge: 'SEO Local' },
        { step: 6, title: 'Jusbrasil (Autoridade)', desc: 'Republicação integral para ganhar backlink e autoridade.', icon: 'fa-gavel', color: 'bg-amber-500', badge: 'Alcance' },
      ].map(item => (
        <div key={item.step} className="bg-white rounded-[32px] p-8 border border-slate-100 hover:shadow-2xl transition-all relative group overflow-hidden">
          <div className={`absolute top-0 left-0 w-2 h-full ${item.color}`}></div>
          <div className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center text-white shadow-lg ${item.color}`}>
            <i className={`fas ${item.icon}`}></i>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Etapa {item.step}</span>
            <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{item.badge}</span>
          </div>
          <h4 className="text-xl font-black text-slate-800 mb-3">{item.title}</h4>
          <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const ReportView = ({ plan, customs }: any) => {
  const allActions = useMemo(() => {
    let list: any[] = [];
    plan.forEach((m: any) => {
      m.articles.forEach((a: any) => list.push({ 
        ...a, 
        month: m.month, 
        type: 'Artigo',
        categoryOrChannel: a.category 
      }));
      customs.filter((ca: any) => ca.monthId === m.id).forEach((ca: any) => list.push({ 
        ...ca, 
        month: m.month,
        categoryOrChannel: ca.channel 
      }));
    });
    return list;
  }, [plan, customs]);

  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
      <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h2 className="text-2xl font-black text-slate-900">Métricas de Execução</h2>
        <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-black text-emerald-600">
                FEITO: {allActions.filter(a => a.status === 'completed').length}
            </div>
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-black text-slate-400">
                PENDENTE: {allActions.filter(a => a.status !== 'completed').length}
            </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <th className="px-10 py-6">Mês</th>
              <th className="px-6 py-6">Local / Tipo</th>
              <th className="px-6 py-6">Iniciativa</th>
              <th className="px-10 py-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {allActions.length === 0 ? (
              <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold italic">Nenhuma ação cadastrada.</td></tr>
            ) : (
              allActions.map(action => (
                <tr key={action.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-10 py-5 text-sm font-bold text-slate-600">{action.month}</td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
                      {action.categoryOrChannel}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm font-black text-slate-800">{action.title}</td>
                  <td className="px-10 py-5 text-right">
                    <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border ${getStatusStyles(action.status)}`}>
                      {getStatusLabel(action.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AIOutputModal = ({ title, content, loading, onClose }: any) => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity" onClick={onClose}></div>
        <div className={`bg-white rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col animate-scale-up transition-all duration-500 ${isFocusMode ? 'w-full h-full max-w-none max-h-none rounded-none' : 'w-full max-w-4xl max-h-[85vh]'}`}>
        
        <div className="bg-slate-900 p-8 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <i className="fas fa-robot"></i>
            </div>
            <div>
                <h3 className="text-xl font-black tracking-tight">{title}</h3>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">IA Estratégica Gemini Pro</p>
            </div>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    title="Modo Foco"
                >
                    <i className={`fas ${isFocusMode ? 'fa-compress' : 'fa-expand'}`}></i>
                </button>
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">
                    <i className="fas fa-times text-xl"></i>
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50">
            {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-slate-600 font-black animate-pulse uppercase tracking-widest text-xs">A IA está escrevendo para você...</p>
            </div>
            ) : (
            <div className={`prose prose-slate max-w-none transition-all duration-500 ${isFocusMode ? 'max-w-3xl mx-auto py-12' : ''}`} dangerouslySetInnerHTML={{ __html: marked.parse(content) }}></div>
            )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-4 shrink-0">
            <button onClick={onClose} className="px-8 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">Fechar</button>
            <button 
            onClick={() => {
                navigator.clipboard.writeText(content);
                alert('Pronto! Conteúdo copiado.');
            }}
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-xl hover:bg-slate-800 transition-all active:scale-95"
            >
            <i className="fas fa-copy"></i> Copiar Conteúdo
            </button>
        </div>
        </div>
    </div>
  );
};

const AddActionModal = ({ onClose, onAdd, months, initialMonthId }: any) => {
  const [formData, setFormData] = useState({ title: '', type: 'Post', channel: 'Instagram', monthId: initialMonthId });
  const [isSuggesting, setIsSuggesting] = useState(false);

  const suggestIdea = async () => {
    setIsSuggesting(true);
    try {
      const month = months.find((m: any) => m.id === Number(formData.monthId));
      const focus = month ? month.focus : '';
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Sugira um título criativo e profissional para uma postagem de marketing jurídico. Mês focado em: ${focus}. Tipo: ${formData.type}. Canal: ${formData.channel}. Responda apenas com o título da ação, sem aspas.`,
      });
      setFormData(prev => ({ ...prev, title: response.text?.trim() || '' }));
    } catch (error) {
      console.error("Error suggesting idea", error);
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl relative overflow-hidden animate-scale-up">
        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
          <h3 className="font-black tracking-tight">Nova Ação Mensal</h3>
          <button onClick={onClose} className="hover:text-slate-400 transition-colors"><i className="fas fa-times"></i></button>
        </div>
        <div className="p-8 space-y-6">
          <div>
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mês Alvo</label>
             <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500 transition-all"
                value={formData.monthId}
                onChange={e => setFormData({ ...formData, monthId: Number(e.target.value) })}
              >
                {months.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.month}</option>
                ))}
              </select>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Título do Conteúdo</label>
              <button 
                onClick={suggestIdea}
                disabled={isSuggesting}
                className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 uppercase tracking-widest transition-all bg-indigo-50 px-2 py-1 rounded-md"
              >
                <i className={`fas fa-magic ${isSuggesting ? 'animate-spin' : ''}`}></i>
                {isSuggesting ? 'Pensando...' : 'Pedir Ideia'}
              </button>
            </div>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
              placeholder="Ex: Como lidar com herança..."
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Formato</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none appearance-none cursor-pointer"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option>Artigo</option><option>Post</option><option>Vídeo</option><option>Email</option><option>Newsletter</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Rede/Canal</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none appearance-none cursor-pointer"
                value={formData.channel}
                onChange={e => setFormData({ ...formData, channel: e.target.value })}
              >
                <option>Instagram</option><option>LinkedIn</option><option>WhatsApp</option><option>Blog</option><option>Jusbrasil</option>
              </select>
            </div>
          </div>
          <button 
            onClick={() => onAdd(formData)}
            className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl transition-all transform hover:-translate-y-1 active:scale-95"
          >
            ADICIONAR AO PLANO
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Render ---
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
