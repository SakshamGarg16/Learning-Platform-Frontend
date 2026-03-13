import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ArrowLeft, CheckCircle2, Loader2, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

type ScopeType = 'track' | 'roadmap';

interface FinalAssessmentQuestion {
  question: string;
  type: 'mcq' | 'boolean' | 'multi_select';
  options: string[];
  correct_answer: number[];
}

interface FinalAssessmentPayload {
  id: string;
  title: string;
  description: string;
  questions_data: FinalAssessmentQuestion[];
  passing_score: number;
  time_limit_minutes: number;
  user_latest_attempt?: any;
}

interface FinalAssessmentResponse {
  available: boolean;
  completed_modules?: number;
  total_modules?: number;
  error?: string;
  assessment?: FinalAssessmentPayload;
}

const emptyIntegrityFlags = {
  tab_switch_count: 0,
  fullscreen_exit_count: 0,
  context_menu_count: 0,
};

export function FinalAssessmentMode() {
  const { trackId, roadmapId } = useParams<{ trackId?: string; roadmapId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const submittedRef = useRef(false);

  const scope: ScopeType = roadmapId ? 'roadmap' : 'track';
  const scopeId = roadmapId || trackId;
  const exitUrl = roadmapId ? `/roadmaps/${roadmapId}` : `/track/enroll/${trackId}`;

  const [currentStep, setCurrentStep] = useState<'intro' | 'exam' | 'result'>('intro');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [integrityFlags, setIntegrityFlags] = useState(emptyIntegrityFlags);

  const fetchUrl = scope === 'roadmap'
    ? `/roadmaps/${scopeId}/final_assessment/`
    : `/tracks/${scopeId}/final_assessment/`;

  const submitUrl = scope === 'roadmap'
    ? `/roadmaps/${scopeId}/submit_final_assessment/`
    : `/tracks/${scopeId}/submit_final_assessment/`;

  const { data, isLoading } = useQuery({
    queryKey: ['final-assessment', scope, scopeId],
    queryFn: async () => (await api.get(fetchUrl)).data as FinalAssessmentResponse,
    enabled: !!scopeId,
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: { answers: Record<string, any>; integrity_flags: typeof emptyIntegrityFlags }) => {
      const response = await api.post(submitUrl, payload);
      return response.data;
    },
    onSuccess: async (payload) => {
      submittedRef.current = true;
      setResult(payload);
      setCurrentStep('result');
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => undefined);
      }
      queryClient.invalidateQueries({ queryKey: ['track', trackId] });
      queryClient.invalidateQueries({ queryKey: ['roadmap', roadmapId] });
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
    },
  });

  useEffect(() => {
    const existingAttempt = data?.assessment?.user_latest_attempt;
    if (existingAttempt && currentStep === 'intro') {
      submittedRef.current = true;
      setResult(existingAttempt);
      setCurrentStep('result');
    }
  }, [data, currentStep]);

  useEffect(() => {
    if (currentStep !== 'exam') {
      return;
    }

    const submitIntegrityViolation = (overrides?: Partial<typeof emptyIntegrityFlags>) => {
      if (submittedRef.current) {
        return;
      }

      const nextFlags = { ...integrityFlags, ...overrides };
      setIntegrityFlags(nextFlags);
      submittedRef.current = true;
      submitMutation.mutate({ answers, integrity_flags: nextFlags });
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        submitIntegrityViolation({ tab_switch_count: integrityFlags.tab_switch_count + 1 });
      }
    };

    const onBlur = () => {
      submitIntegrityViolation({ tab_switch_count: integrityFlags.tab_switch_count + 1 });
    };

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        submitIntegrityViolation({ fullscreen_exit_count: integrityFlags.fullscreen_exit_count + 1 });
      }
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      setIntegrityFlags((prev) => ({ ...prev, context_menu_count: prev.context_menu_count + 1 }));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'F12' ||
        (event.ctrlKey && ['p', 's', 'u', 'c', 'v', 'x'].includes(event.key.toLowerCase())) ||
        (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(event.key.toLowerCase()))
      ) {
        event.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [answers, currentStep, integrityFlags, submitMutation]);

  const assessment = data?.assessment;
  const questions = assessment?.questions_data || [];

  const beginExam = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      return;
    }
    setCurrentStep('exam');
  };

  const handleOptionSelect = (questionIndex: number, optionIndex: number, type: FinalAssessmentQuestion['type']) => {
    if (type === 'multi_select') {
      const current = (answers[questionIndex] as number[]) || [];
      const next = current.includes(optionIndex)
        ? current.filter((value) => value !== optionIndex)
        : [...current, optionIndex];
      setAnswers({ ...answers, [questionIndex]: next });
      return;
    }

    setAnswers({ ...answers, [questionIndex]: optionIndex });
  };

  const handleSubmit = () => {
    submittedRef.current = true;
    submitMutation.mutate({ answers, integrity_flags: integrityFlags });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
        <p className="text-neutral-500">Loading final evaluation...</p>
      </div>
    );
  }

  if (!data?.available || !assessment) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
        <Card className="max-w-2xl w-full p-10 bg-neutral-900/50 border-neutral-800 text-center space-y-6">
          <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
          <h1 className="text-3xl font-black">Final Evaluation Locked</h1>
          <p className="text-neutral-400">{data?.error || 'Complete the required curriculum before taking the final evaluation.'}</p>
          <p className="text-sm text-neutral-500">
            Progress: {data?.completed_modules || 0} / {data?.total_modules || 0} modules completed
          </p>
          <Button onClick={() => navigate(exitUrl)}>Return</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(exitUrl)} leftIcon={<ArrowLeft size={16} />}>
            Exit
          </Button>
          <h1 className="text-sm font-semibold truncate">{assessment.title}</h1>
        </div>
        <Badge variant="indigo" className="flex items-center gap-2">
          <ShieldCheck size={14} /> Proctored Final
        </Badge>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {currentStep === 'intro' && (
          <Card className="p-10 bg-neutral-900/50 border-neutral-800 text-center space-y-8">
            <ShieldCheck className="w-14 h-14 text-indigo-400 mx-auto" />
            <div className="space-y-3">
              <h1 className="text-4xl font-black">Certification Final Evaluation</h1>
              <p className="text-neutral-400 max-w-2xl mx-auto">{assessment.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <Card className="p-5 bg-black/20 border-neutral-800">
                <p className="text-xs text-neutral-500 uppercase tracking-widest">Questions</p>
                <p className="text-2xl font-bold">{questions.length}</p>
              </Card>
              <Card className="p-5 bg-black/20 border-neutral-800">
                <p className="text-xs text-neutral-500 uppercase tracking-widest">Pass Mark</p>
                <p className="text-2xl font-bold text-emerald-400">{assessment.passing_score}%</p>
              </Card>
              <Card className="p-5 bg-black/20 border-neutral-800">
                <p className="text-xs text-neutral-500 uppercase tracking-widest">Time Limit</p>
                <p className="text-2xl font-bold text-indigo-400">{assessment.time_limit_minutes} min</p>
              </Card>
            </div>
            <Card className="p-6 bg-red-500/5 border-red-500/20 text-left">
              <p className="text-sm font-bold text-red-300 uppercase tracking-widest mb-3">Exam Restrictions</p>
              <ul className="text-sm text-neutral-300 space-y-2">
                <li>Fullscreen mode is mandatory.</li>
                <li>Tab switching or leaving fullscreen ends the attempt.</li>
                <li>Right click and common inspect/print shortcuts are blocked.</li>
                <li>Passing this exam issues a certificate.</li>
              </ul>
            </Card>
            <Button className="h-14 px-10" onClick={beginExam}>
              Enter Fullscreen and Begin
            </Button>
          </Card>
        )}

        {currentStep === 'exam' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-widest">Protected Session</p>
                <h2 className="text-2xl font-bold">Final Evaluation in Progress</h2>
              </div>
              <Badge variant="neutral">
                {Object.keys(answers).length} / {questions.length} answered
              </Badge>
            </div>

            <div className="space-y-8 pb-24">
              {questions.map((question, questionIndex) => (
                <Card key={questionIndex} className="p-6 bg-neutral-900/40 border-neutral-800 space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs text-indigo-400 uppercase tracking-widest font-bold">Question {questionIndex + 1}</p>
                    <p className="text-lg font-medium">{question.question}</p>
                  </div>
                  <div className="grid gap-3">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = question.type === 'multi_select'
                        ? ((answers[questionIndex] as number[]) || []).includes(optionIndex)
                        : answers[questionIndex] === optionIndex;

                      return (
                        <button
                          key={optionIndex}
                          type="button"
                          onClick={() => handleOptionSelect(questionIndex, optionIndex, question.type)}
                          className={`rounded-2xl border p-4 text-left transition-colors ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-500/10 text-white'
                              : 'border-neutral-800 bg-black/20 text-neutral-300 hover:border-neutral-700'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-800 bg-neutral-950/90 backdrop-blur p-5">
              <div className="max-w-4xl mx-auto flex justify-end">
                <Button
                  className="min-w-[220px] h-12"
                  disabled={Object.keys(answers).length < questions.length}
                  isLoading={submitMutation.isPending}
                  onClick={handleSubmit}
                >
                  Submit Final Evaluation
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'result' && result && (
          <Card className="p-10 bg-neutral-900/50 border-neutral-800 text-center space-y-8">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto border-4 ${
              result.passed ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'
            }`}>
              {result.passed ? <CheckCircle2 size={46} /> : <XCircle size={46} />}
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-black">
                {result.passed ? 'Certification Earned' : 'Final Evaluation Failed'}
              </h1>
              <p className="text-neutral-400">
                Score: <span className="text-white font-bold">{result.score}%</span>
              </p>
              {result.terminated_reason && (
                <p className="text-red-400">{result.terminated_reason}</p>
              )}
            </div>

            {result.certificate && (
              <Card className="p-6 bg-emerald-500/5 border-emerald-500/20 max-w-xl mx-auto space-y-3">
                <p className="text-xs uppercase tracking-widest font-bold text-emerald-400">Certificate Issued</p>
                <p className="text-lg font-bold text-white">{result.certificate.certificate_code}</p>
                <p className="text-sm text-neutral-400">Issued on {new Date(result.certificate.issued_at).toLocaleString()}</p>
              </Card>
            )}

            <Button onClick={() => navigate(exitUrl)} className="h-12 px-10">
              Return
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
