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
    <div className="flex h-screen overflow-hidden bg-stone-50 font-sans text-stone-900">
      {/* Sidebar Navigation */}
      <aside className="hidden w-72 flex-col border-r border-stone-200 bg-white md:flex">
        <div className="border-b border-stone-100 p-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors">
            <ChevronLeft size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Назад к проектам</span>
          </Link>
          <h2 className="mt-4 text-lg font-bold truncate">{project.name}</h2>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 rounded-full bg-stone-100 overflow-hidden">
              <div 
                className="h-full bg-stone-900 transition-all duration-500" 
                style={{ width: `${(project.currentStep / STEPS_COUNT) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-stone-400">{project.currentStep}/{STEPS_COUNT}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {STEPS_LABELS.map((label, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < project.currentStep;
            const isActive = stepNum === project.currentStep;
            
            return (
              <div 
                key={label}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  isActive ? "bg-stone-900 text-stone-50 shadow-md" : 
                  isCompleted ? "text-stone-900 hover:bg-stone-50" : "text-stone-400 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                  isActive ? "bg-white text-stone-900" : 
                  isCompleted ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-400"
                )}>
                  {isCompleted ? <CheckCircle2 size={12} /> : stepNum}
                </div>
                <span className="flex-1 truncate font-medium">{label}</span>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-8 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold uppercase tracking-widest text-stone-400">Этап {project.currentStep}</h1>
            <h2 className="text-lg font-semibold">{STEPS_LABELS[project.currentStep - 1]}</h2>
          </div>
          <div className="flex items-center gap-3">
            {saving && <span className="text-xs text-stone-400 animate-pulse">Сохранение...</span>}
            <button 
              onClick={() => saveStep(currentStep.data)}
              className="flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              <Save size={16} />
              Сохранить
            </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12">
          <div className="mx-auto max-w-3xl space-y-12">
            {/* Step specific inputs */}
            <StepContent 
              stepNumber={project.currentStep} 
              data={currentStep.data} 
              onChange={(newData) => setCurrentStep({ ...currentStep, data: { ...currentStep.data, ...newData } })}
            />

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-12 border-t border-stone-100">
              <button 
                onClick={prevStep}
                disabled={project.currentStep === 1}
                className="flex items-center gap-2 text-sm font-semibold text-stone-400 hover:text-stone-900 disabled:opacity-0 transition-colors"
              >
                <ChevronLeft size={18} />
                Предыдущий шаг
              </button>
              <button 
                onClick={nextStep}
                disabled={project.currentStep === STEPS_COUNT}
                className="flex items-center gap-2 rounded-full bg-stone-900 px-8 py-3 text-sm font-semibold text-stone-50 hover:bg-stone-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {project.currentStep === STEPS_COUNT ? 'Завершить' : 'Следующий шаг'}
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* AI Assistant Panel */}
      <aside className="w-96 flex flex-col border-l border-stone-200 bg-stone-50">
        <div className="border-b border-stone-200 bg-white p-6">
          <div className="flex items-center gap-2 text-stone-900">
            <Sparkles size={18} className="text-stone-400" />
            <h3 className="font-bold tracking-tight uppercase text-xs">AI Ассистент</h3>
          </div>
          <p className="mt-1 text-[10px] text-stone-400">Ваш персональный стратег и редактор</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Welcome Message */}
          <div className="rounded-2xl bg-white p-4 text-sm leading-relaxed text-stone-600 shadow-sm border border-stone-100">
            {project.currentStep === 1 && !aiResponse ? (
              "Добро пожаловать! Давайте начнем с распаковки вашего опыта. Расскажите подробнее о ваших методах работы и результатах клиентов. Я помогу выделить самое важное."
            ) : aiResponse ? (
              <div className="whitespace-pre-wrap">{aiResponse}</div>
            ) : (
              "Я готов помочь проанализировать ваши ответы на этом этапе. Напишите, если хотите углубить тему или получить варианты гипотез."
            )}
          </div>
          
          {aiLoading && (
            <div className="flex justify-center">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-300" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-300 [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-300 [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-stone-200">
          <div className="relative">
            <textarea 
              rows={2}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Спросить или предложить..."
              className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-3 pr-12 text-sm outline-none transition-all focus:border-stone-400 focus:bg-white"
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
              className="absolute right-2 bottom-2 p-2 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button 
              onClick={() => callAI("Проверь мои ответы на этом этапе")}
              className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[10px] font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            >
              Проверить гипотезу
            </button>
            <button 
              onClick={() => callAI("Предложи 3 варианта на основе моих данных")}
              className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[10px] font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            >
              Предложить варианты
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

  const containerClass = "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700";
  const labelClass = "text-sm font-medium text-stone-500 block mb-2";
  const textareaClass = "w-full min-h-[140px] rounded-xl border border-stone-200 bg-white p-4 text-base outline-none transition-all focus:border-stone-900 focus:ring-1 focus:ring-stone-900";
  const inputClass = "w-full rounded-xl border border-stone-200 bg-white p-4 text-base outline-none transition-all focus:border-stone-900 focus:ring-1 focus:ring-stone-900";

  switch(stepNumber) {
    case 1:
      return (
        <div className={containerClass}>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tight text-stone-900">Распаковка личности и экспертности</h3>
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
              <label className={labelClass}>Ваш жизненный путь и трансформации (какой кризис вы преодолели сами?)</label>
              <textarea 
                value={data.personalPath || ''}
                onChange={(e) => handleChange('personalPath', e.target.value)}
                className={textareaClass}
                placeholder="Расскажите о своей личной истории изменений..."
              />
            </div>
            <div>
              <label className={labelClass}>Результаты ваших клиентов (какие измеримые изменения происходят?)</label>
              <textarea 
                value={data.results || ''}
                onChange={(e) => handleChange('results', e.target.value)}
                className={textareaClass}
                placeholder="Опишите 2-3 реальных примера помощи..."
              />
            </div>
          </div>
        </div>
      );
    case 2:
      return (
        <div className={containerClass}>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tight text-stone-900">Выбор рабочей темы</h3>
            <p className="text-stone-500">На основе вашего опыта выберите одну сфокусированную тему.</p>
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
      );
    case 3:
      return (
        <div className={containerClass}>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tight text-stone-900">Анализ целевой аудитории</h3>
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
              <label className={labelClass}>Почему они готовы платить за решение проблемы сейчас?</label>
              <textarea 
                value={data.willingnessToPay || ''}
                onChange={(e) => handleChange('willingnessToPay', e.target.value)}
                className={textareaClass}
                placeholder="Опишите срочность и ценность результата..."
              />
            </div>
          </div>
        </div>
      );
    case 4:
      return (
        <div className={containerClass}>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tight text-stone-900">Выявление боли и ожидания</h3>
            <div>
              <label className={labelClass}>Внешняя проблема (что человек говорит другим?)</label>
              <input 
                type="text"
                value={data.externalProblem || ''}
                onChange={(e) => handleChange('externalProblem', e.target.value)}
                className={inputClass}
                placeholder="Не могу найти общий язык с мужем..."
              />
            </div>
            <div>
              <label className={labelClass}>Внутренняя боль (что человек чувствует наедине с собой?)</label>
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
      );
    case 5:
      return (
        <div className={containerClass}>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tight text-stone-900">История клиента</h3>
            <p className="text-stone-500">Создайте образ реального человека, в котором ваша аудитория узнает себя.</p>
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
      );
    case 6:
      return (
        <div className={containerClass}>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tight text-stone-900">История автора</h3>
            <p className="text-stone-500">Свяжите свой опыт с болью клиента. Почему вы понимаете его как никто другой?</p>
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
      );
    case 7:
      return (
        <div className={containerClass}>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tight text-stone-900">Создание оффера</h3>
            <p className="text-stone-500">Финальная формула: Боль → Усиление → Надежда.</p>
            <div>
              <label className={labelClass}>Ваш продающий оффер</label>
              <textarea 
                value={data.offer || ''}
                onChange={(e) => handleChange('offer', e.target.value)}
                className="w-full min-h-[180px] rounded-xl border-2 border-stone-900 bg-white p-6 text-xl font-medium outline-none shadow-lg"
                placeholder="Напишите итоговый вариант оффера..."
              />
            </div>
          </div>
        </div>
      );
    case 8:
      return (
        <div className={containerClass}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-bold tracking-tight text-stone-900 font-serif italic">Ваш готовый лонгрид</h3>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(data.longread || '');
                  alert('Скопировано!');
                }}
                className="text-xs font-bold uppercase tracking-wider text-stone-400 hover:text-stone-900"
              >
                Копировать текст
              </button>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-12 shadow-xl prose prose-stone max-w-none">
              <textarea 
                value={data.longread || ''}
                onChange={(e) => handleChange('longread', e.target.value)}
                className="w-full min-h-[600px] border-none p-0 text-lg leading-relaxed outline-none focus:ring-0 font-serif"
                placeholder="Здесь будет ваш итоговый продающий текст..."
              />
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div className="py-20 text-center space-y-4">
          <div className="h-16 w-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
            <Layout size={32} />
          </div>
          <h3 className="text-lg font-medium">Этот этап находится в разработке</h3>
        </div>
      );
  }
}
