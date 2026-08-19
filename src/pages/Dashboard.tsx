import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { User, Project, STEPS_LABELS } from '../types';
import { motion } from 'motion/react';
import { Plus, Folder, Calendar, Clock, ArrowRight, LogOut, ChevronRight, Sparkles, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn, formatDate } from '../lib/utils';

export default function Dashboard({ user }: { user: User }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const projectList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectList);
      setLoading(false);
    };

    fetchProjects();
  }, [user.uid]);

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const docRef = await addDoc(collection(db, 'projects'), {
      userId: user.uid,
      name: newProjectName,
      status: 'new',
      currentStep: 1,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    navigate(`/project/${docRef.id}`);
  };

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-stone-50 font-sans text-stone-900">
      {/* Background Accents */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/5 blur-[100px]" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-500/5 blur-[100px]" />

      {/* Sidebar-like layout */}
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-6 py-12 md:flex-row">
        <aside className="w-full space-y-8 md:w-64">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-100">
              <Sparkles size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">Heorhii<span className="text-indigo-600">.</span></h1>
          </div>

          <nav className="space-y-1">
            <button className="flex w-full items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-600 transition-all hover:bg-indigo-100">
              <Folder size={18} />
              Мои проекты
            </button>
            {/* Add more nav items if needed */}
          </nav>

          <div className="pt-8 border-t border-stone-200">
            <div className="px-4 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Студент</p>
              <p className="mt-1 text-sm font-bold text-stone-900">{user.name}</p>
              <p className="text-xs font-medium text-stone-500">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-500 transition-all hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
              Выйти
            </button>
          </div>
        </aside>

        <main className="flex-1 mt-12 md:mt-0 md:pl-16">
          <header className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight">Мои проекты</h2>
              <p className="mt-2 text-lg font-medium text-stone-500">Управляйте вашим путем развития</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={18} />
              Новый проект
            </button>
          </header>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map(i => (
                <div key={i} className="h-48 animate-pulse rounded-3xl bg-stone-200" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-stone-200 bg-white/50 py-24 text-center backdrop-blur-sm">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-400">
                <Folder size={40} />
              </div>
              <h3 className="text-xl font-bold text-stone-900">Проектов пока нет</h3>
              <p className="mt-3 max-w-xs text-stone-500 font-medium">
                Создайте свой первый проект, чтобы начать распаковку экспертности.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ y: -6 }}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-white bg-white/70 p-8 backdrop-blur-md transition-all hover:border-indigo-100 hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/10"
                >
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-100">
                      <FileText size={24} />
                    </div>
                    <span className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                      project.status === 'new' ? "bg-indigo-100 text-indigo-700" :
                      project.status === 'completed' ? "bg-green-100 text-green-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {project.status === 'new' ? 'Новый' : project.status === 'completed' ? 'Готово' : 'В работе'}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-stone-900 group-hover:text-indigo-600 transition-colors">{project.name}</h3>
                  <p className="mt-3 text-stone-500 font-medium line-clamp-2">
                    Этап {project.currentStep}: {STEPS_LABELS[project.currentStep - 1]}
                  </p>

                  <div className="mt-10 space-y-5">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        <span>Прогресс</span>
                        <span className="text-indigo-600">{Math.round((project.currentStep / STEPS_LABELS.length) * 100)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out" 
                          style={{ width: `${(project.currentStep / STEPS_LABELS.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-stone-50 pt-5">
                      <div className="flex items-center gap-4 text-xs font-medium text-stone-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-indigo-400" />
                          {formatDate(project.createdAt)}
                        </div>
                      </div>
                      <Link 
                        to={`/project/${project.id}`}
                        className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 transition-all hover:gap-2 active:scale-95"
                      >
                        Продолжить
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-6 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-[2rem] bg-white p-10 shadow-2xl"
          >
            <h3 className="text-3xl font-extrabold tracking-tight text-stone-900">Новый проект</h3>
            <p className="mt-3 text-lg font-medium text-stone-500 leading-relaxed">
              Дайте название вашему пути. Например: <br/>
              <span className="text-indigo-600 font-serif italic">"Гипнотерапия для экспертов"</span>
            </p>
            
            <form onSubmit={createProject} className="mt-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Название проекта</label>
                <input
                  autoFocus
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full rounded-2xl border-2 border-stone-100 bg-stone-50 py-4 px-6 text-base font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="Введите название..."
                />
              </div>
              
              <div className="flex items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-2xl border-2 border-stone-100 py-4 text-sm font-bold text-stone-600 transition-all hover:bg-stone-50 active:scale-95"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-indigo-600 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
                >
                  Создать
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
