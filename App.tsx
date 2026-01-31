
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Language, User, Test, TestAttempt } from './types';
import Dashboard from './pages/Dashboard';
import TestCreator from './pages/TestCreator';
import TestList from './pages/TestList';
import TestPlayer from './pages/TestPlayer';
import Results from './pages/Results';
import { Navbar } from './components/Navbar';

const INITIAL_USER: User = {
  id: 'user-1',
  name: 'Saleh',
  email: 'saleh@example.com',
  role: 'creator',
  lang: Language.AR
};

const App: React.FC = () => {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [tests, setTests] = useState<Test[]>(() => {
    const saved = localStorage.getItem('exam_pro_tests');
    return saved ? JSON.parse(saved) : [];
  });
  const [attempts, setAttempts] = useState<TestAttempt[]>(() => {
    const saved = localStorage.getItem('exam_pro_attempts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('exam_pro_tests', JSON.stringify(tests));
  }, [tests]);

  useEffect(() => {
    localStorage.setItem('exam_pro_attempts', JSON.stringify(attempts));
  }, [attempts]);

  const handleSaveTest = (test: Test) => {
    setTests(prev => {
      const index = prev.findIndex(t => t.id === test.id);
      if (index !== -1) {
        const updatedTests = [...prev];
        updatedTests[index] = test;
        return updatedTests;
      }
      return [...prev, test];
    });
  };

  const handleCompleteTest = (attempt: TestAttempt) => {
    setAttempts(prev => [attempt, ...prev]);
  };

  const toggleLanguage = () => {
    const newLang = user.lang === Language.EN ? Language.AR : Language.EN;
    setUser({ ...user, lang: newLang });
    document.documentElement.dir = newLang === Language.AR ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.dir = user.lang === Language.AR ? 'rtl' : 'ltr';
  }, []);

  return (
    <HashRouter>
      <div className={`min-h-screen ${user.lang === Language.AR ? 'rtl' : ''} bg-gray-50`}>
        <Navbar user={user} onToggleLang={toggleLanguage} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard user={user} tests={tests} attempts={attempts} />} />
            <Route path="/tests" element={<TestList user={user} tests={tests} />} />
            <Route path="/create-test" element={<TestCreator user={user} onSave={handleSaveTest} />} />
            <Route path="/take-test/:testId" element={<TestPlayer user={user} tests={tests} onComplete={handleCompleteTest} />} />
            <Route path="/results/:attemptId" element={<Results user={user} attempts={attempts} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-gray-200 py-6 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Exam-Professional Platform. {user.lang === Language.AR ? 'بواسطة د. صالح باحاج' : 'By Dr. Saleh Bahaj'}.
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
