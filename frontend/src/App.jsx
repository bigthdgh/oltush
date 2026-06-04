import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trees, Shield, UserCircle, HelpCircle
} from 'lucide-react';
import { springSoft, navSpring, EASE_OUT_QUINT } from './animations';
import { useTelegram } from './hooks/useTelegram';
import { useIsAdmin } from './hooks/useIsAdmin';
import { ToastContainer, useToast } from './components/Toast';
import MapView from './components/MapView';
import ItemDetail from './components/ItemDetail';
import BookingWizard from './components/BookingWizard';
import Profile from './components/Profile';
import AdminPanel from './components/AdminPanel';
import FAQ from './components/FAQ';

const allNavItems = [
  { path: '/', label: 'Объекты', icon: Trees },
  { path: '/profile', label: 'Профиль', icon: UserCircle },
  { path: '/faq', label: 'Помощь', icon: HelpCircle },
  { path: '/admin', label: 'Админ', icon: Shield, adminOnly: true },
];

function Navigation({ isAdmin }) {
  const location = useLocation();
  const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="w-full max-w-[560px] safe-bottom">
        <div
          className="mx-3 mb-3 p-1.5 flex gap-1 relative bg-white/90"
          style={{
            backdropFilter: 'blur(32px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(32px) saturate(1.5)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '28px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/' && location.pathname.startsWith('/item')) ||
              (item.path === '/' && location.pathname.startsWith('/booking'));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-[20px] transition-all duration-300 min-h-[52px] justify-center active:scale-90 ${
                  isActive ? 'text-white' : 'text-warm-500 hover:text-warm-700'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-[20px]"
                    style={{
                      background: '#3d5a36',
                    }}
                    transition={navSpring}
                  />
                )}
                <Icon size={20} strokeWidth={2} className="relative z-10" />
                <span className="text-[10px] font-semibold relative z-10 tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function AnimatedHeader() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isHome) return null;

  return (
    <header className="sticky top-0 z-40">
      <motion.div
        initial={false}
        animate={scrolled ? { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' } : { boxShadow: '0 0 0 rgba(0,0,0,0)' }}
        className="bg-cream/90"
        style={{
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
        transition={{ duration: 0.45, ease: EASE_OUT_QUINT }}
      >
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center bg-moss-700"
            >
              <Trees size={20} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold text-ink tracking-tight leading-none">Олтуш</h1>
              <p className="text-[11px] font-medium mt-0.5 text-warm-500">
                База отдыха на природе
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-warm-400">
            Работаем круглый год
          </span>
        </div>
      </motion.div>
    </header>
  );
}

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -14, scale: 0.98 }}
      transition={{ duration: 0.45, ease: EASE_OUT_QUINT }}
    >
      {children}
    </motion.div>
  );
}

function AppRoutes({ isAdmin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isFullPage = location.pathname.startsWith('/item/') || location.pathname.startsWith('/booking/');

  useEffect(() => {
    if (location.pathname === '/admin' && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [location.pathname, isAdmin, navigate]);

  return (
    <main className="relative z-10 px-4 pt-4 min-h-screen">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><MapView /></PageTransition>} />
          <Route path="/item/:id" element={<PageTransition><ItemDetail /></PageTransition>} />
          <Route path="/booking/:itemId" element={<PageTransition><BookingWizard /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
          <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
          {isAdmin && <Route path="/admin" element={<PageTransition><AdminPanel /></PageTransition>} />}
        </Routes>
      </AnimatePresence>
    </main>
  );
}

function App() {
  const { tg } = useTelegram();
  const { toasts, dismissToast } = useToast();
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
    }
  }, [tg]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-cream relative">

        <AnimatedHeader />
        <AppRoutes isAdmin={isAdmin} />
        <Navigation isAdmin={isAdmin} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </BrowserRouter>
  );
}

export default App;
