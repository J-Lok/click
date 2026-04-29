import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useToast } from '../../shared/components/ToastProvider';
import { getApiErrorMessage } from '../../lib/apiError';
import { KeyRound, Phone, ShieldCheck } from 'lucide-react';

type Step = 'phone' | 'otp' | 'password';

const phoneRegex = /^\+237[0-9]{9}$/;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const addToast = useToast();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('+237');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // ── Étape 1 — Envoi de l'OTP ────────────────────────────────────────────

  const startCountdown = () => {
    setCountdown(300);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.replace(/\s/g, '');
    if (!phoneRegex.test(trimmed)) {
      setPhoneError('Numéro invalide. Format : +237XXXXXXXXX');
      return;
    }
    setPhoneError('');
    setLoading(true);
    try {
      await authApi.forgotPasswordRequest(trimmed);
      // Response is always 200 to avoid enumeration — just advance
      setPhone(trimmed);
      setStep('otp');
      startCountdown();
      addToast('Code envoyé par SMS si ce numéro est enregistré.', 'info');
    } catch (err) {
      addToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await authApi.forgotPasswordRequest(phone);
      startCountdown();
      addToast('Nouveau code envoyé.', 'info');
    } catch (err) {
      addToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Étape 2 — Vérification OTP ──────────────────────────────────────────

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setOtpError('Le code doit contenir exactement 6 chiffres.');
      return;
    }
    setOtpError('');
    setStep('password');
  };

  // ── Étape 3 — Nouveau mot de passe ──────────────────────────────────────

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }
    setPasswordError('');
    setLoading(true);
    try {
      await authApi.forgotPasswordReset(phone, otp, newPassword);
      addToast('Mot de passe réinitialisé. Vous pouvez vous connecter.', 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      const msg = getApiErrorMessage(err);
      if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('code')) {
        setStep('otp');
        setOtp('');
        setOtpError(msg);
      } else {
        setPasswordError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const steps: { key: Step; label: string; icon: typeof Phone }[] = [
    { key: 'phone', label: 'Numéro', icon: Phone },
    { key: 'otp', label: 'Code', icon: ShieldCheck },
    { key: 'password', label: 'Mot de passe', icon: KeyRound },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="card w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Mot de passe oublié</h1>
          <p className="text-sm text-slate-400 mt-1">
            Réinitialisez votre mot de passe via SMS
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      done
                        ? 'bg-emerald-600 text-white'
                        : active
                        ? 'bg-emerald-600/20 border-2 border-emerald-500 text-emerald-400'
                        : 'bg-slate-700 text-slate-500'
                    }`}
                  >
                    {done ? '✓' : <Icon size={16} />}
                  </div>
                  <span
                    className={`text-xs ${
                      active ? 'text-emerald-400 font-medium' : done ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mb-5 ${done ? 'bg-emerald-600' : 'bg-slate-700'}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Step 1: Phone ── */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <p className="text-sm text-slate-400">
              Entrez le numéro de téléphone associé à votre compte. Nous vous enverrons un code de vérification par SMS.
            </p>
            <div>
              <label htmlFor="fp-phone" className="block text-sm font-medium text-slate-300 mb-1">
                Numéro de téléphone
              </label>
              <input
                id="fp-phone"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
                placeholder="+237690000000"
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                autoComplete="tel"
              />
              {phoneError && <p className="mt-1 text-sm text-red-400">{phoneError}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-50 font-medium transition-colors"
            >
              {loading ? 'Envoi en cours…' : 'Envoyer le code'}
            </button>
          </form>
        )}

        {/* ── Step 2: OTP ── */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <p className="text-sm text-slate-400">
              Entrez le code à 6 chiffres envoyé au <span className="text-white font-medium">{phone}</span>.
            </p>
            <div>
              <label htmlFor="fp-otp" className="block text-sm font-medium text-slate-300 mb-1">
                Code OTP
              </label>
              <input
                id="fp-otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(v);
                  setOtpError('');
                }}
                placeholder="123456"
                maxLength={6}
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-center text-xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                autoComplete="one-time-code"
              />
              {otpError && <p className="mt-1 text-sm text-red-400">{otpError}</p>}
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-50 font-medium transition-colors"
            >
              Vérifier le code
            </button>
            <div className="text-center text-sm text-slate-500">
              {countdown > 0 ? (
                <span>
                  Renvoyer dans{' '}
                  <span className="text-slate-300 font-medium">
                    {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                  </span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-emerald-400 hover:underline disabled:opacity-50"
                >
                  Renvoyer le code
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Changer de numéro
            </button>
          </form>
        )}

        {/* ── Step 3: New password ── */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <p className="text-sm text-slate-400">
              Choisissez un nouveau mot de passe pour votre compte.
            </p>
            <div>
              <label htmlFor="fp-pwd" className="block text-sm font-medium text-slate-300 mb-1">
                Nouveau mot de passe
              </label>
              <input
                id="fp-pwd"
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                placeholder="Min. 8 caractères"
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="fp-confirm" className="block text-sm font-medium text-slate-300 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                id="fp-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                placeholder="Répétez le mot de passe"
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                autoComplete="new-password"
              />
              {passwordError && <p className="mt-1 text-sm text-red-400">{passwordError}</p>}
            </div>
            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-50 font-medium transition-colors"
            >
              {loading ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500">
          <Link to="/login" className="text-emerald-400 hover:underline">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
