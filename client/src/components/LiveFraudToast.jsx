import React, { useEffect, useRef, useState } from 'react';
import { AlertOctagon, X, ShieldAlert, Zap, Volume2, VolumeX } from 'lucide-react';

const SEVERITY_CONFIG = {
  critical: {
    gradient: 'from-red-900 via-red-800 to-rose-900',
    border: 'border-red-500',
    glow: '0 0 40px rgba(239,68,68,0.6), 0 0 80px rgba(239,68,68,0.2)',
    badge: 'bg-red-500',
    badgeText: '⚠ CRITICAL',
    icon: <AlertOctagon className="w-10 h-10 text-red-300" />,
    pulse: 'animate-pulse-red',
  },
  high: {
    gradient: 'from-orange-900 via-orange-800 to-amber-900',
    border: 'border-orange-500',
    glow: '0 0 40px rgba(249,115,22,0.6), 0 0 80px rgba(249,115,22,0.2)',
    badge: 'bg-orange-500',
    badgeText: '⚡ HIGH RISK',
    icon: <ShieldAlert className="w-10 h-10 text-orange-300" />,
    pulse: 'animate-pulse-orange',
  },
  medium: {
    gradient: 'from-yellow-900 via-yellow-800 to-amber-900',
    border: 'border-yellow-500',
    glow: '0 0 40px rgba(234,179,8,0.4), 0 0 80px rgba(234,179,8,0.15)',
    badge: 'bg-yellow-500',
    badgeText: '⚡ MEDIUM RISK',
    icon: <Zap className="w-10 h-10 text-yellow-300" />,
    pulse: 'animate-pulse-yellow',
  },
};

function getSeverityKey(riskLevel, fraudScore) {
  if (fraudScore > 0.8 || (riskLevel && riskLevel.toLowerCase().includes('critical'))) return 'critical';
  if (fraudScore > 0.6 || (riskLevel && riskLevel.toLowerCase().includes('high'))) return 'high';
  return 'medium';
}

// Web Audio API beep sound
function playAlertSound(severity) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const freqs = severity === 'critical' ? [880, 660, 880] : severity === 'high' ? [660, 440] : [440];
    let time = ctx.currentTime;

    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.start(time);
      osc.stop(time + 0.35);
      time += 0.35;
    });

    ctx.close();
  } catch (e) {
    console.warn('Audio not available:', e);
  }
}

const LiveFraudToast = ({ alert, onDismiss, soundEnabled = true }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isMuted, setIsMuted] = useState(!soundEnabled);
  const timeoutRef = useRef(null);

  const severityKey = alert ? getSeverityKey(alert.riskLevel, alert.fraudScore) : 'medium';
  const config = SEVERITY_CONFIG[severityKey] || SEVERITY_CONFIG.high;

  useEffect(() => {
    if (alert) {
      setIsExiting(false);
      if (!isMuted) playAlertSound(severityKey);

      // Auto-dismiss after 12 seconds
      timeoutRef.current = setTimeout(() => handleDismiss(), 12000);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [alert]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onDismiss) onDismiss();
      setIsExiting(false);
    }, 400);
  };

  if (!alert) return null;

  const scorePercent = (alert.fraudScore * 100).toFixed(1);

  return (
    <div
      id="live-fraud-toast"
      className={`live-toast-wrapper ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`live-toast-card bg-gradient-to-br ${config.gradient} ${config.border} border`}
        style={{ boxShadow: config.glow }}
      >
        {/* Animated background grid */}
        <div className="toast-grid-overlay" />

        {/* Pulsing ring */}
        <div className="toast-pulse-ring" />

        {/* Top bar */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className={`toast-badge ${config.badge} text-white text-xs font-bold px-3 py-1 rounded-full`}>
              {config.badgeText}
            </span>
            <span className="text-xs text-white/50 font-mono">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="toast-mute-btn"
              onClick={() => setIsMuted((m) => !m)}
              className="text-white/40 hover:text-white/80 transition-colors"
              title={isMuted ? 'Unmute alerts' : 'Mute alerts'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              id="toast-dismiss-btn"
              onClick={handleDismiss}
              className="text-white/40 hover:text-white/80 transition-colors"
              title="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex items-start gap-4 relative z-10">
          <div className="toast-icon-wrapper flex-shrink-0">
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-lg leading-tight">
              Suspicious Transaction Detected
            </p>
            <p className="text-white/70 text-sm mt-1 leading-relaxed">
              {alert.summary || 'This transaction has been flagged for review by the AI engine.'}
            </p>

            {/* Fraud Score Bar */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-white/60 uppercase tracking-wider font-mono">Fraud Score</span>
                <span className={`text-sm font-bold font-mono ${
                  alert.fraudScore > 0.8 ? 'text-red-300' : 'text-orange-300'
                }`}>
                  {scorePercent}%
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full toast-score-bar"
                  style={{
                    width: `${scorePercent}%`,
                    background: alert.fraudScore > 0.8
                      ? 'linear-gradient(90deg, #f87171, #ef4444)'
                      : 'linear-gradient(90deg, #fb923c, #f97316)',
                  }}
                />
              </div>
            </div>

            {/* Risk Factors */}
            {alert.explanations && alert.explanations.length > 0 && (
              <div className="mt-4 space-y-1">
                <p className="text-xs text-white/50 uppercase tracking-wider font-mono mb-2">Risk Factors</p>
                {alert.explanations.slice(0, 3).map((reason, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-white/70">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">▸</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom dismiss progress bar */}
        <div className="mt-4 h-0.5 bg-white/10 relative z-10 overflow-hidden rounded-full">
          <div className="toast-progress-bar bg-white/30 h-full rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default LiveFraudToast;
