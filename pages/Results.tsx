
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Language, TestAttempt } from '../types';

interface ResultsProps {
  user: User;
  attempts: TestAttempt[];
}

const Results: React.FC<ResultsProps> = ({ user, attempts }) => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const isAr = user.lang === Language.AR;
  
  const attempt = attempts.find(a => a.id === attemptId);

  if (!attempt) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <p className="text-gray-400 font-bold">{isAr ? 'عذراً، لم نتمكن من العثور على نتيجة هذه المحاولة' : 'Sorry, attempt data not found.'}</p>
        <Link to="/" className="text-blue-600 font-bold underline mt-4 block">{isAr ? 'العودة للرئيسية' : 'Back Home'}</Link>
      </div>
    );
  }

  const percentage = Math.round((attempt.score / attempt.totalPoints) * 100);
  const passed = percentage >= 50;

  return (
    <div className="max-w-2xl mx-auto text-center animate-in zoom-in duration-700 pt-10">
      <div className={`p-12 rounded-[40px] shadow-2xl border-b-[10px] transition-all ${passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="text-8xl mb-8 animate-bounce">
          {passed ? '🏆' : '🕯️'}
        </div>
        
        <h1 className={`text-4xl font-black mb-4 ${passed ? 'text-green-900' : 'text-red-900'}`}>
          {passed 
            ? (isAr ? 'أداء رائع! لقد نجحت' : 'Excellent! You Passed') 
            : (isAr ? 'حظاً أوفر في المرة القادمة' : 'Try again next time')}
        </h1>
        
        <p className="text-gray-500 font-bold mb-10 text-lg">
          {isAr ? `لقد أكملت اختبار: ${attempt.testTitle[user.lang]}` : `You completed: ${attempt.testTitle[user.lang]}`}
        </p>

        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">{isAr ? 'النقاط' : 'Points'}</p>
            <p className="text-5xl font-black text-gray-900">{attempt.score}<span className="text-xl text-gray-300">/{attempt.totalPoints}</span></p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">{isAr ? 'النسبة المئوية' : 'Percentage'}</p>
            <p className={`text-5xl font-black ${passed ? 'text-green-600' : 'text-red-600'}`}>{percentage}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link 
            to="/"
            className="bg-gray-900 text-white py-4 rounded-2xl font-black hover:bg-black transition-all shadow-xl"
          >
            {isAr ? 'لوحة التحكم' : 'Dashboard'}
          </Link>
          <button 
            onClick={() => window.print()}
            className="bg-white text-gray-900 border-2 border-gray-100 py-4 rounded-2xl font-black hover:bg-gray-50 transition-all"
          >
            🖨️ {isAr ? 'طباعة التقرير' : 'Print Report'}
          </button>
        </div>
      </div>

      <div className="mt-12 text-gray-400 font-bold text-sm">
        {isAr ? 'تم حفظ هذه النتيجة في مكتبتك الخاصة' : 'This result has been saved in your personal library.'}
      </div>
    </div>
  );
};

export default Results;
