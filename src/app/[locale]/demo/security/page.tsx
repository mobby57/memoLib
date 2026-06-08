"use client"

import { useState, useEffect } from "react"
import { Shield, Lock, CheckCircle, Smartphone, Key, AlertTriangle, Fingerprint } from "lucide-react"

/**
 * Démo interactive du MFA — "effet wow" sécurité
 * Simule l'activation du 2FA avec un vrai timer qui tourne
 */
export default function DemoMFAPage() {
  const [step, setStep] = useState<"intro" | "setup" | "verify" | "done">("intro")
  const [code, setCode] = useState("")
  const [expectedCode, setExpectedCode] = useState("")
  const [timer, setTimer] = useState(30)
  const [error, setError] = useState("")

  // Générer un code simulé qui change toutes les 30s
  useEffect(() => {
    const generateCode = () => {
      const c = String(Math.floor(100000 + Math.random() * 900000))
      setExpectedCode(c)
    }
    generateCode()
    const interval = setInterval(() => {
      generateCode()
      setTimer(30)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Timer countdown
  useEffect(() => {
    const t = setInterval(() => setTimer(prev => (prev > 0 ? prev - 1 : 30)), 1000)
    return () => clearInterval(t)
  }, [])

  const handleVerify = () => {
    if (code === expectedCode) {
      setStep("done")
      setError("")
    } else {
      setError("Code invalide. Le bon code est affiché ci-dessous (en démo).")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {step === "intro" && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Sécurité niveau Amazon</h1>
            <p className="text-gray-600 mb-6">
              MemoLib utilise le même principe que <strong>Midway</strong> (Amazon) :
              authentification multi-facteurs obligatoire pour protéger les données juridiques sensibles.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <Feature icon={Lock} label="MFA obligatoire" />
              <Feature icon={Fingerprint} label="Passkeys / Biométrie" />
              <Feature icon={Key} label="Clé physique (YubiKey)" />
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Sans MFA</p>
                  <p className="text-xs text-red-700">Un mot de passe volé = accès à tous les dossiers clients, données RGPD, pièces confidentielles.</p>
                </div>
              </div>
            </div>

            <button onClick={() => setStep("setup")} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all">
              Activer la protection MFA →
            </button>
          </div>
        )}

        {step === "setup" && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Smartphone className="w-8 h-8 text-indigo-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Étape 1 : Scanner le QR Code</h2>
                <p className="text-sm text-gray-500">Avec Google Authenticator ou Microsoft Authenticator</p>
              </div>
            </div>

            {/* QR Code simulé */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 flex items-center justify-center mb-6">
              <div className="w-48 h-48 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center relative">
                <div className="absolute inset-4 grid grid-cols-7 grid-rows-7 gap-0.5">
                  {Array(49).fill(0).map((_, i) => (
                    <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? "bg-white" : "bg-transparent"}`} />
                  ))}
                </div>
                <div className="absolute bg-white rounded-md px-2 py-1">
                  <span className="text-[10px] font-bold text-indigo-600">MemoLib</span>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 mb-6">
              Secret : <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">DEMO-4709-CA1D-7BF8</code>
            </p>

            <button onClick={() => setStep("verify")} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl">
              J'ai scanné → Vérifier
            </button>
          </div>
        )}

        {step === "verify" && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-8 h-8 text-indigo-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Étape 2 : Entrez le code</h2>
                <p className="text-sm text-gray-500">Code à 6 chiffres de votre app authenticator</p>
              </div>
            </div>

            {/* Timer circulaire */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#4f46e5" strokeWidth="3" strokeDasharray={`${(timer / 30) * 97.4} 97.4`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-indigo-600">{timer}s</span>
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500">Code actuel (démo)</p>
                <p className="text-3xl font-mono font-bold text-gray-900 tracking-wider">{expectedCode.slice(0, 3)} {expectedCode.slice(3)}</p>
              </div>
            </div>

            {/* Input code */}
            <input
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              placeholder="000 000"
              maxLength={6}
              className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none mb-4"
            />

            {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

            <button
              onClick={handleVerify}
              disabled={code.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl disabled:opacity-40 transition-all"
            >
              Vérifier le code
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">Entrez le code affiché ci-dessus pour simuler la vérification</p>
          </div>
        )}

        {step === "done" && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Compte sécurisé ✓</h2>
            <p className="text-gray-600 mb-6">
              Votre compte est maintenant protégé par double authentification.
              Même si votre mot de passe est compromis, personne ne peut accéder aux dossiers sans votre téléphone.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left space-y-2">
              <SecurityCheck label="Authentification à 2 facteurs" />
              <SecurityCheck label="Session expire après 30 min d'inactivité" />
              <SecurityCheck label="Actions sensibles = re-vérification" />
              <SecurityCheck label="Détection brute force automatique" />
              <SecurityCheck label="Audit trail de chaque connexion" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setStep("intro"); setCode(""); }} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">
                Recommencer
              </button>
              <a href="/demo/complete" className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl text-center">
                Continuer la démo →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Feature({ icon: Icon, label }: { icon: typeof Shield; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-indigo-50">
      <Icon className="w-6 h-6 text-indigo-600" />
      <span className="text-xs font-medium text-indigo-800 text-center">{label}</span>
    </div>
  )
}

function SecurityCheck({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
      <span className="text-sm text-green-800">{label}</span>
    </div>
  )
}
