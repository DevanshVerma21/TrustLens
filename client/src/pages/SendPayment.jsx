import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Camera,
  CheckCircle2,
  Crosshair,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import jsQR from 'jsqr';
import { transactionAPI } from '../utils/api';
import useTrust from '../hooks/useTrust';
import { useCardBlock } from '../contexts/CardBlockContext';

const DEMO_CASES = {
  safe: {
    label: 'Safe Transaction',
    amount: '180',
    recipient: 'safe@upi',
    location: 'New York, US',
    category: 'shopping',
    sourceType: 'known-contact',
  },
  fraudulentUpi: {
    label: 'Fraudulent UPI',
    amount: '950',
    recipient: 'fraudster@upi',
    location: 'Unknown IP',
    category: 'transfer',
    sourceType: 'unknown',
  },
  fakeLink: {
    label: 'Fake Link',
    amount: '420',
    recipient: 'http://secure-upi-check.com/pay?pa=lottery-claim@oksbi',
    location: 'London, UK',
    category: 'shopping',
    sourceType: 'unknown',
  },
};

const ANALYSIS_DEBOUNCE_MS = 350;

const getRiskVisuals = (status) => {
  if (status === 'BLOCKED') {
    return {
      ring: 'rgba(239, 68, 68, 0.45)',
      surface: 'linear-gradient(145deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))',
      meter: 'bg-red-500',
      badge: 'bg-red-500/20 text-red-300 border-red-400/35',
      icon: <ShieldAlert className="w-5 h-5 text-red-300" />,
      actionText: 'Blocked',
    };
  }

  if (status === 'WARNING') {
    return {
      ring: 'rgba(245, 158, 11, 0.45)',
      surface: 'linear-gradient(145deg, rgba(245,158,11,0.18), rgba(245,158,11,0.07))',
      meter: 'bg-amber-400',
      badge: 'bg-amber-400/20 text-amber-200 border-amber-300/35',
      icon: <AlertTriangle className="w-5 h-5 text-amber-200" />,
      actionText: 'Warning',
    };
  }

  return {
    ring: 'rgba(16, 185, 129, 0.45)',
    surface: 'linear-gradient(145deg, rgba(16,185,129,0.16), rgba(16,185,129,0.06))',
    meter: 'bg-emerald-400',
    badge: 'bg-emerald-400/20 text-emerald-200 border-emerald-300/35',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-200" />,
    actionText: 'Safe',
  };
};

const toMeterPercent = (score) => Math.max(4, Math.min(100, Math.round((Number(score) || 0) * 100)));

