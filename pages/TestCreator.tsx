
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Language, Test, Question, QuestionType } from '../types';
import { generateQuestionsFromTopic } from '../services/geminiService';

interface TestCreatorProps {
  user: User;
  onSave: (test: Test) => void;
}

const ExamTypeCard: React.FC<{
  id: string;
  icon: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}> = ({ icon, label, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 flex-1 min-w-[120px] ${
      isSelected 
      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md' 
      : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
    }`}
  >
    <span className="text-3xl">{icon}</span>
    <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
    {isSelected && (
      <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )}
  </button>
);

const TestCreator: React.FC<TestCreatorProps> = ({ user, onSave }) => {
  const navigate = useNavigate();
  const isAr = user.lang === Language.AR;
  const [step, setStep] = useState(1);
  const [loadingAI, setLoadingAI] = useState(false);
  const [timeUnit, setTimeUnit] = useState<'sec' | 'min'>('sec');
  const [rawTimeValue, setRawTimeValue] = useState<number>(30);
  const [createdTestId, setCreatedTestId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const [testData, setTestData] = useState<Partial<Test>>({
    category: 'quiz',
    subject: { [Language.AR]: '', [Language.EN]: '' },
    title: { [Language.AR]: '', [Language.EN]: '' },
    description: { [Language.AR]: '', [Language.EN]: '' },
    timeLimit: 30,
    questions: [],
    status: 'draft'
  });

  const generateDefaultOptions = () => [
    { id: '1', text: { [Language.AR]: '', [Language.EN]: '' }, isCorrect: false },
    { id: '2', text: { [Language.AR]: '', [Language.EN]: '' }, isCorrect: false },
    { id: '3', text: { [Language.AR]: '', [Language.EN]: '' }, isCorrect: false },
    { id: '4', text: { [Language.AR]: '', [Language.EN]: '' }, isCorrect: false },
    { id: '5', text: { [Language.AR]: '', [Language.EN]: '' }, isCorrect: false }
  ];

  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: QuestionType.MULTIPLE_CHOICE,
    text: { [Language.AR]: '', [Language.EN]: '' },
    points: 1,
    timeLimit: 30,
    options: generateDefaultOptions()
  });

  const handleAiGeneration = async () => {
    const topic = testData.title?.[user.lang];
    if (!topic) return alert(isAr ? 'يرجى إدخال عنوان أولاً' : 'Please enter a title first');
    setLoadingAI(true);
    try {
      const aiQuestions = await generateQuestionsFromTopic(topic, user.lang);
      const formatted: Question[] = aiQuestions.map((q: any, i: number) => ({
        id: `ai-${Date.now()}-${i}`,
        type: q.type as QuestionType,
        text: { [user.lang]: q.text, [user.lang === Language.AR ? Language.EN : Language.AR]: '' },
        points: q.points || 1,
        timeLimit: q.timeLimit || 30, 
        correctAnswer: q.correctAnswer,
        options: q.options?.map((opt: any, oi: number) => ({
          id: `opt-${oi}`,
          text: { [user.lang]: opt.text, [user.lang === Language.AR ? Language.EN : Language.AR]: '' },
          isCorrect: opt.isCorrect
        }))
      }));
      setTestData(prev => ({ ...prev, questions: [...(prev.questions || []), ...formatted] }));
    } catch (err) { alert('AI Generation failed'); } finally { setLoadingAI(false); }
  };

  const addQuestion = () => {
    if (!currentQuestion.text?.[user.lang]) return;
    
    if (currentQuestion.type === QuestionType.MULTIPLE_CHOICE) {
      const hasCorrect = currentQuestion.options?.some(o => o.isCorrect);
      if (!hasCorrect) return alert(isAr ? 'يرجى تحديد الإجابة الصحيحة' : 'Please select the correct answer');
      const hasEmpty = currentQuestion.options?.some(o => !o.text[user.lang]);
      if (hasEmpty) return alert(isAr ? 'يرجى ملء جميع الخيارات الخمسة' : 'Please fill all 5 options');
    }

    const finalSeconds = timeUnit === 'min' ? rawTimeValue * 60 : rawTimeValue;
    const newQ: Question = { 
      ...(currentQuestion as Question), 
      id: `q-${Date.now()}`, 
      timeLimit: finalSeconds 
    };
    setTestData(prev => ({ ...prev, questions: [...(prev.questions || []), newQ] }));
    
    setCurrentQuestion({
      type: QuestionType.MULTIPLE_CHOICE,
      text: { [Language.AR]: '', [Language.EN]: '' },
      points: 1,
      timeLimit: 30,
      options: generateDefaultOptions()
    });
    setRawTimeValue(30);
  };

  const updateOptionText = (idx: number, text: string) => {
    const newOpts = [...(currentQuestion.options || [])];
    newOpts[idx] = { ...newOpts[idx], text: { ...newOpts[idx].text, [user.lang]: text } };
    setCurrentQuestion({ ...currentQuestion, options: newOpts });
  };

  const toggleCorrectOption = (idx: number) => {
    const newOpts = currentQuestion.options?.map((o, i) => ({
      ...o,
      isCorrect: i === idx
    }));
    setCurrentQuestion({ ...currentQuestion, options: newOpts });
  };

  const handleSubmit = (finalStatus: 'draft' | 'published' = 'published') => {
    const final: Test = { 
      ...testData as Test, 
      id: `test-${Date.now()}`, 
      createdAt: new Date().toLocaleDateString(), 
      status: finalStatus 
    };
    onSave(final);
    if (finalStatus === 'draft') navigate('/');
    else { setCreatedTestId(final.id); setStep(4); }
  };

  // Robust URL generation that handles hash routing correctly across all protocols
  const getFullUrl = () => {
    const baseUrl = window.location.href.split('#')[0];
    return `${baseUrl}#/take-test/${createdTestId}`;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(getFullUrl());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const isLocalFile = window.location.protocol === 'file:';

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-10 flex items-center justify-between px-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{isAr ? 'إنشاء اختبار جديد' : 'Create New Test'}</h1>
          <p className="text-xs text-blue-600 font-bold mt-1">{isAr ? 'بواسطة د. صالح باحاج' : 'By Dr. Saleh Bahaj'}</p>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${step >= i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>{i}</div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-gray-100 mx-4">
        {step === 1 && (
          <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
            <section className="space-y-6">
              <h2 className="text-lg font-black border-b pb-2 flex items-center gap-2 text-gray-800">
                <span className="text-blue-600">🏛️</span> {isAr ? 'تصنيف الاختبار' : 'Category'}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ExamTypeCard id="quiz" icon="⏱️" label={isAr ? 'قصير' : 'Quiz'} isSelected={testData.category === 'quiz'} onClick={() => setTestData({...testData, category: 'quiz'})} />
                <ExamTypeCard id="final" icon="🎓" label={isAr ? 'نهائي' : 'Final'} isSelected={testData.category === 'final'} onClick={() => setTestData({...testData, category: 'final'})} />
                <ExamTypeCard id="practice" icon="📋" label={isAr ? 'تدريب' : 'Practice'} isSelected={testData.category === 'practice'} onClick={() => setTestData({...testData, category: 'practice'})} />
                <ExamTypeCard id="cert" icon="🏆" label={isAr ? 'شهادة' : 'Cert'} isSelected={testData.category === 'cert'} onClick={() => setTestData({...testData, category: 'cert'})} />
              </div>
            </section>
            
            <section className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-full">
                  <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">{isAr ? 'المادة الدراسية' : 'Subject'}</label>
                  <input type="text" value={testData.subject?.[user.lang]} onChange={e => setTestData({...testData, subject: {...testData.subject!, [user.lang]: e.target.value}})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder={isAr ? "مثال: التشريح المرضي" : "e.g. Pathology"} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">{isAr ? 'عنوان الاختبار' : 'Exam Title'}</label>
                  <input type="text" value={testData.title?.[user.lang]} onChange={e => setTestData({...testData, title: {...testData.title!, [user.lang]: e.target.value}})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">{isAr ? 'الوقت الكلي للاختبار (دقائق)' : 'Total Exam Time (min)'}</label>
                  <input type="number" value={testData.timeLimit} onChange={e => setTestData({...testData, timeLimit: parseInt(e.target.value) || 0})} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600" />
                </div>
              </div>
            </section>
            <div className="flex justify-end pt-4"><button onClick={() => setStep(2)} className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 active:scale-95 transition-all">{isAr ? 'التالي: إعداد الأسئلة' : 'Next: Questions'}</button></div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between bg-blue-50 p-6 rounded-3xl border border-blue-100">
               <div>
                  <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">{isAr ? 'بنك الأسئلة' : 'Question Bank'}</p>
                  <h3 className="text-xl font-black text-blue-900">{testData.questions?.length || 0} {isAr ? 'سؤال مضاف' : 'Questions Added'}</h3>
               </div>
               <button disabled={loadingAI} onClick={handleAiGeneration} className="bg-white text-blue-600 px-6 py-3 rounded-xl text-xs font-black shadow-sm flex items-center gap-2 hover:bg-blue-100 transition-all">
                  {loadingAI ? '...' : '✨'} {isAr ? 'توليد ذكي (AI)' : 'AI Generate'}
               </button>
            </div>

            <div className="p-10 border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/20 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">{isAr ? '1. اختر نوع السؤال' : '1. Select Question Type'}</label>
                <div className="flex gap-4">
                  {[{id: QuestionType.MULTIPLE_CHOICE, label: 'MCQ (5 Options)'}, {id: QuestionType.TRUE_FALSE, label: 'T/F'}].map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setCurrentQuestion({...currentQuestion, type: t.id as any, options: t.id === QuestionType.MULTIPLE_CHOICE ? generateDefaultOptions() : undefined})} 
                      className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all text-xs tracking-widest ${currentQuestion.type === t.id ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md' : 'border-gray-100 bg-white text-gray-400 hover:bg-gray-50'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                <div className="md:col-span-3">
                  <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">{isAr ? '2. نص السؤال' : '2. Question Text'}</label>
                  <textarea placeholder={isAr ? 'اكتب السؤال هنا...' : 'Enter question...'} value={currentQuestion.text?.[user.lang]} onChange={e => setCurrentQuestion({...currentQuestion, text: {...currentQuestion.text!, [user.lang]: e.target.value}})} className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl min-h-[100px] outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 shadow-sm" />
                </div>
                <div className="space-y-6">
                   <div>
                     <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">{isAr ? 'الدرجة' : 'Points'}</label>
                     <input type="number" min="1" value={currentQuestion.points || 1} onChange={e => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value) || 1})} className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-black text-emerald-600 shadow-sm" />
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest text-blue-600 font-black">{isAr ? 'وقت هذا السؤال' : 'Question Time'}</label>
                     <div className="flex gap-2">
                        <input type="number" min="1" value={rawTimeValue} onChange={e => setRawTimeValue(parseInt(e.target.value) || 0)} className="w-full px-4 py-4 bg-white border border-blue-100 rounded-2xl outline-none font-black text-blue-600 shadow-sm" />
                        <select value={timeUnit} onChange={(e:any) => setTimeUnit(e.target.value)} className="bg-gray-100 rounded-xl px-2 text-[10px] font-black">
                          <option value="sec">{isAr ? 'ثانية' : 'Sec'}</option>
                          <option value="min">{isAr ? 'دقيقة' : 'Min'}</option>
                        </select>
                     </div>
                   </div>
                </div>
              </div>

              {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">{isAr ? '3. خيارات الإجابة (5 خيارات)' : '3. Answer Options (5 Required)'}</label>
                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options?.map((opt, idx) => (
                      <div key={opt.id} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm focus-within:border-blue-300 transition-all">
                        <button onClick={() => toggleCorrectOption(idx)} className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all ${opt.isCorrect ? 'bg-emerald-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                          {opt.isCorrect ? '✓' : String.fromCharCode(65 + idx)}
                        </button>
                        <input type="text" placeholder={`${isAr ? 'الخيار' : 'Option'} ${String.fromCharCode(65 + idx)}`} value={opt.text[user.lang]} onChange={e => updateOptionText(idx, e.target.value)} className="flex-1 bg-transparent border-none outline-none font-bold text-gray-700" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentQuestion.type === QuestionType.TRUE_FALSE && (
                <div className="space-y-4 pt-4 border-t border-gray-100 text-center">
                  <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">{isAr ? '3. حدد الإجابة الصحيحة' : '3. Mark Correct Answer'}</label>
                  <div className="flex gap-4">
                    <button onClick={() => setCurrentQuestion({...currentQuestion, correctAnswer: 'true'})} className={`flex-1 py-6 rounded-2xl border-2 font-black transition-all ${currentQuestion.correctAnswer === 'true' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md' : 'border-gray-100 bg-white'}`}>✅ True</button>
                    <button onClick={() => setCurrentQuestion({...currentQuestion, correctAnswer: 'false'})} className={`flex-1 py-6 rounded-2xl border-2 font-black transition-all ${currentQuestion.correctAnswer === 'false' ? 'border-red-500 bg-red-50 text-red-700 shadow-md' : 'border-gray-100 bg-white'}`}>❌ False</button>
                  </div>
                </div>
              )}

              <button onClick={addQuestion} className="w-full bg-gray-900 text-white py-5 rounded-[1.75rem] font-black hover:bg-black transition-all shadow-xl active:scale-[0.98]">+ {isAr ? 'إدراج السؤال في الاختبار' : 'Insert Question'}</button>
            </div>

            <div className="flex justify-between pt-10 border-t border-gray-100">
              <button onClick={() => setStep(1)} className="text-gray-400 font-black px-8 py-4 hover:text-gray-900">{isAr ? '← السابق' : '← Previous'}</button>
              <button onClick={() => setStep(3)} className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700">{isAr ? 'مراجعة الاختبار' : 'Review Test'}</button>
            </div>
          </div>
        )}

        {step === 3 && (
           <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center">
              <div className="bg-blue-50 p-12 rounded-[3rem] border-2 border-blue-100 inline-block w-full">
                <p className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-4">{isAr ? 'المراجعة النهائية' : 'FINAL REVIEW'}</p>
                <h3 className="text-4xl font-black text-blue-900 mb-6">{testData.title?.[user.lang]}</h3>
                <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
                   <div className="bg-white p-4 rounded-2xl shadow-sm"><p className="text-[10px] text-gray-400 font-black mb-1">{isAr ? 'سؤال' : 'Questions'}</p><p className="text-xl font-black text-gray-900">{testData.questions?.length}</p></div>
                   <div className="bg-white p-4 rounded-2xl shadow-sm"><p className="text-[10px] text-gray-400 font-black mb-1">{isAr ? 'مدة الاختبار' : 'Duration'}</p><p className="text-xl font-black text-gray-900">{testData.timeLimit}m</p></div>
                   <div className="bg-white p-4 rounded-2xl shadow-sm"><p className="text-[10px] text-gray-400 font-black mb-1">{isAr ? 'الدرجة' : 'Total'}</p><p className="text-xl font-black text-gray-900">{testData.questions?.reduce((a,b)=>a+(b.points||0), 0)}</p></div>
                </div>
              </div>
              <div className="flex justify-center gap-6 pt-8">
                <button onClick={() => setStep(2)} className="text-gray-400 font-black px-10 py-4 hover:text-gray-900">{isAr ? 'تعديل الأسئلة' : 'Edit Questions'}</button>
                <button onClick={() => handleSubmit('published')} className="bg-emerald-600 text-white px-16 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-emerald-700 active:scale-95 transition-all text-xl">🚀 {isAr ? 'نشر الاختبار الآن' : 'Publish Now'}</button>
              </div>
           </div>
        )}
        
        {step === 4 && (
          <div className="space-y-8 text-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto shadow-inner">✅</div>
            <h2 className="text-4xl font-black text-gray-900">{isAr ? 'تم النشر بنجاح!' : 'Published Successfully!'}</h2>
            <p className="text-gray-500 font-medium">
              {isAr ? 'الآن، شارك هذا الرابط مع طلابك للدخول المباشر' : 'Share this link with your students for direct access'}
            </p>
            
            {isLocalFile && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-800 text-xs font-bold animate-pulse">
                ⚠️ {isAr ? 'تنبيه: أنت تشغل التطبيق كملف محلي. روابط المشاركة لن تعمل إذا أرسلتها للآخرين إلا بعد رفع التطبيق على استضافة (مثل Netlify).' : 'Note: You are running as a local file. Sharing links won\'t work for others until you host the app online.'}
              </div>
            )}

            <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-[3rem] border border-blue-100 shadow-xl max-w-lg mx-auto space-y-8">
               <div className="bg-white p-4 rounded-3xl border border-gray-100 inline-block shadow-sm">
                 <img src={`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(getFullUrl())}&choe=UTF-8`} alt="QR" className="w-40 h-40 mx-auto" />
               </div>
               
               <div className="space-y-3">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{isAr ? 'الرابط المباشر للاختبار' : 'Direct Exam Link'}</p>
                  <div className="flex items-center gap-2 bg-white p-4 rounded-2xl border border-blue-200 shadow-inner overflow-hidden">
                    <input readOnly value={getFullUrl()} className="flex-1 text-xs font-mono text-blue-700 outline-none bg-transparent overflow-hidden text-ellipsis whitespace-nowrap" />
                    <button onClick={copyLink} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex-shrink-0 ${copySuccess ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                      {copySuccess ? (isAr ? 'تم!' : 'Done!') : (isAr ? 'نسخ' : 'Copy')}
                    </button>
                  </div>
               </div>

               <button onClick={() => navigate('/')} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black hover:bg-black transition-all">
                  {isAr ? 'العودة للرئيسية' : 'Return Home'}
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestCreator;
