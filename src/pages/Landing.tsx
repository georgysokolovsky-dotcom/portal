import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { User } from '../types';
import { ArrowRight, Sparkles, BookOpen, Target, FileText } from 'lucide-react';

export default function Landing({ user }: { user: User | null }) {
  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-900 text-stone-50">
            <Sparkles size={20} />
          </div>
          <span className="text-xl font-semibold tracking-tight">Heorhii Platform</span>
        </div>
        <nav>
          {user ? (
            <Link to="/dashboard" className="flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800">
              Личный кабинет
              <ArrowRight size={16} />
            </Link>
          ) : (
            <Link to="/auth" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800">
              Войти
            </Link>
          )}
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-5xl px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold tracking-tight text-stone-900 sm:text-6xl">
            Путь от экспертности <br /> 
            <span className="text-stone-400 font-serif italic">к востребованному офферу</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-stone-600">
            Закрытая платформа для гипнотерапевтов, коучей и мастеров помогающих профессий. 
            Раскройте свою уникальность и создайте продающий лонгрид с помощью AI-ассистента.
          </p>
          <div className="mt-12 flex items-center justify-center gap-4">
            <Link to={user ? "/dashboard" : "/auth"} className="flex h-12 items-center gap-2 rounded-full bg-stone-900 px-8 text-base font-medium text-stone-50 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Начать обучение
              <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>

        {/* Features */}
        <section className="mt-32 grid gap-12 text-left md:grid-cols-3">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-900">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-semibold">Пошаговый маршрут</h3>
            <p className="text-stone-600">
              8 этапов от распаковки личности до финального лонгрида. Структурный подход Linear и ясность Notion.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-900">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-semibold">AI-стратег</h3>
            <p className="text-stone-600">
              Персональный редактор, который задает глубокие вопросы, находит противоречия и предлагает гипотезы.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-900">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-semibold">Готовый результат</h3>
            <p className="text-stone-600">
              На выходе вы получаете полноценный продающий текст для сайта, который попадает в боль клиента.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-stone-200 py-10 text-center">
        <p className="text-sm text-stone-400">© 2026 Heorhii Platform. Среда для вдумчивого роста.</p>
      </footer>
    </div>
  );
}
