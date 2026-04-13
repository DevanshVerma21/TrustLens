import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Wifi, WifiOff, Activity, LogOut, ChevronDown } from 'lucide-react';
import TrustScoreCard     from './components/TrustScoreCard';
import TransactionList    from './components/TransactionList';
import FraudAlertPanel    from './components/FraudAlertPanel';
import ExplanationBox     from './components/ExplanationBox';
import TransactionForm    from './components/TransactionForm';
import LiveFraudToast     from './components/LiveFraudToast';
import LiveActivityFeed   from './components/LiveActivityFeed';
import AuthPage           from './components/AuthPage';
import { MAX_EVENTS }     from './components/LiveActivityFeed';
import { transactionAPI } from './services/api';
import authService, { tokenStore } from './services/authService';
import socketService      from './services/socketService';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEventId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
function timeNow() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  // ── Auth state ──────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser]     = useState(() => tokenStore.getUser());
  const [authLoading, setAuthLoading]     = useState(true);   // checking stored token

  // ── Dashboard state ─────────────────────────────────────────────────────────
  const [transactions, setTransactions]   = useState([]);
  const [trustScore, setTrustScore]       = useState(85);
  const [riskLevel, setRiskLevel]         = useState('low');
  const [selectedTx, setSelectedTx]       = useState(null);
  const [currentAlert, setCurrentAlert]   = useState(null);
  const [toastAlert, setToastAlert]       = useState(null);
  const [loading, setLoading]             = useState(false);
  const [isConnected, setIsConnected]     = useState(false);
  const [socketId, setSocketId]           = useState('');
  const [activityEvents, setActivityEvents] = useState([]);
  const [submitNotice, setSubmitNotice]   = useState(null);
  const [userMenuOpen, setUserMenuOpen]   = useState(false);

  // ── Push event to activity feed ─────────────────────────────────────────────
  const pushEvent = useCallback((type, message, extra = {}) => {
    setActivityEvents((prev) => {
      const ev = { id: makeEventId(), type, message, time: timeNow(), ...extra };
      return [ev, ...prev].slice(0, MAX_EVENTS);
    });
  }, []);

  // ── Auth: verify stored token on mount ──────────────────────────────────────
  useEffect(() => {
    const storedUser = tokenStore.getUser();
    const token      = tokenStore.getAccess();

    if (token && storedUser) {
      setCurrentUser(storedUser);
    }
    setAuthLoading(false);

    // Listen for forced logout (e.g., refresh token expired)
    const onForceLogout = () => handleLogout(false);
    window.addEventListener('auth:logout', onForceLogout);
    return () => window.removeEventListener('auth:logout', onForceLogout);
  }, []);

  // ── Init dashboard whenever user changes ─────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    loadTrustScore(currentUser.id);
    loadTransactions(currentUser.id);
    connectSocket(currentUser.id);

    return () => socketService.disconnect();
  }, [currentUser?.id]);

  // ── Socket ──────────────────────────────────────────────────────────────────
  const connectSocket = (userId) => {
    socketService.connect(userId, {
      onConnect: (id) => {
        setIsConnected(true);
        setSocketId(id || '');
        pushEvent('connect', 'WebSocket session established');
      },
      onDisconnect: (reason) => {
        setIsConnected(false);
        setSocketId('');
        pushEvent('disconnect', `Connection lost: ${reason}`);
      },
      onReconnect: (attempt) => {
        setIsConnected(true);
        pushEvent('connect', `Reconnected (attempt ${attempt})`);
      },
    });

    socketService.on('fraudFlagged', (data) => {
      console.log('🚨 Real-time fraud alert:', data);
      const payload = {
        fraudScore:   data.fraudScore,
        riskLevel:    data.riskLevel || 'High Risk',
        summary:      data.summary,
        explanations: data.explanations || [],
      };
      setCurrentAlert(payload);
      setToastAlert(payload);
      pushEvent(
        data.fraudScore > 0.8 ? 'fraud' : 'warning',
        data.summary || 'Suspicious transaction flagged',
        { amount: data.amount }
      );
      loadTransactions(currentUser?.id);
      loadTrustScore(currentUser?.id);
    });
  };

  // ── Data loaders ────────────────────────────────────────────────────────────
  const loadTransactions = async (userId) => {
    if (!userId) return;
    try {
      const res = await transactionAPI.getTransactions(userId, 10, 0);
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error('Load transactions error:', err.response?.data || err.message);
    }
  };

  const loadTrustScore = async (userId) => {
    if (!userId) return;
    try {
      const res = await transactionAPI.getTrustScore(userId);
      setTrustScore(res.data.trustScore);
      setRiskLevel(res.data.riskLevel);
    } catch (err) {
      console.error('Load trust score error:', err.response?.data || err.message);
    }
  };

  // ── Auth handlers ────────────────────────────────────────────────────────────
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setActivityEvents([]);
  };

  const handleLogout = async (callServer = true) => {
    setUserMenuOpen(false);
    if (callServer) await authService.logout();
    else tokenStore.clear();

    socketService.disconnect();
    setCurrentUser(null);
    setTransactions([]);
    setCurrentAlert(null);
    setToastAlert(null);
    setActivityEvents([]);
    setIsConnected(false);
  };

  // ── Transaction submit ───────────────────────────────────────────────────────
  const showNotice = (type, message) => {
    setSubmitNotice({ type, message });
    setTimeout(() => setSubmitNotice(null), 4000);
  };

  const handleSubmitTransaction = async (formData) => {
    setLoading(true);
    try {
      const transactionData = {
        amount:     parseFloat(formData.amount),
        location:   formData.location,
        deviceId:   formData.deviceName.toLowerCase().replace(/\s+/g, '-') || `device-${Date.now()}`,
        deviceName: formData.deviceName,
        category:   formData.category,
      };

      const response = await transactionAPI.submit(transactionData);
      const data     = response.data;

      const newTx = {
        _id:          data.transaction,
        ...transactionData,
        userId:       currentUser.id,
        fraudScore:   parseFloat(data.fraudScore),
        isFlagged:    data.isFlagged,
        explanations: data.explanations,
        status:       data.status,
        timestamp:    new Date(),
      };

      setTransactions((prev) => [newTx, ...prev]);
      setTrustScore(data.trustScore);
      setRiskLevel(data.riskLevel);

      // Update stored user trust info
      tokenStore.setUser({ ...currentUser, trustScore: data.trustScore, riskLevel: data.riskLevel });

      if (data.isFlagged) {
        const payload = {
          fraudScore:   parseFloat(data.fraudScore),
          riskLevel:    data.summary?.riskLevel || 'High Risk',
          summary:      data.summary?.summary   || '',
          explanations: data.explanations,
        };
        setCurrentAlert(payload);
        setToastAlert(payload);
        pushEvent('fraud', payload.summary, { amount: formData.amount });
        showNotice('error', '🚨 Transaction flagged as suspicious!');
      } else {
        setCurrentAlert(null);
        pushEvent('safe', `Transaction of ₹${Number(formData.amount).toLocaleString('en-IN')} cleared`, { amount: formData.amount });
        showNotice('success', '✅ Transaction submitted and cleared!');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      showNotice('error', '❌ Failed: ' + msg);
      console.error('Submit error:', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Auth loading splash ──────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="auth-root">
        <div className="flex flex-col items-center gap-4">
          <Shield className="w-10 h-10 text-blue-400 animate-pulse" />
          <p className="text-gray-500 text-sm font-mono">Initializing TrustLens…</p>
        </div>
      </div>
    );
  }

  // ── Auth gate ────────────────────────────────────────────────────────────────
  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // ── Main dashboard ───────────────────────────────────────────────────────────
  return (
    <div className="app-root min-h-screen">
      {/* Live Fraud Toast */}
      <LiveFraudToast alert={toastAlert} onDismiss={() => setToastAlert(null)} soundEnabled={true} />

      {/* Submit notice */}
      {submitNotice && (
        <div id="submit-notice" className={`submit-notice ${submitNotice.type === 'success' ? 'submit-notice-success' : 'submit-notice-error'}`}>
          {submitNotice.message}
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="header-logo">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">TrustLens</h1>
              <p className="text-xs text-gray-500 font-mono hidden sm:block">Explainable AI · Digital Banking</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Connection status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              {isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <Wifi     className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-mono hidden sm:block">LIVE</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-gray-600" />
                  <WifiOff  className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500 font-mono hidden sm:block">OFFLINE</span>
                </>
              )}
            </div>

            {/* Event counter */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-blue-400 font-mono">{activityEvents.length} events</span>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                id="user-menu-btn"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500/30 border border-blue-500/50 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-300">
                    {(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-gray-300 font-mono hidden sm:block max-w-[120px] truncate">
                  {currentUser.name || currentUser.email}
                </span>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#13161e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-xs text-gray-500 font-mono">Signed in as</p>
                    <p className="text-sm text-gray-200 truncate mt-0.5">{currentUser.email}</p>
                  </div>
                  <button
                    id="logout-btn"
                    onClick={() => handleLogout(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Col 1 */}
          <div className="lg:col-span-1 space-y-6">
            <TransactionForm onSubmit={handleSubmitTransaction} loading={loading} />
            <TrustScoreCard  trustScore={trustScore} riskLevel={riskLevel} />
            <LiveActivityFeed events={activityEvents} isConnected={isConnected} socketId={socketId} />
          </div>

          {/* Col 2 */}
          <div className="lg:col-span-1 space-y-6">
            <FraudAlertPanel alert={currentAlert} onDismiss={() => setCurrentAlert(null)} />
            <ExplanationBox  transaction={selectedTx} loading={loading} />
          </div>

          {/* Col 3-4 */}
          <div className="lg:col-span-2">
            <TransactionList
              transactions={transactions}
              onTransactionClick={(tx) => { setSelectedTx(tx); setCurrentAlert(null); }}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 mt-12 py-6 border-t border-white/5">
        <p className="text-center text-xs text-gray-600 font-mono">
          © 2024 TrustLens · Real-time AI Fraud Detection · Secured with JWT & bcrypt
        </p>
      </footer>
    </div>
  );
}

export default App;
