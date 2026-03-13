import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Award, BadgeCheck, Download, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface CertificatePayload {
  certificate_code: string;
  verification_code: string;
  issued_at: string;
  learner_name: string;
  learner_email: string;
  issued_for_title: string;
  scope_type: 'track' | 'roadmap' | 'certificate';
}

export function CertificateView() {
  const { certificateCode } = useParams<{ certificateCode: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['certificate', certificateCode],
    queryFn: async () => (await api.get(`/certificates/${certificateCode}/`)).data as CertificatePayload,
    enabled: !!certificateCode,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
        <Card className="max-w-xl w-full p-10 bg-neutral-900/50 border-neutral-800 text-center space-y-6">
          <Award className="w-14 h-14 text-red-400 mx-auto" />
          <h1 className="text-3xl font-black">Certificate Not Found</h1>
          <p className="text-neutral-400">The requested RemLearners certificate could not be verified.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="certificate-page min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_40%),linear-gradient(180deg,_#0f172a,_#020617)] text-white px-4 py-6 md:px-6 md:py-8">
      <div className="certificate-shell mx-auto max-w-[1400px] space-y-5">
        <div className="certificate-toolbar flex items-center justify-between gap-4 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => window.print()} leftIcon={<Download size={16} />}>
              Print Certificate
            </Button>
          </div>
        </div>

        <Card className="certificate-card overflow-hidden border-0 bg-transparent shadow-none">
          <div className="certificate-frame relative aspect-[1.414/1] w-full overflow-hidden rounded-[28px] bg-[#fcf8ee] text-slate-900 shadow-[0_40px_120px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-[16px] rounded-[22px] border border-[#d9c08a]/70" />
            <div className="absolute inset-[30px] rounded-[18px] border border-[#23324a]" />
            <div className="absolute left-0 top-0 h-44 w-44 rounded-br-[80px] bg-[radial-gradient(circle_at_top_left,_rgba(191,161,92,0.4),_transparent_70%)]" />
            <div className="absolute bottom-0 right-0 h-56 w-56 rounded-tl-[110px] bg-[radial-gradient(circle_at_bottom_right,_rgba(29,78,216,0.16),_transparent_72%)]" />

            <div className="relative z-10 flex h-full flex-col px-10 py-8 md:px-14 md:py-10">
              <div className="flex items-start justify-between gap-8">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.45em] text-[#86652a]">RemLearners</p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-[0.12em] text-[#1e293b] [font-family:Georgia,'Times_New_Roman',serif] md:text-5xl">
                    CERTIFICATE
                  </h1>
                  <p className="mt-1 text-sm uppercase tracking-[0.55em] text-[#8b7355]">of Completion</p>
                </div>

                <div className="rounded-[22px] border border-[#d8c392] bg-white/80 px-5 py-4 text-center shadow-sm">
                  <ShieldCheck className="mx-auto h-8 w-8 text-[#1e3a8a]" />
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#8b7355]">Verification Code</p>
                  <p className="mt-2 text-sm font-bold tracking-[0.25em] text-[#1e293b]">{data.verification_code}</p>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-center text-center">
                <p className="text-[11px] uppercase tracking-[0.45em] text-[#8b7355]">This certifies that</p>
                <h2 className="mt-6 text-5xl font-semibold tracking-tight text-[#111827] [font-family:Georgia,'Times_New_Roman',serif] md:text-6xl">
                  {data.learner_name}
                </h2>
                <p className="mt-3 text-sm tracking-[0.12em] text-slate-500">{data.learner_email}</p>

                <p className="mx-auto mt-8 max-w-4xl text-lg leading-8 text-slate-600">
                  has successfully completed the RemLearners {data.scope_type} program requirements and passed the final evaluation for
                </p>

                <div className="mx-auto mt-8 max-w-5xl border-y border-[#d7c59d] px-8 py-6">
                  <p className="text-3xl font-semibold tracking-tight text-[#172554] [font-family:Georgia,'Times_New_Roman',serif] md:text-4xl">
                    {data.issued_for_title}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-[1.2fr_1fr_1.2fr] items-end gap-8">
                <div className="border-t border-[#23324a] pt-4">
                  <p className="text-sm font-semibold text-[#1e293b] [font-family:Georgia,'Times_New_Roman',serif]">RemLearners Certification Authority</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-500">Authorized Issuer</p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <BadgeCheck className="h-8 w-8 text-[#0f766e]" />
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#8b7355]">Digitally Verified Credential</p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Issue Date</p>
                  <p className="mt-2 text-lg font-semibold text-[#111827]">{new Date(data.issued_at).toLocaleDateString()}</p>
                  <p className="mt-3 text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Certificate ID</p>
                  <p className="mt-2 text-sm font-bold tracking-[0.24em] text-[#1e293b]">{data.certificate_code}</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-center border-t border-[#eadfbe] pt-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Valid certificate issued by RemLearners
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 landscape;
              margin: 0;
            }

            @media print {
              html, body {
                width: 297mm;
                height: 210mm;
                margin: 0;
                padding: 0;
                background: #fcf8ee !important;
              }

              .certificate-page {
                min-height: 210mm !important;
                padding: 0 !important;
                background: #fcf8ee !important;
              }

              .certificate-shell {
                max-width: none !important;
                width: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              .certificate-toolbar {
                display: none !important;
              }

              .certificate-card {
                border-radius: 0 !important;
                box-shadow: none !important;
              }

              .certificate-frame {
                width: 297mm !important;
                height: 210mm !important;
                aspect-ratio: auto !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            }
          `,
        }}
      />
    </div>
  );
}
