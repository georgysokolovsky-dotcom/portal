import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { User, Project, STEPS_LABELS } from '../types';
import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageSquare,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, formatDate } from '../lib/utils';

export default function MentorDashboard({ user }: { user: User }) {
  const [projects, setProjects] = useState<(Project & { userName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchAllData = async () => {
      // Fetch all projects
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const projectList = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      
      // Fetch users for names
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userMap = new Map(usersSnapshot.docs.map(doc => [doc.id, doc.data().name]));

      const enrichedProjects = projectList.map(p => ({
        ...p,
        userName: userMap.get(p.userId) || 'Unknown'
      }));

      setProjects(enrichedProjects);
      setLoading(false);
    };

    fetchAllData();
  }, []);

  const filteredProjects = projects.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Кабинет наставника</h1>
            <p className="mt-2 text-stone-500">Проверка студенческих работ и обратная связь</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium">
              <Users size={16} className="text-stone-400" />
              <span>{projects.length} Студентов</span>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="mb-12 grid gap-6 md:grid-cols-4">
          {[
            { label: 'В работе', count: projects.filter(p => p.status === 'in-progress').length, color: 'bg-blue-500' },
            { label: 'На проверке', count: projects.filter(p => p.status === 'sent-to-mentor').length, color: 'bg-orange-500' },
            { label: 'Доработка', count: projects.filter(p => p.status === 'needs-work').length, color: 'bg-red-500' },
            { label: 'Завершено', count: projects.filter(p => p.status === 'approved').length, color: 'bg-green-500' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", stat.color)} />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">{stat.label}</span>
              </div>
              <p className="mt-2 text-3xl font-bold">{stat.count}</p>
            </div>
          ))}
        </div>

        {/* Filter & Search */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {['all', 'sent-to-mentor', 'needs-work', 'approved'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                  filter === f ? "bg-stone-900 text-stone-50" : "bg-white text-stone-500 border border-stone-200 hover:border-stone-400"
                )}
              >
                {f === 'all' ? 'Все' : f === 'sent-to-mentor' ? 'На проверке' : f === 'needs-work' ? 'Доработка' : 'Одобрено'}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
            <input 
              type="text" 
              placeholder="Поиск по студенту..."
              className="rounded-lg border border-stone-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-stone-400"
            />
          </div>
        </div>

        {/* Project List */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-widest text-stone-400">
              <tr>
                <th className="px-6 py-4">Студент</th>
                <th className="px-6 py-4">Проект</th>
                <th className="px-6 py-4">Текущий этап</th>
                <th className="px-6 py-4">Статус</th>
                <th className="px-6 py-4">Последнее изменение</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-stone-100 rounded w-full" /></td>
                  </tr>
                ))
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400">Нет проектов в этой категории</td>
                </tr>
              ) : (
                filteredProjects.map(project => (
                  <tr key={project.id} className="group hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-stone-900">{project.userName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{project.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-stone-400 font-mono text-xs">{project.currentStep}/8</span>
                        <p className="text-stone-600 truncate max-w-[150px]">{STEPS_LABELS[project.currentStep - 1]}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        project.status === 'sent-to-mentor' ? "bg-orange-50 text-orange-600" :
                        project.status === 'approved' ? "bg-green-50 text-green-600" :
                        project.status === 'needs-work' ? "bg-red-50 text-red-600" :
                        "bg-stone-100 text-stone-500"
                      )}>
                        {project.status === 'sent-to-mentor' ? 'На проверке' : 
                         project.status === 'approved' ? 'Одобрено' : 
                         project.status === 'needs-work' ? 'Доработка' : 'В работе'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-500">
                      {formatDate(project.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/project/${project.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-400 hover:bg-stone-900 hover:text-stone-50 hover:border-stone-900 transition-all"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