export default function SendPayment({ user }) {
  const { score, refetch: refetchTrust } = useTrust();
  const { isCardBlocked } = useCardBlock();

  const getDeviceName = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Mac')) return 'Mac';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('Linux')) return 'Linux PC';
    return 'Unknown Device';
  };

  /**
   * Known-bad UPI handles used by fraudsters (blocklist, NOT a whitelist).
   * Real UPI handles: @upi, @oksbi, @ybl, @paytm, @okaxis, @okhdfcbank,
   *   @icici, @hdfc, @ibl, @ucc, @apl, @axl, @pthdfc, @ptsbi, @axisb …
   */
  const SUSPICIOUS_UPI_PATTERNS = [
    'lottery', 'prize', 'winner', 'lucky', 'refund-claim',
    'free-money', 'covid', 'subsidy-gov', 'rbi-india',
  ];

  // Valid UPI ID format: <identifier>@<handle>  (e.g. 9876543210@ucc, name@oksbi)
  const isValidUpiFormat = (str) => /^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$/.test(str);

  const [formData, setFormData] = useState({
    amount: '',
    recipient: '',
    payeeName: '',
    location: 'New York, US',
    deviceName: getDeviceName(),
    category: 'shopping',
    sourceType: 'unknown',
  });

  // qrData holds the decoded UPI fields straight from the QR code
  const [qrData, setQrData] = useState(null); // { pa, pn, am }

  // upiLookup: result from the resolve-upi API for manually typed UPI IDs
  // { loading, found, name, trustScore, source, message } | null
  const [upiLookup, setUpiLookup] = useState(null);

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [allowWarningProceed, setAllowWarningProceed] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [cameraScanning, setCameraScanning] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const cameraRafRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // ── Mismatch / suspicious UPI detection ──────────────────────────────────
  // Resolved name comes from QR scan OR from the live UPI lookup API
  const resolvedPayeeName = qrData?.pn || upiLookup?.name || null;

  const nameMismatch = useMemo(() => {
    if (!resolvedPayeeName || !formData.payeeName.trim()) return false;
    return resolvedPayeeName.trim().toLowerCase() !== formData.payeeName.trim().toLowerCase();
  }, [resolvedPayeeName, formData.payeeName]);

  const amountMismatch = useMemo(() => {
    if (!qrData?.am || !formData.amount) return false;
    return Math.abs(Number(qrData.am) - Number(formData.amount)) > 0.01;
  }, [qrData, formData.amount]);

  // Block payment if there's a name or amount mismatch (from QR or from lookup)
  const hasNameMismatch = nameMismatch && (!!qrData || !!upiLookup?.found);
  const hasQrMismatch = hasNameMismatch || (amountMismatch && !!qrData);

  // upiAnalysis: null | 'suspicious' | 'malformed' | 'no-qr' | 'ok'
  const upiAnalysis = useMemo(() => {
    const raw = formData.recipient.trim();
    if (!raw || raw.startsWith('http')) return null; // links handled by backend
    if (!raw.includes('@')) return null;             // not a UPI ID

    const lower = raw.toLowerCase();

    // Clearly malformed
    if (!isValidUpiFormat(raw)) return 'malformed';

    // Contains known fraud keywords
    if (SUSPICIOUS_UPI_PATTERNS.some((p) => lower.includes(p))) return 'suspicious';

    // Valid UPI, but user typed it manually (no QR scanned) — soft nudge only
    if (!qrData) return 'no-qr';

    return 'ok';
  }, [formData.recipient, qrData]);



  const categories = ['shopping', 'food', 'transport', 'bills', 'entertainment', 'transfer'];
  const commonLocations = ['New York, US', 'London, UK', 'Tokyo, JP', 'Lagos, NG', 'Unknown IP'];

  const userId = user?.id || user?._id;
  const deviceId = useMemo(
    () => String(formData.deviceName || 'device').toLowerCase().replace(/\s+/g, '-'),
    [formData.deviceName]
  );

  const pushToast = (title, description, severity = 'medium') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, title, description, severity }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3600);
  };

  const canAnalyze = Number(formData.amount) > 0 && formData.recipient.trim() && userId;

  // ── Debounced UPI ID name resolution ──────────────────────────────────
  useEffect(() => {
    const raw = formData.recipient.trim();
    // Only resolve UPI IDs (has @), not URLs
    if (!raw || !raw.includes('@') || raw.startsWith('http') || qrData) {
      setUpiLookup(null);
      return;
    }

    setUpiLookup((prev) => ({ ...prev, loading: true }));
    const timer = window.setTimeout(async () => {
      try {
        const result = await transactionAPI.resolveUpi(raw);
        setUpiLookup({ loading: false, ...result });

        if (result.found && result.name) {
          // Auto-fill payee name if user hasn't typed one yet
          setFormData((prev) => ({
            ...prev,
            payeeName: prev.payeeName.trim() ? prev.payeeName : result.name,
          }));
          pushToast('Payee identified', `Registered name: ${result.name}`, 'low');
        }
      } catch {
        setUpiLookup({ loading: false, found: false, name: null });
      }
    }, 600);

    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.recipient, qrData]);


  useEffect(() => {
    if (!canAnalyze) {
      setAnalysis(null);
      setAllowWarningProceed(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setAnalyzing(true);
      try {
        const response = await transactionAPI.analyze({
          userId,
          amount: Number(formData.amount),
          recipient: formData.recipient.trim(),
          location: formData.location,
          deviceId,
          deviceName: formData.deviceName,
          category: formData.category,
          time: new Date().toISOString(),
          sourceContext: {
            sourceType: formData.sourceType,
          },
        });

        setAnalysis(response);

        if (response.status === 'BLOCKED') {
          setAllowWarningProceed(false);
          pushToast('Suspicious transaction detected', 'This payment has been blocked for your safety.', 'high');
        } else if (response.status === 'WARNING') {
          setAllowWarningProceed(false);
          pushToast('Risk warning', 'Review details before proceeding.', 'medium');
        } else {
          setAllowWarningProceed(false);
        }
      } catch (error) {
        setAnalysis(null);
      } finally {
        setAnalyzing(false);
      }
    }, ANALYSIS_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [canAnalyze, formData.amount, formData.category, formData.deviceName, formData.location, formData.recipient, formData.sourceType, userId, deviceId]);

  const riskVisuals = getRiskVisuals(analysis?.status);
  const canSubmit = !loading && !isCardBlocked && canAnalyze;
  const isBlockedByRisk = analysis?.status === 'BLOCKED';
  const needsWarningOverride = analysis?.status === 'WARNING' && !allowWarningProceed;
  const submitDisabled = !canSubmit || isBlockedByRisk || needsWarningOverride;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setResult(null);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleScanQr = () => {
    fileInputRef.current?.click();
  };

  const normalizeQrPayload = (rawText) => {
    const text = String(rawText || '').trim();
    if (!text) return { upiId: '', qrFields: null };
    if (/^upi:\/\//i.test(text)) {
      try {
        const parsed = new URL(text);
        const pa = parsed.searchParams.get('pa') || parsed.searchParams.get('upi') || '';
        const pn = parsed.searchParams.get('pn') || '';
        const am = parsed.searchParams.get('am') || '';
        return { upiId: pa || text, qrFields: { pa, pn, am } };
      } catch {
        return { upiId: text, qrFields: null };
      }
    }
    return { upiId: text, qrFields: null };
  };

  const decodeQrImageFile = async (file) => {
    if (!file) return null;

    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = objectUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      return decoded?.data || null;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const applyQrDecodedValue = (decodedText) => {
    const { upiId, qrFields } = normalizeQrPayload(decodedText);
    if (!upiId) {
      pushToast('Scan failed', 'No readable UPI/link found in QR payload.', 'high');
      return;
    }

    setResult(null);
    setQrData(qrFields); // store full decoded fields
    setFormData((prev) => ({
      ...prev,
      recipient: upiId,
      // Auto-fill payee name from QR if user hasn't typed one yet
      payeeName: prev.payeeName.trim() ? prev.payeeName : (qrFields?.pn || ''),
      // Auto-fill amount from QR only if blank
      amount: prev.amount.trim() ? prev.amount : (qrFields?.am || ''),
    }));

    const details = [];
    if (qrFields?.pn) details.push(`Name: ${qrFields.pn}`);
    if (qrFields?.am) details.push(`Amount: ₹${qrFields.am}`);
    pushToast('QR decoded', details.length ? details.join(' · ') : 'Recipient populated from QR.', 'low');
  };

  const handleQrUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const decodedText = await decodeQrImageFile(file);
      if (!decodedText) {
        pushToast('Unable to decode QR', 'Try a clearer QR image.', 'high');
        return;
      }
      applyQrDecodedValue(decodedText);
    } catch {
      pushToast('QR upload failed', 'Could not read the uploaded QR image.', 'high');
    } finally {
      event.target.value = '';
    }
  };

  const stopCameraScan = () => {
    setCameraScanning(false);
    if (cameraRafRef.current) {
      window.cancelAnimationFrame(cameraRafRef.current);
      cameraRafRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCameraScan = async () => {
    if (cameraScanning) {
      stopCameraScan();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      pushToast('Camera not supported', 'Use Upload QR to decode from image.', 'medium');
      return;
    }

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      mediaStreamRef.current = stream;
      setCameraScanning(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      pushToast('Scanner started', 'Point your camera at a QR code.', 'low');

      const scanFrame = () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          cameraRafRef.current = window.requestAnimationFrame(scanFrame);
          return;
        }

        const width = video.videoWidth;
        const height = video.videoHeight;
        if (!width || !height) {
          cameraRafRef.current = window.requestAnimationFrame(scanFrame);
          return;
        }

        if (!cameraCanvasRef.current) {
          cameraCanvasRef.current = document.createElement('canvas');
        }
        const canvas = cameraCanvasRef.current;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          cameraRafRef.current = window.requestAnimationFrame(scanFrame);
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const decoded = jsQR(imageData.data, width, height, {
          inversionAttempts: 'attemptBoth',
        });

        if (decoded?.data) {
          applyQrDecodedValue(decoded.data);
          stopCameraScan();
          return;
        }

        cameraRafRef.current = window.requestAnimationFrame(scanFrame);
      };

      cameraRafRef.current = window.requestAnimationFrame(scanFrame);
    } catch {
      stopCameraScan();
      pushToast('Camera access denied', 'Allow camera access or upload a QR image.', 'high');
    }
  };

  const applyDemoCase = (caseKey) => {
    const preset = DEMO_CASES[caseKey];
    if (!preset) return;
    setResult(null);
    setAllowWarningProceed(false);
    setFormData((prev) => ({
      ...prev,
      amount: preset.amount,
      recipient: preset.recipient,
      location: preset.location,
      category: preset.category,
      sourceType: preset.sourceType || 'unknown',
    }));
  };

  const handleProceedAnyway = () => {
    setAllowWarningProceed(true);
    pushToast('Proceeding with caution', 'You can now submit this payment.', 'medium');
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (submitDisabled) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await transactionAPI.submit({
        userId,
        amount: Number(formData.amount),
        recipient: formData.recipient.trim(),
        location: formData.location,
        deviceName: formData.deviceName,
        deviceId,
        category: formData.category,
        time: new Date().toISOString(),
        sourceContext: {
          sourceType: formData.sourceType,
        },
      });

      setResult(response);

      if (response.status === 'BLOCKED') {
        pushToast('Payment blocked', 'High-risk transaction prevented.', 'high');
      } else if (response.status === 'WARNING') {
        pushToast('Payment sent with warning', 'Risk signals were detected for this recipient.', 'medium');
      } else {
        pushToast('Payment sent safely', 'No major risk signals found.', 'low');
      }

      refetchTrust();
      setAllowWarningProceed(false);
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Unable to process payment.';
      pushToast('Payment failed', msg, 'high');
      setResult({ error: msg });
    } finally {
      setLoading(false);
    }
  };

  const toastClasses = {
    high: 'border-red-400/40 bg-red-500/15 text-red-100',
    medium: 'border-amber-400/40 bg-amber-500/15 text-amber-100',
    low: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  };

  const confidenceScore = Number(analysis?.link?.zeroDay?.confidenceScore || 0.5);
  const confidencePct = Math.max(3, Math.min(100, Math.round(confidenceScore * 100)));
  const confidenceLevel = analysis?.confidence_level || analysis?.confidenceLevel || analysis?.link?.zeroDay?.confidenceLevel || 'MEDIUM';
  const isUnknownLink = analysis?.overall_status === 'UNVERIFIED' || analysis?.overallStatus === 'UNVERIFIED' || analysis?.link?.zeroDay?.status === 'UNVERIFIED';
  const payeeTrustScore = Number(analysis?.payee_trust_score ?? analysis?.payeeTrust?.payeeTrustScore ?? 50);
  const payeeTrustLevel = analysis?.payee_trust_level || analysis?.payeeTrust?.payeeTrustLevel || 'CAUTION';
  const payeeTrustPct = Math.max(3, Math.min(100, Math.round(payeeTrustScore)));

  const getPayeeTrustVisual = (level) => {
    if (level === 'HIGH_TRUST') {
      return {
        label: 'High Trust',
        tone: 'text-emerald-200',
        bar: 'bg-emerald-400',
      };
    }
    if (level === 'LOW_TRUST') {
      return {
        label: 'Low Trust',
        tone: 'text-red-200',
        bar: 'bg-red-400',
      };
    }
    return {
      label: 'Caution',
      tone: 'text-amber-200',
      bar: 'bg-amber-300',
    };
  };

  const payeeTrustVisual = getPayeeTrustVisual(payeeTrustLevel);

  useEffect(() => {
    return () => {
      stopCameraScan();
    };
  }, []);

  useEffect(() => {
    const bindStreamToVideo = async () => {
      if (!cameraScanning || !videoRef.current || !mediaStreamRef.current) {
        return;
      }

      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
      }

      try {
        await videoRef.current.play();
      } catch {
        // If autoplay is blocked, user can tap scan button again.
      }
    };

    bindStreamToVideo();
  }, [cameraScanning]);

  return (
    <div className="space-y-6">
      <div className="fixed right-5 top-24 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-[260px] max-w-sm rounded-xl border px-4 py-3 shadow-xl animate-slide-down ${toastClasses[toast.severity]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                <p className="text-xs opacity-90 mt-0.5">{toast.description}</p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
                className="opacity-80 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Send Payment</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time fraud AI with link scanning and community intelligence.
          </p>
        </div>

        <div className="rounded-xl border px-4 py-2 shadow-sm" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <div className="text-xs text-slate-400">Current Trust Score</div>
          <div className={`text-2xl font-bold ${score?.score >= 75 ? 'text-green-400' : score?.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
            {score?.score || 0}/100
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => applyDemoCase('safe')}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-400/35 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20"
        >
          Demo: Safe Transaction
        </button>
        <button
          type="button"
          onClick={() => applyDemoCase('fraudulentUpi')}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-red-400/35 text-red-200 bg-red-500/10 hover:bg-red-500/20"
        >
          Demo: Fraudulent UPI
        </button>
        <button
          type="button"
          onClick={() => applyDemoCase('fakeLink')}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-amber-400/35 text-amber-200 bg-amber-500/10 hover:bg-amber-500/20"
        >
          Demo: Fake Link
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleSubmitPayment}
          className="rounded-2xl p-6 border shadow-lg"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
            borderColor: 'var(--color-border)',
            boxShadow: '10px 10px 24px rgba(0,0,0,0.35), -8px -8px 18px rgba(255,255,255,0.02)',
          }}
        >
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Payment Details</h2>

          {/* ── QR Mismatch Alerts ───────────────────────────────────────── */}
          {qrData && (
            <div className="space-y-2 mb-2">
              {nameMismatch && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-400/50 bg-red-500/15 px-3.5 py-2.5">
                  <ShieldAlert className="w-4 h-4 text-red-300 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-200">⚠ Payee Name Mismatch</p>
                    <p className="text-[11px] text-red-100/80 mt-0.5">
                      QR says <span className="font-bold">&quot;{qrData.pn}&quot;</span> but you entered <span className="font-bold">&quot;{formData.payeeName}&quot;</span>. This payment may be fraudulent.
                    </p>
                  </div>
                </div>
              )}
              {amountMismatch && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-400/50 bg-red-500/15 px-3.5 py-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-300 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-200">⚠ Amount Mismatch</p>
                    <p className="text-[11px] text-red-100/80 mt-0.5">
                      QR encodes <span className="font-bold">₹{qrData.am}</span> but you entered <span className="font-bold">₹{formData.amount}</span>. Do not pay a different amount than requested.
                    </p>
                  </div>
                </div>
              )}
              {!nameMismatch && !amountMismatch && qrData.pn && (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/40 bg-emerald-500/12 px-3.5 py-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <p className="text-xs text-emerald-200 font-medium">QR data matches — name and amount verified ✓</p>
                </div>
              )}
            </div>
          )}

          {/* Malformed UPI — hard block */}
          {upiAnalysis === 'malformed' && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-400/50 bg-red-500/15 px-3.5 py-2.5 mb-2">
              <ShieldAlert className="w-4 h-4 text-red-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-red-200">Invalid UPI ID format</p>
                <p className="text-[11px] text-red-100/80 mt-0.5">The UPI ID doesn&apos;t look right. A valid UPI ID looks like <span className="font-mono">name@bank</span> or <span className="font-mono">9876543210@ucc</span>.</p>
              </div>
            </div>
          )}

          {/* Known fraud keywords in UPI — hard block */}
          {upiAnalysis === 'suspicious' && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-400/50 bg-red-500/15 px-3.5 py-2.5 mb-2">
              <ShieldAlert className="w-4 h-4 text-red-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-red-200">⚠ Suspicious UPI ID detected</p>
                <p className="text-[11px] text-red-100/80 mt-0.5">This UPI ID contains keywords commonly used in fraud scams (lottery, prize, refund, etc.). Do not proceed.</p>
              </div>
            </div>
          )}

          {/* Valid UPI typed manually, no QR — gentle nudge only */}
          {upiAnalysis === 'no-qr' && (
            <div className="flex items-start gap-2.5 rounded-xl border border-cyan-400/30 bg-cyan-500/8 px-3.5 py-2.5 mb-2">
              <QrCode className="w-4 h-4 text-cyan-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-cyan-200">Tip: Scan the payee&apos;s QR for extra verification</p>
                <p className="text-[11px] text-cyan-100/70 mt-0.5">Scanning the QR code lets us verify the name and amount match exactly — protecting you from impersonation fraud.</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Payee Name field */}
            <div>
              <label className="block text-sm mb-1 text-slate-300">
                Payee Name
                {qrData?.pn && <span className="ml-2 text-[10px] text-cyan-300 font-medium">(auto-filled from QR)</span>}
              </label>
              <input
                type="text"
                name="payeeName"
                value={formData.payeeName}
                onChange={handleChange}
                placeholder="Enter the payee's name as shown on their QR"
                className={`w-full rounded-xl px-4 py-2.5 border bg-black/20 outline-none focus:ring-2 transition-colors ${
                  nameMismatch
                    ? 'border-red-400/70 focus:ring-red-400/40 focus:border-red-400'
                    : formData.payeeName && qrData?.pn && !nameMismatch
                    ? 'border-emerald-400/60 focus:ring-emerald-400/30 focus:border-emerald-400'
                    : 'border-slate-600 focus:ring-cyan-400/40 focus:border-cyan-400'
                }`}
              />
              <p className="text-xs text-slate-400 mt-1">
                Must exactly match the name on the payee&apos;s UPI QR code.
              </p>
            </div>

            <div>
              <label className="block text-sm mb-1 text-slate-300">Amount (INR)</label>
              <input
                type="number"
                name="amount"
                required
                min="1"
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g. 500"
                className={`w-full rounded-xl px-4 py-2.5 border bg-black/20 outline-none focus:ring-2 transition-colors ${
                  amountMismatch
                    ? 'border-red-400/70 focus:ring-red-400/40 focus:border-red-400'
                    : 'border-slate-600 focus:ring-cyan-400/40 focus:border-cyan-400'
                }`}
              />
              {qrData?.am && (
                <p className="text-xs mt-1 font-medium" style={{ color: amountMismatch ? '#fca5a5' : '#6ee7b7' }}>
                  QR specifies: ₹{qrData.am}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1 text-slate-300">UPI ID or Payment Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="recipient"
                  required
                  value={formData.recipient}
                  onChange={handleChange}
                  placeholder="merchant@upi or https://pay.example/..."
                  className="flex-1 rounded-xl px-4 py-2.5 border bg-black/20 border-slate-600 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 outline-none"
                />
                <button
                  type="button"
                  onClick={handleScanQr}
                  className="px-3 rounded-xl border border-slate-500/70 hover:border-cyan-300/60 hover:bg-cyan-400/10 transition-colors"
                  title="Upload QR"
                >
                  <QrCode className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleCameraScan}
                  className={`px-3 rounded-xl border transition-colors ${
                    cameraScanning
                      ? 'border-red-400/70 bg-red-500/15'
                      : 'border-slate-500/70 hover:border-cyan-300/60 hover:bg-cyan-400/10'
                  }`}
                  title="Scan with camera"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQrUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Upload a QR image or use camera scan to auto-fill UPI/link.
              </p>

              {/* ─ Resolved name chip ───────────────────────────────────────── */}
              {upiLookup?.loading && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 animate-pulse">
                  <Crosshair className="w-3.5 h-3.5 animate-spin" />
                  Looking up registered name…
                </div>
              )}
              {!upiLookup?.loading && upiLookup?.found && upiLookup?.name && (
                <div className="mt-2 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-emerald-300 font-medium">
                    Registered as: <span className="font-semibold">{upiLookup.name}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize">({upiLookup.source})</span>
                </div>
              )}
              {!upiLookup?.loading && upiLookup && !upiLookup.found && upiLookup.message && (
                <div className="mt-2 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <span className="text-[11px] text-amber-300/90">{upiLookup.message}</span>
                </div>
              )}
              {cameraScanning && (
                <div className="mt-3 rounded-xl border border-cyan-300/35 bg-cyan-500/10 p-2">
                  <video ref={videoRef} className="w-full max-h-44 rounded-lg bg-black/40 object-cover" muted playsInline autoPlay />
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1 text-slate-300">Location</label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full rounded-xl px-4 py-2.5 border bg-black/20 border-slate-600 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 outline-none"
                >
                  {commonLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1 text-slate-300">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl px-4 py-2.5 border bg-black/20 border-slate-600 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 outline-none capitalize"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1 text-slate-300">Link Source Context</label>
              <select
                name="sourceType"
                value={formData.sourceType}
                onChange={handleChange}
                className="w-full rounded-xl px-4 py-2.5 border bg-black/20 border-slate-600 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 outline-none"
              >
                <option value="unknown">Unknown source</option>
                <option value="known-contact">Known contact</option>
                <option value="official-merchant">Official merchant</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 text-slate-300">Device</label>
              <input
                type="text"
                name="deviceName"
                value={formData.deviceName}
                readOnly
                className="w-full rounded-xl px-4 py-2.5 border bg-black/20 border-slate-700 text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {hasQrMismatch && (
              <div className="rounded-xl border border-red-400/50 bg-red-500/15 px-4 py-3 text-center">
                <p className="text-xs font-semibold text-red-200">🚫 Payment blocked due to QR mismatch</p>
                <p className="text-[11px] text-red-100/75 mt-1">Fix the name/amount above to match the QR before proceeding.</p>
              </div>
            )}

            {analysis?.status === 'WARNING' && !allowWarningProceed && !hasQrMismatch && (
              <button
                type="button"
                onClick={handleProceedAnyway}
                className="w-full py-2.5 rounded-xl border border-amber-300/40 bg-amber-400/15 text-amber-200 hover:bg-amber-400/20 font-medium transition-colors"
              >
                Proceed Anyway
              </button>
            )}

            <button
              type="submit"
              disabled={submitDisabled || hasQrMismatch}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background:
                  isBlockedByRisk || isCardBlocked || hasQrMismatch
                    ? 'linear-gradient(145deg, rgba(239,68,68,0.55), rgba(127,29,29,0.65))'
                    : 'linear-gradient(145deg, rgba(56,189,248,0.9), rgba(14,116,144,0.9))',
              }}
            >
              {isCardBlocked ? (
                <><Ban className="w-4 h-4" /> Card Blocked</>
              ) : loading ? (
                <><Crosshair className="w-4 h-4 animate-spin" /> Submitting Secure Payment...</>
              ) : hasQrMismatch ? (
                <><Ban className="w-4 h-4" /> QR Mismatch — Blocked</>
              ) : isBlockedByRisk ? (
                <><Ban className="w-4 h-4" /> Payment Blocked</>
              ) : (
                <>Send Payment <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor: analysis ? riskVisuals.ring : 'var(--color-border)',
              background: analysis ? riskVisuals.surface : 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
              boxShadow: analysis
                ? '0 14px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)'
                : '0 10px 22px rgba(0,0,0,0.25)',
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Live Risk Analysis</p>
                <h3 className="text-lg font-semibold text-slate-100 mt-1">Smart Security Engine</h3>
              </div>
              {analysis ? riskVisuals.icon : <Sparkles className="w-5 h-5 text-cyan-300" />}
            </div>

            {!analysis && !analyzing && (
              <p className="text-sm text-slate-400">
                Enter amount and recipient to run AI fraud checks, link scanning, and community intelligence in real time.
              </p>
            )}

            {analyzing && (
              <div className="flex items-center gap-2 text-sm text-cyan-200 animate-pulse">
                <Crosshair className="w-4 h-4 animate-spin" />
                Running pre-payment risk checks...
              </div>
            )}

            {analysis && (
              <>
                <div className="mb-4 rounded-xl border border-slate-500/35 bg-black/20 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Payee Trust Score</span>
                    <span className={`font-semibold ${payeeTrustVisual.tone}`}>
                      {payeeTrustVisual.label} ({payeeTrustScore}/100)
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-black/35 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${payeeTrustVisual.bar}`}
                      style={{ width: `${payeeTrustPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300/85">
                    This score reflects trust in the recipient/payee, not your own account.
                  </p>
                </div>

                {isUnknownLink && (
                  <div className="mb-3 rounded-xl border border-amber-300/45 bg-amber-500/15 p-3">
                    <div className="text-xs uppercase tracking-[0.15em] text-amber-200/90">Unknown Link</div>
                    <div className="text-sm font-semibold text-amber-100 mt-1">Status: UNVERIFIED</div>
                    <p className="text-xs text-amber-100/85 mt-1">No safety guarantee. Verify before proceeding.</p>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${riskVisuals.badge}`}>
                    {riskVisuals.actionText}
                  </span>
                  <span className="text-xs text-slate-300">Latency: {analysis.latencyMs || 0}ms</span>
                </div>

                <div className="mb-4 rounded-xl border border-cyan-400/30 bg-cyan-500/8 p-3">
                  <div className="flex items-center justify-between text-xs text-cyan-100/90">
                    <span>Confidence Meter</span>
                    <span>{confidenceLevel}</span>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-black/35 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 bg-cyan-400"
                      style={{ width: `${confidencePct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-cyan-100/80">
                    Decision support only. Always review link context.
                  </p>
                </div>

                <div className="mb-4">
                  <div className="h-2.5 rounded-full bg-black/30 overflow-hidden">
                    <div
                      className={`${riskVisuals.meter} h-full transition-all duration-500`}
                      style={{ width: `${toMeterPercent(analysis.finalRiskScore || analysis.final_risk_score)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 text-xs text-slate-300">
                    Final Risk Score: {Number(analysis.finalRiskScore || analysis.final_risk_score || 0).toFixed(2)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-600/60 bg-black/20 p-3">
                  <p className="text-sm text-slate-100 font-medium">{analysis.recommendation}</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                    {(analysis.reasons || []).slice(0, 4).map((reason) => (
                      <li key={reason} className="flex gap-2">
                        <span>-</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          {result && !result.error && (
            <div className="rounded-2xl border border-slate-600/60 bg-black/20 p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                {result.status === 'BLOCKED' ? (
                  <Ban className="w-5 h-5 text-red-300" />
                ) : result.status === 'WARNING' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-200" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                )}
                <h3 className="text-lg font-semibold text-slate-100">Payment Decision: {result.status}</h3>
              </div>

              <p className="text-sm text-slate-300">{result.recommendation || result.systemMessage}</p>
              <p className="text-xs text-slate-400 mt-2">Transaction ID: {result.transaction}</p>
              <p className="text-xs text-slate-400">Trust Impact: {result.trustScoreImpact > 0 ? '+' : ''}{result.trustScoreImpact || 0}</p>
              {(result.payeeTrust?.payeeTrustScore || result.payee_trust_score) && (
                <p className="text-xs text-slate-300 mt-1">
                  Payee Trust: {result.payeeTrust?.payeeTrustScore || result.payee_trust_score}/100 ({result.payeeTrust?.payeeTrustLevel || result.payee_trust_level || 'CAUTION'})
                </p>
              )}
            </div>
          )}

          {result?.error && (
            <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
              {result.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
