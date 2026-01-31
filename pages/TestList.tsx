
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Language, Test } from '../types';

interface TestListProps {
  user: User;
  tests: Test[];
}

const TestList: React.FC<TestListProps> = ({ user, tests }) => {
  const isAr = user.lang === Language.AR;
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'scheduled' | 'archived'>('all');
  const [sharingTest, setSharingTest] = useState<Test | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const getTestStatus = (test: Test) => {
    const now = new Date();
    const start = test.scheduledStartTime ? new Date(test.scheduledStartTime) : null;
    const end = test.scheduledEndTime ? new Date(test.scheduledEndTime) : null;
    if (start && now < start) return 'scheduled';
    if (end && now > end) return 'archived';
    return 'active';
  };

  const filteredTests = tests.filter(test => {
    if (activeTab === 'all') return true;
    return getTestStatus(test) === activeTab;
  });

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

  const handleCopyQRImage = async (id: string) => {
    try {
      const response = await fetch(getQrUrl(id));
      const blob = await response.blob();
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      setCopyStatus('qr');
      setTimeout(() => setCopyStatus(null), 2000);
    } catch (err) {
      alert(isAr ? 'عذراً، نسخ الصور غير مدعوم في متصفحك.' : 'Image copy not supported.');
    }
  };

  const downloadQR = async (test: Test) => {
    const response = await fetch(getQrUrl(test.id));
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-${test.title[user.lang]}.png`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Enhanced Sharing Modal */}
      {sharingTest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full p-8 relative overflow-hidden animate-in zoom-in-95 duration-300">
            <button onClick={() => setSharingTest(null)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="text-center space-y-6">
              <h3 className="text-2xl font-black text-gray-900">{isAr ? 'مشاركة الاختبار' : 'Share Exam'}</h3>
              <p className="text-gray-500 font-medium line-clamp-2 px-4">{sharingTest.title[user.lang]}</p>

              <div className="relative group bg-white p-6 rounded-[2.5rem] shadow-inner border border-gray-100 inline-block mx-auto">
                <img src={getQrUrl(sharingTest.id)} alt="QR Code" className="w-44 h-44" />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <button 
                    onClick={() => handleCopyQRImage(sharingTest.id)} 
                    className={`p-3 rounded-full shadow-lg transition-all border ${copyStatus === 'qr' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'}`} 
                    title={isAr ? 'نسخ صورة الكود' : 'Copy QR Image'}
                  >
                    {copyStatus === 'qr' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  </button>
                  <button 
                    onClick={() => downloadQR(sharingTest)} 
                    className="p-3 bg-gray-900 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all" 
                    title={isAr ? 'تحميل الصورة' : 'Download QR'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                </div>
              </div>

              <div className="pt-8 space-y-3 text-start">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ps-2">{isAr ? 'رابط الوصول المباشر' : 'Direct Link'}</p>
                <div className="flex items-center gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-200 overflow-hidden">
                  <input readOnly value={getSharingUrl(sharingTest.id)} className="flex-1 text-sm text-blue-600 font-mono outline-none bg-transparent truncate" />
                  <button 
                    onClick={() => handleCopyLink(sharingTest.id)} 
                    className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all flex-shrink-0 flex items-center gap-2 ${copyStatus === 'link' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {copyStatus === 'link' ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
                    {copyStatus === 'link' ? (isAr ? 'تم' : 'Done') : (isAr ? 'نسخ' : 'Copy')}
                  </button>
                </div>
              </div>

              <div className="pt-4"><button onClick={() => setSharingTest(null)} className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-black hover:bg-gray-200 transition-all">{isAr ? 'إغلاق' : 'Close'}</button></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{isAr ? 'مكتبة الاختبارات' : 'Tests Library'}</h1>
          <p className="text-gray-500 font-medium">{isAr ? 'إدارة الاختبارات ومشاركة روابط الوصول مع الطلاب' : 'Manage exams and share access links.'}</p>
        </div>
        {user.role === 'creator' && <Link to="/create-test" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl shadow-lg hover:bg-blue-700 font-bold transform active:scale-95 transition-all">+ {isAr ? 'إنشاء جديد' : 'Create New'}</Link>}
      </div>

      <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit overflow-x-auto scrollbar-hide">
        {[
          {id: 'all', label: isAr ? 'الكل' : 'All'},
          {id: 'active', label: isAr ? 'نشط' : 'Active'},
          {id: 'scheduled', label: isAr ? 'مجدول' : 'Scheduled'},
          {id: 'archived', label: isAr ? 'مؤرشف' : 'Archived'}
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400 font-bold border-4 border-dashed border-gray-100 rounded-3xl">
            {isAr ? 'لا توجد اختبارات في هذا القسم' : 'No tests found in this category'}
          </div>
        ) : (
          filteredTests.map(test => {
            const status = getTestStatus(test);
            return (
              <div key={test.id} className="group bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col transition-all hover:shadow-2xl hover:-translate-y-1">
                <div className="flex justify-between items-start mb-6">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{status}</span>
                  <button 
                    onClick={() => setSharingTest(test)} 
                    className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm" 
                    title={isAr ? 'مشاركة' : 'Share'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-2.684 3 3 0 000 2.684m0 9a3 3 0 100-2.684 3 3 0 000 2.684" /></svg>
                  </button>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{test.title[user.lang]}</h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-8 font-medium text-start">{test.description[user.lang] || (isAr ? 'لا يوجد وصف.' : 'No description.')}</p>
                <div className="mt-auto pt-6">
                  <Link to={`/take-test/${test.id}`} className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-black text-center block text-sm shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
                    {isAr ? 'بدء الاختبار' : 'Start Exam'}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TestList;
