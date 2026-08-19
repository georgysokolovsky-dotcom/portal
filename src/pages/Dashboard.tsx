import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { User, Project, STEPS_LABELS } from '../types';
import { motion } from 'motion/react';
import { Plus, Folder, Calendar, Clock, ArrowRight, LogOut, ChevronRight } from 'lucide-react';
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
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
      {/* Sidebar-like layout */}
      <div className="mx-auto flex max-w-6xl flex-col px-6 py-12 md:flex-row">
        <aside className="w-full space-y-8 md:w-64">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-900 text-stone-50">
              <Plus size={20} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Кабинет</h1>
          </div>

          <nav className="space-y-1">
            <button className="flex w-full items-center gap-3 rounded-lg bg-stone-200 px-4 py-2 text-sm font-medium text-stone-900">
              <Folder size={18} />
              Мои проекты
            </button>
            {/* Add more nav items if needed */}
          </nav>

          <div className="pt-8 border-t border-stone-200">
            <div className="px-4 mb-4">
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Студент</p>
              <p className="mt-1 text-sm font-medium text-stone-900">{user.name}</p>
              <p className="text-xs text-stone-500">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            >
              <LogOut size={18} />
              Выйти
            </button>
          </div>
        </aside>

        <main className="flex-1 mt-12 md:mt-0 md:pl-16">
          <header className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Мои проекты</h2>
              <p className="mt-2 text-stone-500">Управляйте вашим путем развития</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
            >
              <Plus size={18} />
              Новый проект
            </button>
          </header>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map(i => (
                <div key={i} className="h-48 animate-pulse rounded-2xl bg-stone-200" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 py-24 text-center">
              <div className="mb-4 rounded-full bg-stone-100 p-4 text-stone-400">
                <Folder size={32} />
              </div>
              <h3 className="text-lg font-medium text-stone-900">Проектов пока нет</h3>
              <p className="mt-2 max-w-xs text-sm text-stone-500">
                Создайте свой первый проект, чтобы начать распаковку экспертности.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ y: -4 }}
                  className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 transition-all hover:shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-50 text-stone-400 group-hover:bg-stone-900 group-hover:text-stone-50 transition-colors">
                      <FileText size={20} />
                    </div>
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      project.status === 'new' ? "bg-blue-50 text-blue-600" :
                      project.status === 'completed' ? "bg-green-50 text-green-600" :
                      "bg-stone-100 text-stone-600"
                    )}>
                      {project.status === 'new' ? 'Новый' : project.status === 'completed' ? 'Готово' : 'В работе'}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-stone-900">{project.name}</h3>
                  <p className="mt-2 text-sm text-stone-500 line-clamp-2">
                    Этап {project.currentStep}: {STEPS_LABELS[project.currentStep - 1]}
                  </p>

                  <div className="mt-8 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        <span>Прогресс</span>
                        <span>{Math.round((project.currentStep / STEPS_LABELS.length) * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                        <div 
                          className="h-full bg-stone-900 transition-all duration-500" 
                          style={{ width: `${(project.currentStep / STEPS_LABELS.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-stone-50 pt-4">
                      <div className="flex items-center gap-4 text-xs text-stone-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {formatDate(project.createdAt)}
                        </div>
                      </div>
                      <Link 
                        to={`/project/${project.id}`}
                        className="flex items-center gap-1.5 text-sm font-semibold text-stone-900 transition-colors hover:text-stone-600"
                      >
                        Продолжить
                        <ChevronRight size={16} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-6 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
          >
            <h3 className="text-2xl font-bold tracking-tight text-stone-900">Новый проект</h3>
            <p className="mt-2 text-sm text-stone-500">
              Дайте название вашему проекту. Например: "Гипнотерапия для предпринимателей"
            </p>
            
            <form onSubmit={createProject} className="mt-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-stone-400">Название проекта</label>
                <input
                  autoFocus
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 py-3 px-4 text-sm outline-none transition-all focus:border-stone-400"
                  placeholder="Мое направление"
                />
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-stone-200 py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-stone-900 py-3 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
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

// Icons for the grid
function FileText({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}
