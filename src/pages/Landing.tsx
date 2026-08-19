import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { User } from '../types';
import { ArrowRight, Sparkles, BookOpen, Target, FileText } from 'lucide-react';

export default function Landing({ user }: { user: User | null }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-stone-50 font-sans text-stone-900">
      {/* Background Mesh Gradient */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-violet-500/10 blur-[120px]" />
      <div className="absolute -bottom-24 left-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <Sparkles size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-stone-900">Heorhii<span className="text-indigo-600">.</span></span>
        </div>
        <nav>
          {user ? (
            <Link to="/dashboard" className="flex items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-stone-50 transition-all hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-100">
              Личный кабинет
              <ArrowRight size={16} />
            </Link>
          ) : (
            <Link to="/auth" className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]">
              Войти
            </Link>
          )}
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="mb-6 inline-flex items-center rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-bold text-indigo-600">
            <Sparkles size={14} className="mr-2" />
            Инновационная платформа для экспертов
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight text-stone-900 sm:text-7xl">
            Путь от экспертности <br /> 
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent font-serif italic">к востребованному офферу</span>
          </h1>
          <p className="mx-auto mt-10 max-w-2xl text-xl leading-relaxed text-stone-600">
            Закрытая платформа для гипнотерапевтов, коучей и мастеров помогающих профессий. 
            Раскройте свою уникальность и создайте продающий лонгрид с помощью AI-ассистента.
          </p>
          <div className="mt-14 flex items-center justify-center gap-6">
            <Link to={user ? "/dashboard" : "/auth"} className="flex h-14 items-center gap-2 rounded-full bg-indigo-600 px-10 text-lg font-bold text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 hover:scale-[1.05] active:scale-[0.95]">
              Начать обучение
              <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>

        {/* Features */}
        <section className="mt-40 grid gap-12 text-left md:grid-cols-3">
          <div className="group space-y-6 rounded-3xl border border-white bg-white/40 p-8 backdrop-blur-md transition-all hover:border-indigo-100 hover:bg-white/80 hover:shadow-xl hover:shadow-indigo-500/5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
              <BookOpen size={28} />
            </div>
            <h3 className="text-2xl font-bold">Пошаговый маршрут</h3>
            <p className="text-lg leading-relaxed text-stone-600">
              8 этапов от распаковки личности до финального лонгрида. Структурный подход Linear и ясность Notion.
            </p>
          </div>
          <div className="group space-y-6 rounded-3xl border border-white bg-white/40 p-8 backdrop-blur-md transition-all hover:border-indigo-100 hover:bg-white/80 hover:shadow-xl hover:shadow-indigo-500/5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-100">
              <Sparkles size={28} />
            </div>
            <h3 className="text-2xl font-bold">AI-стратег</h3>
            <p className="text-lg leading-relaxed text-stone-600">
              Персональный редактор, который задает глубокие вопросы, находит противоречия и предлагает гипотезы.
            </p>
          </div>
          <div className="group space-y-6 rounded-3xl border border-white bg-white/40 p-8 backdrop-blur-md transition-all hover:border-indigo-100 hover:bg-white/80 hover:shadow-xl hover:shadow-indigo-500/5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
              <FileText size={28} />
            </div>
            <h3 className="text-2xl font-bold">Готовый результат</h3>
            <p className="text-lg leading-relaxed text-stone-600">
              На выходе вы получаете полноценный продающий текст для сайта, который попадает в боль клиента.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-20 border-t border-stone-200 py-12 text-center">
        <p className="text-sm font-medium text-stone-400">© 2026 Heorhii Platform. Среда для вдумчивого роста.</p>
      </footer>
    </div>
  );
}
