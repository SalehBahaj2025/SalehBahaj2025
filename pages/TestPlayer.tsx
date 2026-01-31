
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Language, Test, QuestionType, TestAttempt, Question } from '../types';

interface TestPlayerProps {
  user: User;
  tests: Test[];
  onComplete: (attempt: TestAttempt) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const TestPlayer: React.FC<TestPlayerProps> = ({ user, tests, onComplete }) => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const test = tests.find(t => t.id === testId);
  const isAr = user.lang === Language.AR;

  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [feedbackShown, setFeedbackShown] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState(test ? test.timeLimit * 60 : 0);
  const [isFinished, setIsFinished] = useState(false);
  
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(0);
  const [questionTimeExpired, setQuestionTimeExpired] = useState<boolean>(false);

  useEffect(() => {
    if (test) {
      const scrambled = shuffleArray(test.questions).map((q: Question) => ({
        ...q,
        options: q.options ? shuffleArray(q.options) : undefined
      }));
      setShuffledQuestions(scrambled);
    }
  }, [test]);

  const currentQuestion = shuffledQuestions[currentIdx];

  useEffect(() => {
    if (currentQuestion && !isFinished) {
      setQuestionTimeLeft(currentQuestion.timeLimit || 30);
      setQuestionTimeExpired(false);
      setFeedbackShown(false);
    }
  }, [currentIdx, currentQuestion, isFinished]);

  useEffect(() => {
    if (isFinished || questionTimeExpired || questionTimeLeft <= 0) return;
    const qTimer = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          setQuestionTimeExpired(true);
          if (!answers[currentQuestion.id]) {
             setAnswers(prevAns => ({ ...prevAns, [currentQuestion.id]: 'EXPIRED' }));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(qTimer);
  }, [questionTimeLeft, questionTimeExpired, isFinished, answers, currentQuestion]);

  const calculateScore = useCallback(() => {
    let score = 0;
    shuffledQuestions.forEach(q => {
      const userAnswer = answers[q.id];
      if (q.type === QuestionType.MULTIPLE_CHOICE) {
        const correctOpt = q.options?.find(o => o.isCorrect);
        if (userAnswer === correctOpt?.id) score += q.points;
      } else if (q.type === QuestionType.TRUE_FALSE) {
        if (userAnswer === q.correctAnswer) score += q.points;
      }
    });
    return score;
  }, [answers, shuffledQuestions]);

  const handleFinish = useCallback(() => {
    if (isFinished || !test) return;
    setIsFinished(true);
    const score = calculateScore();
    const total = test.questions.reduce((a, b) => a + (b.points || 0), 0);
    const attempt: TestAttempt = {
      id: `att-${Date.now()}`,
      testId: test.id,
      testTitle: test.title,
      startTime: new Date().toISOString(),
      answers,
      score,
      totalPoints: total,
      status: 'completed'
    };
    onComplete(attempt);
    navigate(`/results/${attempt.id}`);
  }, [calculateScore, isFinished, navigate, test, answers, onComplete]);

  const goToNext = () => {
    if (currentIdx < shuffledQuestions.length - 1) setCurrentIdx(currentIdx + 1);
    else handleFinish();
  };

  const handleOptionSelect = (qId: string, optId: string) => {
    if (feedbackShown || questionTimeExpired) return;
    setAnswers({ ...answers, [qId]: optId });
    setFeedbackShown(true);
  };

  useEffect(() => {
    if (isFinished || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!test || shuffledQuestions.length === 0) return <div className="p-10 text-center font-black">جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto unselectable select-none pb-20">
      <div className="sticky top-20 z-50 bg-white/95 backdrop-blur-md shadow-2xl border border-gray-100 p-6 rounded-[2.5rem] mb-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="#f3f4f6" strokeWidth="4" fill="transparent" />
              <circle cx="32" cy="32" r="28" stroke={questionTimeLeft < 5 ? '#ef4444' : '#2563eb'} strokeWidth="4" fill="transparent" strokeDasharray={176} strokeDashoffset={176 - (176 * questionTimeLeft) / (currentQuestion.timeLimit || 30)} className="transition-all duration-1000" />
            </svg>
            <span className={`absolute font-black text-sm ${questionTimeLeft < 5 ? 'text-red-600' : 'text-gray-900'}`}>{questionTimeLeft}s</span>
          </div>
          <div><h2 className="font-black text-gray-900 text-sm">{test.title[user.lang]}</h2><p className="text-[10px] text-gray-400 font-bold uppercase">Active Session</p></div>
        </div>
        <div className="text-end">
           <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Total Time Left</p>
           <p className={`font-mono font-black text-xl ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>{formatTime(timeLeft)}</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-14 border border-gray-100 min-h-[550px] flex flex-col relative overflow-hidden">
        {questionTimeExpired && !feedbackShown && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
             <div className="bg-red-600 text-white px-8 py-4 rounded-3xl font-black animate-in zoom-in">Time Expired!</div>
          </div>
        )}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gray-50">
          <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${((currentIdx + 1) / shuffledQuestions.length) * 100}%` }}></div>
        </div>

        <div className="flex-grow">
          <div className="flex justify-between items-center mb-10">
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-5 py-2 rounded-full border border-blue-100 uppercase tracking-widest">Question {currentIdx + 1} / {shuffledQuestions.length}</span>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-5 py-2 rounded-full border border-emerald-100 uppercase tracking-widest">{currentQuestion.points} Points</span>
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-12 leading-[1.2]">{currentQuestion.text[user.lang]}</h3>
          
          <div className="grid grid-cols-1 gap-5">
            {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && currentQuestion.options?.map((opt, i) => (
              <button key={opt.id} disabled={feedbackShown || questionTimeExpired} onClick={() => handleOptionSelect(currentQuestion.id, opt.id)}
                className={`w-full text-start p-6 rounded-[1.75rem] border-2 transition-all flex items-center gap-6 ${feedbackShown && opt.isCorrect ? 'border-emerald-500 bg-emerald-50' : feedbackShown && answers[currentQuestion.id] === opt.id ? 'border-red-500 bg-red-50' : answers[currentQuestion.id] === opt.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${answers[currentQuestion.id] === opt.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{String.fromCharCode(65 + i)}</div>
                <span className="text-lg font-black">{opt.text[user.lang]}</span>
              </button>
            ))}

            {currentQuestion.type === QuestionType.TRUE_FALSE && (
              <div className="flex gap-6">
                {['true', 'false'].map(val => (
                  <button key={val} disabled={feedbackShown || questionTimeExpired} onClick={() => handleOptionSelect(currentQuestion.id, val)}
                    className={`flex-1 py-14 rounded-[2.5rem] border-4 transition-all font-black text-2xl uppercase ${feedbackShown && currentQuestion.correctAnswer === val ? 'bg-emerald-50 border-emerald-500' : feedbackShown && answers[currentQuestion.id] === val ? 'bg-red-50 border-red-500' : answers[currentQuestion.id] === val ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-100'}`}>
                    {val === 'true' ? '✅ True' : '❌ False'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-12 pt-10 border-t border-gray-100">
           <button onClick={goToNext} disabled={!answers[currentQuestion.id] && !questionTimeExpired} className="px-14 py-5 rounded-[1.75rem] font-black shadow-2xl bg-blue-600 text-white disabled:opacity-20 transition-all">
             {currentIdx === shuffledQuestions.length - 1 ? 'Finish 🏁' : 'Next Question →'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default TestPlayer;
