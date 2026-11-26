import { useState } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  Lock,
  Mail,
  ShieldCheck,
  Sprout,
} from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useAuth } from '../../hooks/useAuth'

export default function Login() {
  const { login, isAuthenticated, loading: sessionLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  if (sessionLoading) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const soumettre = async (evenement) => {
    evenement.preventDefault()
    setErreur('')
    setEnvoi(true)

    try {
      await login({ email: email.trim(), password: motDePasse })
      const destination = location.state?.from?.pathname ?? '/dashboard'
      navigate(destination, { replace: true })
    } catch (e) {
      setErreur(
        e.response?.data?.message ??
          'Connexion impossible. Vérifiez que le backend est démarré.'
      )
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau de marque */}
      <div className="relative hidden overflow-hidden bg-brand-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">AgriSmart</p>
            <p className="text-xs text-brand-100">Smart Farm Management</p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-4xl font-bold leading-tight">
            Une gestion agricole plus claire, plus rapide, plus connectée.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-brand-100">
            Animaux, cultures, stocks, finances et équipes : retrouvez
            l'essentiel de votre exploitation dans une seule interface.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3">
            {[
              { icon: Sprout, label: 'Cultures & parcelles' },
              { icon: ShieldCheck, label: 'Accès sécurisé par rôle' },
            ].map(({ icon: Icone, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm backdrop-blur"
              >
                <Icone className="h-5 w-5 shrink-0 text-brand-200" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-brand-200">
          © {new Date().getFullYear()} AgriSmart — tous droits réservés.
        </p>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center bg-slate-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900">AgriSmart</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Connexion
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Accédez à votre espace de gestion agricole.
            </p>

            {erreur && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {erreur}
              </div>
            )}

            <form onSubmit={soumettre} className="mt-6 space-y-5" autoComplete="off">
              <Input
                label="Adresse e-mail"
                type="email"
                name="email"
                icon={Mail}
                placeholder="nom@exploitation.fr"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Mot de passe"
                type={afficherMotDePasse ? 'text' : 'password'}
                name="password"
                icon={Lock}
                placeholder="Votre mot de passe"
                autoComplete="off"
                required
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                droite={
                  <button
                    type="button"
                    onClick={() =>
                      setAfficherMotDePasse((visible) => !visible)
                    }
                    aria-label={
                      afficherMotDePasse
                        ? 'Masquer le mot de passe'
                        : 'Afficher le mot de passe'
                    }
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    {afficherMotDePasse ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />

              <Button type="submit" taille="lg" className="w-full" disabled={envoi}>
                {envoi ? 'Connexion en cours...' : 'Se connecter'}
                {!envoi && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <p className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-400">
              L'inscription n'est pas publique. Votre compte est créé par un
              administrateur AgriSmart.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
