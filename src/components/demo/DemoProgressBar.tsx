'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle, Circle, ArrowLeft } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Email entrant', href: '/demo/email-simulator' },
  { id: 2, label: 'Raisonnement', href: '/demo/workspace-reasoning' },
  { id: 3, label: 'Preuve légale', href: '/demo/legal-proof' },
];

export function DemoProgressBar() {
  const pathname = usePathname() || '/';
  const locale = pathname.split('/')[1];
  const currentIdx = STEPS.findIndex(s => pathname.includes(s.href.replace('/demo/', '')));

  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <Link
          href={`/${locale}/demo/complete`}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Parcours
        </Link>

        <div className="flex-1 flex items-center justify-center gap-2">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentIdx;
            const isActive = idx === currentIdx;
            return (
              <Link key={step.id} href={`/${locale}${step.href}`} className="flex items-center gap-1.5 group">
                {isDone ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className={`w-5 h-5 ${isActive ? 'text-indigo-600 fill-indigo-100' : 'text-gray-300'}`} />
                )}
                <span className={`text-sm font-medium ${isActive ? 'text-indigo-700' : isDone ? 'text-green-700' : 'text-gray-400'} group-hover:text-indigo-600`}>
                  {step.label}
                </span>
                {idx < STEPS.length - 1 && <div className={`w-8 h-0.5 mx-1 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </Link>
            );
          })}
        </div>

        <Link
          href={`/${locale}/auth/register?plan=PILOT`}
          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium shrink-0"
        >
          Essai gratuit
        </Link>
      </div>
    </div>
  );
}
