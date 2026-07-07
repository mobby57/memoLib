'use client';

import { useState } from 'react';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import { PLANS } from './constants';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(password);
  const labels = ['', 'Faible', 'Moyen', 'Bon', 'Fort', 'Excellent'];
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= strength ? colors[strength] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs mt-1 ${strength >= 4 ? 'text-green-600' : strength >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
        {labels[strength]}
      </p>
    </div>
  );
}

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export function PasswordInput({ value, onChange, placeholder, id }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
}

interface PlanSelectorProps {
  plans?: typeof PLANS;
  selected: string;
  onSelect: (plan: 'SOLO' | 'CABINET' | 'ENTERPRISE') => void;
}

export function PlanSelector({ plans: plansOverride, selected, onSelect }: PlanSelectorProps) {
  const plansList = plansOverride || PLANS;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {plansList.map(plan => (
        <button
          type="button"
          key={plan.id}
          onClick={() => onSelect(plan.id)}
          className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-300 ${
            selected === plan.id
              ? 'border-blue-600 bg-blue-50/80 shadow-lg shadow-blue-100 scale-[1.02]'
              : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          {plan.recommended && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                ⭐ Recommandé
              </span>
            </div>
          )}
          <div className="text-2xl mb-2">{plan.icon}</div>
          <h4 className="font-bold text-gray-900 text-lg">{plan.name}</h4>
          <div className="mt-2">
            <span className="text-3xl font-bold text-blue-600">{plan.price}</span>
            <span className="text-sm text-gray-500">€{plan.period}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1 mb-3">{plan.description}</p>
          <ul className="space-y-1.5">
            {plan.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {selected === plan.id && (
            <div className="absolute top-3 right-3">
              <CheckCircle className="text-blue-600" size={24} />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

interface StepIndicatorProps {
  current?: number;
  currentStep?: number;
  total?: number;
  labels: string[];
}

export function StepIndicator({ current, currentStep, total, labels }: StepIndicatorProps) {
  const activeStep = currentStep ?? current ?? 1;
  const totalSteps = total ?? labels.length;
  return (
    <div className="flex items-center justify-between mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step < activeStep
                  ? 'bg-green-500 text-white'
                  : step === activeStep
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step < activeStep ? <CheckCircle size={20} /> : step}
            </div>
            <span className={`text-xs mt-1.5 font-medium ${
              step <= activeStep ? 'text-blue-600' : 'text-gray-400'
            }`}>
              {labels[step - 1]}
            </span>
          </div>
          {step < totalSteps && (
            <div className={`w-12 md:w-20 h-0.5 mx-2 transition-all duration-300 ${
              step < activeStep ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
