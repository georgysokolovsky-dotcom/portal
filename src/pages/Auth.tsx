import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Sparkles, Mail, Lock, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: name });
        
        // Initialize user doc
        await setDoc(doc(db, 'users', user.uid), {
          name,
          email,
          role: 'student',
          createdAt: Date.now()
        });
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
      >
        <div className="bg-stone-900 p-8 text-stone-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Heorhii Platform</h2>
              <p className="text-sm text-stone-400">Среда персонального наставника</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-stone-900">
              {isLogin ? 'С возвращением' : 'Создать аккаунт'}
            </h1>
            <p className="text-sm text-stone-500">
              {isLogin ? 'Войдите, чтобы продолжить работу' : 'Начните свой путь к востребованному офферу'}
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-100">
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-stone-400">Имя</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 text-stone-400" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-stone-400"
                  placeholder="Георгий"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-stone-400">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-stone-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-stone-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-stone-400"
                placeholder="example@mail.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-stone-400">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-stone-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-stone-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-stone-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full rounded-lg bg-stone-900 py-3 text-sm font-medium text-stone-50 transition-all hover:bg-stone-800 disabled:opacity-50",
              loading && "cursor-not-allowed"
            )}
          >
            {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-stone-500 hover:text-stone-900"
            >
              {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
