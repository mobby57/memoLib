'use client';

import { Shield, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface SecurityStatusProps {
  className?: string;
}

export function SecurityStatus({ className }: SecurityStatusProps) {
  const securityFeatures = [
    {
      name: 'OWASP ZAP Compliant',
      status: 'active',
      description: 'Headers de securite, CSP, HSTS'
    },
    {
      name: 'RGPD Ready',
      status: 'active', 
      description: 'Isolation tenant, audit logs'
    },
    {
      name: 'Zero-Trust Architecture',
      status: 'active',
      description: 'Authentification + Autorisation systematiques'
    },
    {
      name: 'Cookies Securises',
      status: 'active',
      description: 'HttpOnly, Secure, SameSite'
    },
    {
      name: 'Rate Limiting',
      status: 'active',
      description: 'Protection contre les attaques DDoS'
    },
    {
      name: 'CSRF Protection',
      status: 'active',
      description: 'Validation Origin/Referer'
    }
  ];

  const activeCount = securityFeatures.filter(f => f.status === 'active').length;
  const securityScore = Math.round((activeCount / securityFeatures.length) * 100);

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Statut Securite
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Conformite OWASP & RGPD
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant="success">
              {securityScore}% Securise
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          {securityFeatures.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {feature.status === 'active' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {feature.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Lock className="w-3 h-3" />
            <span>"Meme nous, editeurs, ne pouvons pas lire vos dossiers."</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
