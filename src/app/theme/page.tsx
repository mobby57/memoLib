'use client';

import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/forms/Button';
import { LayoutDashboard, Palette, Code } from 'lucide-react';
import Link from 'next/link';

export default function ThemeDemo() {
  const { colors } = useTheme();

  const colorGroups = [
    {
      name: 'Couleurs principales',
      colors: [
        { name: 'Iris 100', value: colors['iris-100'] },
        { name: 'Iris 80', value: colors['iris-80'] },
        { name: 'Iris 60', value: colors['iris-60'] },
        { name: 'Fuschia 100', value: colors['fuschia-100'] },
        { name: 'Fuschia 80', value: colors['fuschia-80'] },
      ]
    },
    {
      name: 'Interface',
      colors: [
        { name: 'Background', value: colors.background },
        { name: 'Button', value: colors.button },
        { name: 'Icon', value: colors.icon },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Palette size={32} />
            Systeme de Design Tokens
          </h1>
          <p className="text-gray-600">
            Couleurs et styles extraits depuis Figma et integres dans l'application
          </p>

          <div className="mt-6 flex gap-4">
            <Link href="/icons">
              <Button variant="outline">
                <LayoutDashboard className="mr-2" size={18} />
                Voir les icones
              </Button>
            </Link>
            <Button variant="primary">
              <Code className="mr-2" size={18} />
              Utiliser dans le code
            </Button>
          </div>
        </div>

        {/* Couleurs */}
        {colorGroups.map((group) => (
          <div key={group.name} className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {group.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {group.colors.map((color) => (
                <div
                  key={color.name}
                  className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(color.value);
                  }}
                >
                  <div
                    className="w-20 h-20 rounded-lg shadow-md mb-3 border border-gray-200"
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="text-sm font-medium text-gray-900 text-center">
                    {color.name}
                  </span>
                  <span className="text-xs text-gray-500 mt-1 font-mono">
                    {color.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Variables CSS */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Variables CSS disponibles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Couleurs</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm font-mono">
                <div>var(--color-iris-100)</div>
                <div>var(--color-fuschia-100)</div>
                <div>var(--color-background)</div>
                <div>var(--color-button)</div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Exemple d'utilisation</h3>
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
{`.my-button {
  background-color: var(--color-button);
  color: white;
}

.my-card {
  background: var(--color-background);
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* TypeScript */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Utilisation TypeScript
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Importer les tokens</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { colors, typography } from '@/styles/tokens/tokens';`}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Utiliser dans vos composants</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`export function MyComponent() {
  return (
    <div style={{ 
      backgroundColor: colors['iris-100'],
      color: 'white',
      padding: '1rem'
    }}>
      Hello World
    </div>
  );
}`}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Type-safe</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`// Les types sont generes automatiquement
type ColorToken = keyof typeof colors;
// 'iris-100' | 'fuschia-100' | 'background' | ...

const myColor: ColorToken = 'iris-100'; // 
const invalid: ColorToken = 'invalid'; //  Erreur TypeScript`}
              </pre>
            </div>
          </div>
        </div>

        {/* Synchronisation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            [emoji] Synchronisation Figma
          </h3>
          <p className="text-blue-700 mb-4">
            Pour mettre a jour les design tokens depuis Figma, executez :
          </p>
          <pre className="bg-white p-3 rounded border border-blue-200 text-sm">
            npm run figma:sync
          </pre>
        </div>
      </div>
    </div>
  );
}
