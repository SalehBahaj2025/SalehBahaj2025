
import React from 'react';
import { Link } from 'react-router-dom';
import { User, Language } from '../types';

interface NavbarProps {
  user: User;
  onToggleLang: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onToggleLang }) => {
  const isAr = user.lang === Language.AR;

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8 rtl:space-x-reverse">
          <Link to="/" className="flex flex-col items-start leading-tight">
            <div className="text-xl font-bold text-blue-600 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Exam-Professional</span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium ps-8 rtl:ps-0 rtl:pe-8">
              {isAr ? 'بواسطة د. صالح باحاج' : 'By Dr. Saleh Bahaj'}
            </span>
          </Link>
          
          <div className="hidden lg:flex items-center space-x-4 rtl:space-x-reverse">
            <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium">
              {isAr ? 'لوحة التحكم' : 'Dashboard'}
            </Link>
            <Link to="/tests" className="text-gray-600 hover:text-blue-600 font-medium">
              {isAr ? 'الاختبارات' : 'Tests'}
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <button 
            onClick={onToggleLang}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {isAr ? 'English' : 'العربية'}
          </button>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse border-s rtl:border-e ps-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <span className="hidden sm:inline text-sm font-medium text-gray-700">
              {user.name}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};
