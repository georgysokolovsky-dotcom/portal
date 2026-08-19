import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { User, Project, Step, STEPS_LABELS, STEPS_COUNT } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare,
  History,
  Layout,
  Save
} from 'lucide-react';
import { cn } from '../lib/utils';
import { SYSTEM_PROMPT, getStepPrompt } from '../lib/ai-prompts';

export default function StepWizard({ user }: { user: User }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [userInput, setUserInput] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (!projectDoc.exists()) {
        navigate('/dashboard');
        return;
      }
      
      const projectData = { id: projectDoc.id, ...projectDoc.data() } as Project;
      setProject(projectData);

      // Fetch or create step data
      const stepId = `${projectId}_${projectData.currentStep}`;
      const stepDoc = await getDoc(doc(db, 'projects', projectId, 'steps', stepId));
      
      if (stepDoc.exists()) {
        setCurrentStep(stepDoc.data() as Step);
      } else {
        const newStep: Step = {
          projectId,
          stepNumber: projectData.currentStep,
          data: {},
          updatedAt: Date.now()
        };
        await setDoc(doc(db, 'projects', projectId, 'steps', stepId), newStep);
        setCurrentStep(newStep);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [projectId, navigate]);

  const saveStep = async (data: any) => {
    if (!project || !currentStep) return;
    setSaving(true);
    try {
      const stepId = `${project.id}_${project.currentStep}`;
      const updatedStep = { ...currentStep, data, updatedAt: Date.now() };
      await updateDoc(doc(db, 'projects', project.id, 'steps', stepId), updatedStep);
      setCurrentStep(updatedStep);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const nextStep = async () => {
    if (!project) return;
    if (project.currentStep < STEPS_COUNT) {
      const nextStepNum = project.currentStep + 1;
      await updateDoc(doc(db, 'projects', project.id), {
        currentStep: nextStepNum,
        updatedAt: Date.now()
      });
      window.location.reload(); // Simple way to re-trigger data fetch
    }
  };

  const prevStep = async () => {
    if (!project) return;
    if (project.currentStep > 1) {
      const prevStepNum = project.currentStep - 1;
      await updateDoc(doc(db, 'projects', project.id), {
        currentStep: prevStepNum,
        updatedAt: Date.now()
      });
      window.location.reload();
    }
  };

  const callAI = async (message: string) => {
    if (!message.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: {
            project,
            currentStepData: currentStep?.data,
            stepNumber: project?.currentStep
          },
          systemPrompt: SYSTEM_PROMPT
        })
      });
      const data = await response.json();
      setAiResponse(data.text);
    } catch (err) {
      console.error("AI Error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading || !project || !currentStep) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-800" />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-stone-50 font-sans text-stone-900">
      {/* Background Accents */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/5 blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-violet-500/5 blur-[100px]" />

      {/* Sidebar Navigation */}
      <aside className="relative z-10 hidden w-72 flex-col border-r border-stone-200 bg-white/80 backdrop-blur-md md:flex">
        <div className="border-b border-stone-100 p-6">
          <Link to="/dashboard" className="group flex items-center gap-2 text-stone-400 hover:text-indigo-600 transition-colors">
            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Проекты</span>
          </Link>
          <h2 className="mt-4 text-xl font-bold truncate tracking-tight">{project.name}</h2>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400">
              <span>Прогресс</span>
              <span className="text-indigo-600">{Math.round((project.currentStep / STEPS_COUNT) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700" 
                style={{ width: `${(project.currentStep / STEPS_COUNT) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {STEPS_LABELS.map((label, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < project.currentStep;
            const isActive = stepNum === project.currentStep;
            
            return (
              <div 
                key={label}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-300",
                  isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : 
                  isCompleted ? "text-stone-900 hover:bg-indigo-50" : "text-stone-400 opacity-60"
                )}
              >
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold transition-colors",
                  isActive ? "bg-white/20 text-white" : 
                  isCompleted ? "bg-indigo-100 text-indigo-600" : "bg-stone-100 text-stone-400"
                )}>
                  {isCompleted ? <CheckCircle2 size={14} /> : stepNum}
                </div>
                <span className={cn("flex-1 truncate font-bold", isActive ? "text-white" : "text-inherit")}>{label}</span>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-stone-200 bg-white/50 px-8 py-5 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500">Этап {project.currentStep}</span>
              <h2 className="text-xl font-extrabold tracking-tight text-stone-900">{STEPS_LABELS[project.currentStep - 1]}</h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {saving && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                Сохранение
              </div>
            )}
            <button 
              onClick={() => saveStep(currentStep.data)}
              className="flex items-center gap-2 rounded-xl border-2 border-stone-100 bg-white px-5 py-2.5 text-sm font-bold text-stone-700 shadow-sm transition-all hover:border-indigo-100 hover:bg-stone-50 active:scale-95"
            >
              <Save size={18} className="text-indigo-500" />
              Сохранить
            </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8 md:p-16">
          <div className="mx-auto max-w-3xl">
            <StepContent 
              stepNumber={project.currentStep} 
              data={currentStep.data} 
              onChange={(newData) => setCurrentStep({ ...currentStep, data: { ...currentStep.data, ...newData } })}
            />

            {/* Navigation Buttons */}
            <div className="mt-20 flex items-center justify-between border-t border-stone-100 pt-10">
              <button 
                onClick={prevStep}
                disabled={project.currentStep === 1}
                className="group flex items-center gap-2 text-sm font-bold text-stone-400 transition-all hover:text-stone-900 disabled:opacity-0"
              >
                <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                Предыдущий шаг
              </button>
              <button 
                onClick={nextStep}
                disabled={project.currentStep === STEPS_COUNT}
                className="flex items-center gap-2 rounded-full bg-indigo-600 px-10 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 hover:scale-[1.05] active:scale-[0.95]"
              >
                {project.currentStep === STEPS_COUNT ? 'Завершить' : 'Следующий шаг'}
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* AI Assistant Panel */}
      <aside className="relative z-10 w-[400px] flex flex-col border-l border-stone-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight uppercase">AI Стратег</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-100/70">Персональный ментор</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-stone-50/50">
          {/* Welcome Message */}
          <div className="group relative rounded-3xl bg-white p-6 text-base leading-relaxed text-stone-700 shadow-xl shadow-indigo-500/5 border border-white transition-all hover:border-indigo-100">
            <div className="absolute -left-2 top-6 h-4 w-4 rotate-45 border-l border-b border-white bg-white group-hover:border-indigo-100 transition-all" />
            {project.currentStep === 1 && !aiResponse ? (
              "Добро пожаловать! Давайте начнем с распаковки вашего опыта. Расскажите подробнее о ваших методах работы и результатах клиентов. Я помогу выделить самое важное."
            ) : aiResponse ? (
              <div className="whitespace-pre-wrap font-medium">{aiResponse}</div>
            ) : (
              "Я готов помочь проанализировать ваши ответы на этом этапе. Напишите, если хотите углубить тему или получить варианты гипотез."
            )}
          </div>
          
          {aiLoading && (
            <div className="flex justify-center p-4">
              <div className="flex gap-1.5 items-center bg-white px-4 py-2 rounded-full shadow-sm border border-stone-100">
                <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-600" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-600 [animation-delay:0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-600 [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-6 bg-white border-t border-stone-100">
          <div className="relative">
            <textarea 
              rows={3}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Спросите AI стратега..."
              className="w-full resize-none rounded-[1.5rem] border-2 border-stone-100 bg-stone-50 p-5 pr-14 text-sm font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  callAI(userInput);
                  setUserInput('');
                }
              }}
            />
            <button 
              onClick={() => {
                callAI(userInput);
                setUserInput('');
              }}
              className="absolute right-3 bottom-3 p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-90"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button 
              onClick={() => callAI("Проверь мои ответы на этом этапе")}
              className="rounded-full bg-indigo-50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 transition-all hover:bg-indigo-100 active:scale-95"
            >
              Анализ ответов
            </button>
            <button 
              onClick={() => callAI("Предложи 3 варианта на основе моих данных")}
              className="rounded-full bg-violet-50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-violet-600 transition-all hover:bg-violet-100 active:scale-95"
            >
              Новые гипотезы
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function StepContent({ stepNumber, data, onChange }: { stepNumber: number, data: any, onChange: (data: any) => void }) {
  const handleChange = (key: string, value: string) => {
    onChange({ [key]: value });
  };

  const containerClass = "space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out";
  const labelClass = "text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-3";
  const textareaClass = "w-full min-h-[160px] rounded-[1.5rem] border-2 border-stone-100 bg-white p-6 text-lg font-medium outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 placeholder:text-stone-300";
  const inputClass = "w-full rounded-2xl border-2 border-stone-100 bg-white p-5 text-lg font-medium outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 placeholder:text-stone-300";

  switch(stepNumber) {
    case 1:
      return (
        <div className={containerClass}>
          <div className="space-y-10">
            <h3 className="text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">Распаковка личности <br/><span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent italic font-serif">и экспертности</span></h3>
            <div className="space-y-8">
              <div>
                <label className={labelClass}>Ваши методы и инструменты (что вы делаете?)</label>
                <textarea 
                  value={data.methods || ''}
                  onChange={(e) => handleChange('methods', e.target.value)}
                  className={textareaClass}
                  placeholder="Например: регрессионный гипноз, коучинг, работа с МАК-картами..."
                />
              </div>
              <div>
                <label className={labelClass}>Ваш жизненный путь (кризис и преодоление)</label>
                <textarea 
                  value={data.personalPath || ''}
                  onChange={(e) => handleChange('personalPath', e.target.value)}
                  className={textareaClass}
                  placeholder="Расскажите о своей личной истории изменений..."
                />
              </div>
              <div>
                <label className={labelClass}>Результаты ваших клиентов (измеримые изменения)</label>
                <textarea 
                  value={data.results || ''}
                  onChange={(e) => handleChange('results', e.target.value)}
                  className={textareaClass}
                  placeholder="Опишите 2-3 реальных примера помощи..."
                />
              </div>
            </div>
          </div>
        </div>
      );
    case 2:
      return (
        <div className={containerClass}>
          <div className="space-y-10">
            <h3 className="text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">Выбор <br/><span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent italic font-serif">рабочей темы</span></h3>
            <div className="space-y-8">
              <div>
                <label className={labelClass}>Основная тема оффера</label>
                <input 
                  type="text"
                  value={data.topic || ''}
                  onChange={(e) => handleChange('topic', e.target.value)}
                  className={inputClass}
                  placeholder="Например: Выход из созависимых отношений через работу с самоценностью"
                />
              </div>
              <div>
                <label className={labelClass}>Почему эта тема актуальна сейчас?</label>
                <textarea 
                  value={data.topicReason || ''}
                  onChange={(e) => handleChange('topicReason', e.target.value)}
                  className={textareaClass}
                  placeholder="Объясните ваш выбор..."
                />
              </div>
            </div>
          </div>
        </div>
      );
    case 3:
      return (
        <div className={containerClass}>
          <div className="space-y-10">
            <h3 className="text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">Анализ <br/><span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent italic font-serif">целевой аудитории</span></h3>
            <div className="space-y-8">
              <div>
                <label className={labelClass}>Кто этот человек? (ситуация, возраст, контекст)</label>
                <textarea 
                  value={data.audience || ''}
                  onChange={(e) => handleChange('audience', e.target.value)}
                  className={textareaClass}
                  placeholder="Например: Женщины 30-40 лет, которые недавно развелись и чувствуют себя потерянными..."
                />
              </div>
              <div>
                <label className={labelClass}>Ценность результата (почему готовы платить?)</label>
                <textarea 
                  value={data.willingnessToPay || ''}
                  onChange={(e) => handleChange('willingnessToPay', e.target.value)}
                  className={textareaClass}
                  placeholder="Опишите срочность и ценность результата..."
                />
              </div>
            </div>
          </div>
        </div>
      );
    case 4:
      return (
        <div className={containerClass}>
          <div className="space-y-10">
            <h3 className="text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">Выявление <br/><span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent italic font-serif">боли и ожидания</span></h3>
            <div className="space-y-8">
              <div>
                <label className={labelClass}>Внешняя проблема (что они говорят?)</label>
                <input 
                  type="text"
                  value={data.externalProblem || ''}
                  onChange={(e) => handleChange('externalProblem', e.target.value)}
                  className={inputClass}
                  placeholder="Не могу найти общий язык с мужем..."
                />
              </div>
              <div>
                <label className={labelClass}>Внутренняя боль (скрытые чувства)</label>
                <textarea 
                  value={data.internalPain || ''}
                  onChange={(e) => handleChange('internalPain', e.target.value)}
                  className={textareaClass}
                  placeholder="Одиночество, страх будущего, ощущение собственной ненужности..."
                />
              </div>
              <div>
                <label className={labelClass}>Желаемый результат (образ надежды)</label>
                <input 
                  type="text"
                  value={data.desiredResult || ''}
                  onChange={(e) => handleChange('desiredResult', e.target.value)}
                  className={inputClass}
                  placeholder="Чувство опоры на себя и радость от жизни..."
                />
              </div>
            </div>
          </div>
        </div>
      );
    case 5:
      return (
        <div className={containerClass}>
          <div className="space-y-10">
            <h3 className="text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">История <br/><span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent italic font-serif">клиента</span></h3>
            <div className="space-y-8">
              <div>
                <label className={labelClass}>Ситуация "До" (точка А)</label>
                <textarea 
                  value={data.storyBefore || ''}
                  onChange={(e) => handleChange('storyBefore', e.target.value)}
                  className={textareaClass}
                  placeholder="Опишите будни, мысли и тщетные попытки клиента решить проблему..."
                />
              </div>
              <div>
                <label className={labelClass}>Ситуация "После" (точка Б)</label>
                <textarea 
                  value={data.storyAfter || ''}
                  onChange={(e) => handleChange('storyAfter', e.target.value)}
                  className={textareaClass}
                  placeholder="Что изменилось в жизни и состоянии после работы с вами?"
                />
              </div>
            </div>
          </div>
        </div>
      );
    case 6:
      return (
        <div className={containerClass}>
          <div className="space-y-10">
            <h3 className="text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">История <br/><span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent italic font-serif">автора</span></h3>
            <div className="space-y-8">
              <div>
                <label className={labelClass}>Ваша личная связь с этой проблемой</label>
                <textarea 
                  value={data.authorStory || ''}
                  onChange={(e) => handleChange('authorStory', e.target.value)}
                  className={textareaClass}
                  placeholder="Расскажите, как вы сами проходили этот путь..."
                />
              </div>
            </div>
          </div>
        </div>
      );
    case 7:
      return (
        <div className={containerClass}>
          <div className="space-y-10">
            <h3 className="text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">Создание <br/><span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent italic font-serif">оффера</span></h3>
            <div className="space-y-8">
              <div>
                <label className={labelClass}>Ваш продающий оффер</label>
                <textarea 
                  value={data.offer || ''}
                  onChange={(e) => handleChange('offer', e.target.value)}
                  className="w-full min-h-[220px] rounded-[2rem] border-4 border-indigo-600/10 bg-white p-8 text-2xl font-bold leading-relaxed text-indigo-900 outline-none shadow-2xl transition-all focus:border-indigo-600 focus:ring-8 focus:ring-indigo-600/5 placeholder:text-stone-200"
                  placeholder="Напишите итоговый вариант оффера..."
                />
              </div>
            </div>
          </div>
        </div>
      );
    case 8:
      return (
        <div className={containerClass}>
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">Ваш готовый <br/><span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent italic font-serif">лонгрид</span></h3>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(data.longread || '');
                  alert('Скопировано!');
                }}
                className="rounded-full bg-indigo-50 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-indigo-600 transition-all hover:bg-indigo-100"
              >
                Копировать текст
              </button>
            </div>
            <div className="group relative rounded-[2.5rem] border-2 border-indigo-100 bg-white p-12 shadow-2xl transition-all hover:shadow-indigo-500/10">
              <textarea 
                value={data.longread || ''}
                onChange={(e) => handleChange('longread', e.target.value)}
                className="w-full min-h-[700px] border-none p-0 text-xl leading-relaxed text-stone-800 outline-none focus:ring-0 font-serif"
                placeholder="Здесь будет ваш итоговый продающий текст..."
              />
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div className="py-32 text-center space-y-6">
          <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-400">
            <Layout size={40} />
          </div>
          <h3 className="text-2xl font-bold text-stone-900">Этот этап в разработке</h3>
        </div>
      );
  }
}
