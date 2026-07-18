import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Building2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Member } from '../types';

interface LoginProps {
  members: Member[];
  onLoginSuccess: (member: Member) => void;
}

export default function Login({ members, onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccessLoading, setIsSuccessLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, ingresa el correo y la contraseña.');
      return;
    }

    const member = members.find(
      (m) => m.email.toLowerCase() === email.toLowerCase() && m.password === password
    );

    if (!member) {
      setError('Credenciales incorrectas o usuario inactivo.');
      return;
    }

    if (!member.active) {
      setError('Esta cuenta ha sido desactivada por el administrador.');
      return;
    }

    // Start premium animated loading sequence
    setIsSuccessLoading(true);
    
    // Stagger text steps to make the handshake feel secure and high-end
    setTimeout(() => setLoadingStep(1), 500);
    setTimeout(() => setLoadingStep(2), 1100);
    setTimeout(() => setLoadingStep(3), 1700);

    // Trigger success callback after 2.2s
    setTimeout(() => {
      onLoginSuccess(member);
    }, 2200);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 overflow-hidden relative" id="login-container">
      {/* Abstract Background Accents */}
      <motion.div 
        className="absolute w-[400px] h-[400px] rounded-full bg-blue-100/50 -top-20 -left-20 blur-3xl pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
      <motion.div 
        className="absolute w-[500px] h-[500px] rounded-full bg-indigo-100/40 -bottom-30 -right-20 blur-3xl pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
      />

      <motion.div 
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden flex flex-col md:max-w-2xl md:flex-row relative z-10"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, cubicBezier: [0.16, 1, 0.3, 1] }}
      >
        {/* Visual Brand Panel */}
        <motion.div 
          className="bg-gradient-to-tr from-blue-800 via-blue-700 to-indigo-800 text-white p-8 md:w-5/12 flex flex-col justify-between relative overflow-hidden" 
          id="brand-panel"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        >
          {/* Subtle glow effect on brand panel */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <motion.div 
              className="flex items-center gap-2 mb-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Building2 className="w-8 h-8 text-blue-100" />
              <span className="font-bold text-2xl tracking-tight">Mantai</span>
            </motion.div>
            <motion.p 
              className="text-blue-100 text-sm leading-relaxed mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              Sistema Inteligente de Gestión Financiera Corporativa.
            </motion.p>
          </div>
          <motion.div 
            className="text-xs text-blue-200 mt-8 md:mt-0 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.5 }}
          >
            &copy; 2026 Mantai S.A.
          </motion.div>
        </motion.div>

        {/* Login Form Panel */}
        <div className="p-8 flex-1 flex flex-col justify-center min-h-[360px]" id="form-panel">
          <AnimatePresence mode="wait">
            {isSuccessLoading ? (
              <motion.div 
                key="loading-screen"
                className="py-6 flex flex-col items-center text-center justify-center space-y-6"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, cubicBezier: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative">
                  {/* Glowing ring */}
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  
                  {/* Spinner & building icon */}
                  <div className="relative w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border-2 border-blue-500/10 shadow-inner">
                    <motion.div 
                      className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    />
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="space-y-3">
                  <motion.h3 
                    className="text-lg font-black text-gray-900 tracking-tight"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    ¡Acceso Autorizado!
                  </motion.h3>
                  
                  {/* Transition text steps */}
                  <div className="h-6 overflow-hidden relative w-64 mx-auto">
                    <AnimatePresence mode="wait">
                      {loadingStep === 0 && (
                        <motion.p
                          key="step0"
                          className="text-xs text-gray-400 font-semibold absolute left-0 right-0"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.25 }}
                        >
                          Verificando credenciales corporativas...
                        </motion.p>
                      )}
                      {loadingStep === 1 && (
                        <motion.p
                          key="step1"
                          className="text-xs text-blue-600 font-bold absolute left-0 right-0"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.25 }}
                        >
                          Estableciendo canal cifrado...
                        </motion.p>
                      )}
                      {loadingStep === 2 && (
                        <motion.p
                          key="step2"
                          className="text-xs text-emerald-600 font-extrabold absolute left-0 right-0"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.25 }}
                        >
                          Sincronizando flujos y balances...
                        </motion.p>
                      )}
                      {loadingStep === 3 && (
                        <motion.p
                          key="step3"
                          className="text-xs text-indigo-600 font-black absolute left-0 right-0"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.25 }}
                        >
                          Abriendo el Panel General...
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-56 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100 shadow-inner relative">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.1, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="login-form-fields"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Iniciar Sesión</h2>
                  <p className="text-sm text-gray-400 mt-1">Ingresa las credenciales corporativas para continuar.</p>
                </motion.div>

                {error && (
                  <motion.div 
                    className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded-xl flex items-start gap-2.5" 
                    id="login-error"
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-red-700 font-medium">{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ejemplo@mantai.com"
                        className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                        id="login-email-input"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Contraseña
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 text-sm bg-gray-50 border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                        id="login-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition"
                        id="login-password-toggle"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>

                  <motion.div
                    className="pt-2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  >
                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl transition duration-150 shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-500/50 cursor-pointer animate-pulse"
                      id="login-submit-btn"
                    >
                      Acceder al Sistema
                    </button>
                  </motion.div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
