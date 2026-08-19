import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User } from './types';

// Pages
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import StepWizard from './pages/StepWizard';
import MentorDashboard from './pages/MentorDashboard';
import Auth from './pages/Auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: fbUser.uid, ...userDoc.data() } as User);
        } else {
          // New user logic
          setUser({ uid: fbUser.uid, email: fbUser.email!, role: 'student', createdAt: Date.now() } as User);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-800" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing user={user} />} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
        
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard user={user} /> : <Navigate to="/auth" />} 
        />
        
        <Route 
          path="/project/:projectId" 
          element={user ? <StepWizard user={user} /> : <Navigate to="/auth" />} 
        />

        <Route 
          path="/mentor" 
          element={user?.role === 'mentor' || user?.role === 'admin' ? <MentorDashboard user={user} /> : <Navigate to="/" />} 
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
