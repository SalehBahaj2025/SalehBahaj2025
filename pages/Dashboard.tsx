
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Language, Test, TestAttempt } from '../types';

interface DashboardProps {
  user: User;
  tests: Test[];
  attempts: TestAttempt[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, tests, attempts }) => {
  const isAr = user.lang === Language.AR;
  const now = new Date();
  const [sharingTest, setSharingTest] = useState<Test | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const scheduledTests = tests.filter(t => t.scheduledStartTime && new Date(t.scheduledStartTime) > now);
  
  const subjectsMap = tests.reduce((acc, test) => {
    const subName = test.subject[user.lang] || test.subject[Language.EN] || (isAr ? 'عام' : 'General');
    if (!acc[subName]) acc[subName] = 0;
    acc[subName]++;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    { label: isAr ? 'إجمالي الاختبارات' : 'Total Exams', value: tests.length, icon: '📜', color: 'from-blue-600 to-indigo-600' },
    { label: isAr ? 'المواد الدراسية' : 'Open Subjects', value: Object.keys(subjectsMap).length, icon: '📚', color: 'from-purple-600 to-pink-600' },
    { label: isAr ? 'المجدولة' : 'Scheduled', value: scheduledTests.length, icon: '📅', color: 'from-amber-500 to-orange-600' },
    { label: isAr ? 'المكتملة' : 'Completed', value: attempts.length, icon: '✅', color: 'from-emerald-500 to-teal-600' },
  ];

  // Universal URL construction logic
  const getSharingUrl = (id: string) => {
    const baseUrl = window.location.href.split('#')[0];
    return `${baseUrl}#/take-test/${id}`;
  };

  const getQrUrl = (id: string) => `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(getSharingUrl(id))}&choe=UTF-8`;

  const handleCopyLink = (id: string) => {
    navigator.clipboard.writeText(getSharingUrl(id));
    setCopyStatus('link');
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const downloadQR = async (id: string, title: string) => {
    const response = await fetch(getQrUrl(id));
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-${title}.png`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Enhanced Sharing Modal */}
      {sharingTest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full p-8 relative overflow-hidden animate-in zoom-in-95 duration-300">
            <button onClick={() => setSharingTest(null)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="text-center space-y-6">
              <h3 className="text-2xl font-black text-gray-900">{isAr ? 'مشاركة الاختبار' : 'Share Exam'}</h3>
              <p className="text-gray-500 font-medium line-clamp-1">{sharingTest.title[user.lang]}</p>
              
              <div className="relative group bg-white p-6 rounded-[2.5rem] shadow-inner border border-gray-100 inline-block mx-auto">
                <img src={getQrUrl(sharingTest.id)} alt="QR Code" className="w-48 h-48 mx-auto" />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                  <button 
                    onClick={() => downloadQR(sharingTest.id, sharingTest.title[user.lang])}
                    className="p-3.5 bg-gray-900 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all"
                    title={isAr ? "تحميل كصورة" : "Download QR"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                </div>
              </div>

              <div className="pt-8 space-y-3 text-start">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest ps-2">{isAr ? 'الرابط المباشر للطلاب' : 'Direct Link for Students'}</p>
                <div className="flex items-center gap-2 bg-blue-50 p-4 rounded-2xl border border-blue-100 group/link transition-colors hover:border-blue-300 overflow-hidden">
                  <input readOnly value={getSharingUrl(sharingTest.id)} className="flex-1 text-xs text-blue-700 font-mono outline-none bg-transparent truncate" />
                  <button 
                    onClick={() => handleCopyLink(sharingTest.id)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all flex-shrink-0 ${copyStatus === 'link' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {copyStatus === 'link' ? (isAr ? 'تم!' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}
                  </button>
                </div>
                {window.location.protocol === 'file:' && (
                  <p className="text-[9px] text-amber-600 font-bold italic mt-2 px-2">
                    ⚠️ {isAr ? 'تعمل الروابط فقط عند الرفع على استضافة.' : 'Links only work when hosted online.'}
                  </p>
                )}
              </div>

              <div className="pt-4"><button onClick={() => setSharingTest(null)} className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-black hover:bg-gray-200 transition-all">{isAr ? 'إغلاق' : 'Close'}</button></div>
            </div>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden bg-white rounded-[3rem] p-8 md:p-14 border border-gray-100 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-[100px] opacity-60"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                {isAr ? 'منصة د. صالح باحاج المتكاملة' : 'Dr. Saleh Bahaj Integrated Platform'}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-[1.15]">
              {isAr ? 'إدارة الاختبارات والنتائج' : 'Exam Management & Results'}
              <span className="block text-blue-600 mt-2">{isAr ? 'بذكاء واحترافية' : 'With Intelligence'}</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-xl">
              {isAr ? 'النظام المتكامل لإدارة المواد التعليمية، وجدولة الاختبارات، وتتبع نمو الطلاب الأكاديمي بدقة متناهية.' : 'The unified system for managing subjects, scheduling exams, and tracking academic growth with extreme precision.'}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/create-test" className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl active:scale-95">
                {isAr ? 'أنشئ اختباراً الآن' : 'Create Exam Now'}
              </Link>
              <Link to="/tests" className="bg-white text-gray-700 px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-50 transition-all border-2 border-gray-100">
                {isAr ? 'مكتبة الاختبارات' : 'Tests Library'}
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-96 bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 backdrop-blur-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8 px-2">
              {isAr ? 'المواد الدراسية' : 'Subjects'}
            </h3>
            <div className="space-y-4">
              {Object.entries(subjectsMap).slice(0, 3).map(([name, count], i) => (
                <div key={i} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">{name.charAt(0)}</span>
                    <span className="font-bold text-gray-700">{name}</span>
                  </div>
                  <span className="text-xs font-black text-gray-400">{count} {isAr ? 'اختبار' : 'tests'}</span>
                </div>
              ))}
              {Object.keys(subjectsMap).length === 0 && (
                <div className="text-center py-4 text-gray-400 font-medium italic">{isAr ? 'لا توجد بيانات' : 'No data yet'}</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden">
            <div className={`w-14 h-14 rounded-[1.25rem] bg-gradient-to-br ${stat.color} text-white flex items-center justify-center text-2xl mb-8 shadow-lg transform group-hover:-translate-y-1 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-4xl font-black mt-2 text-gray-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-10">
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10">
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3 mb-10">
              <span className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">📊</span>
              {isAr ? 'أحدث التقارير' : 'Latest Reports'}
            </h2>
            <div className="space-y-5">
              {attempts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-3xl opacity-50 italic font-bold">
                  {isAr ? 'لا توجد نتائج مسجلة' : 'No recorded results.'}
                </div>
              ) : (
                attempts.slice(0, 5).map(attempt => (
                  <div key={attempt.id} className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-3xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 transition-all gap-6">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center shadow-sm ${attempt.score/attempt.totalPoints >= 0.5 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        <span className="text-xl font-black">{Math.round((attempt.score/attempt.totalPoints)*100)}%</span>
                      </div>
                      <div>
                        <h5 className="font-black text-lg text-gray-900 line-clamp-1">{attempt.testTitle[user.lang]}</h5>
                        <p className="text-xs text-gray-400 font-bold">{new Date(attempt.startTime).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Link to={`/results/${attempt.id}`} className="w-full sm:w-auto px-8 py-3 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl text-xs font-black hover:bg-gray-900 hover:text-white transition-all text-center">
                      {isAr ? 'عرض التفاصيل' : 'Details'}
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-gray-900 text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col">
            <header className="relative z-10 mb-12">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="text-amber-400 text-3xl">🔗</span>
                {isAr ? 'روابط الوصول السريع' : 'Quick Access Links'}
              </h2>
              <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">{isAr ? 'مشاركة الاختبارات المفعلة' : 'Share active exams'}</p>
            </header>
            
            <div className="relative z-10 flex-grow space-y-6 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {tests.length === 0 ? (
                <div className="text-center py-12 opacity-20 italic">{isAr ? 'لا توجد اختبارات' : 'No tests'}</div>
              ) : (
                tests.map(test => (
                  <div key={test.id} className="relative flex gap-4 group items-center bg-gray-800/50 p-4 rounded-2xl border border-gray-700 hover:bg-gray-800 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex-shrink-0 flex items-center justify-center text-xl">🚀</div>
                    <div className="flex-1 overflow-hidden text-start">
                      <h4 className="font-bold text-sm truncate">{test.title[user.lang]}</h4>
                      <p className="text-[9px] text-gray-400 uppercase font-black">{test.subject[user.lang]}</p>
                    </div>
                    <button onClick={() => setSharingTest(test)} className="p-2.5 bg-gray-700 text-blue-400 hover:text-white hover:bg-blue-600 rounded-xl transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-2.684 3 3 0 000 2.684m0 9a3 3 0 100-2.684 3 3 0 000 2.684" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-8">
              <Link to="/tests" className="block w-full text-center py-4 bg-gray-800 hover:bg-white hover:text-gray-900 transition-all rounded-2xl font-black text-xs border border-gray-700 shadow-xl uppercase tracking-widest">
                {isAr ? 'عرض المكتبة' : 'View Library'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
