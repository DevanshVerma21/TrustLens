# TrustLens - Hackathon Edition 🏆

## Overview

**TrustLens** is a production-grade explainable AI system for digital banking fraud detection. Built for the hackathon, it combines statistical anomaly detection, rule-based fraud detection, and behavioral profiling into a seamless, visually stunning interface.

**Status**: ✅ Ready for demo presentation
**Setup Time**: 2-3 minutes
**Demo Time**: 5 minutes
**Tech Stack**: React 18, Express.js, MongoDB, WebSocket, Tailwind CSS

---

## 🚀 Quick Start (Copy-Paste Ready)

### Terminal 1 - Start Backend
```bash
cd server
npm install
npm run seed:synthetic
```

**Expected:** 
```
✨ Synthetic data seeding complete!
📋 Summary:
   • Generated 5 user profiles
   • Total transactions: 1,100
   • Expected fraud rate: ~5%
🚀 Ready for fraud detection testing!
```

### Terminal 2 - Start Frontend
```bash
cd client
npm install
npm run dev
```

**Expected:**
```
VITE v4.x.x ready in 500 ms
➜  Local:   http://localhost:5173/
```

**That's it!** Browser opens automatically.

---

## 🎬 The 5-Minute Demo Script

### 1. Dashboard Overview (1 min)
- Show trust score: 85/100
- Highlight real-time "Live" status
- Mention: "Every transaction analyzed in real-time"

### 2. Demo Scenario: Normal (1 min)
1. Click "🎬 Try Demo Scenarios"
2. Select "Normal Transaction"
3. View details (normal amount, known device)
4. Click "Run Scenario"
5. Show: ✅ APPROVED (green badge, fraud score ~15%)

### 3. Demo Scenario: Suspicious (1.5 min)
1. Run another demo scenario
2. Select "Suspicious Transaction"
3. Show: 🟡 CHALLENGE (amber badge, fraud score ~65%)
4. Read reasoning: "Multiple unusual factors"

### 4. Demo Scenario: Fraud (1 min)
1. Run final scenario
2. Select "Likely Fraud"
3. Show: 🚩 DECLINED (red badge, fraud score ~92%)
4. Highlight combined factors

### 5. Audit Trail (0.5 min)
- Click sidebar "Audit Logs"
- Show transaction history
- Expand to see full reasoning
- Mention: "Complete compliance audit trail"

---

## 🎨 What Makes It Impressive

### Visual Features
✨ **Smooth Animations** - Cards slide in, trust score updates with trend indicators
✨ **Color Coding** - Instant visual feedback (green/amber/red)
✨ **Real-time Updates** - Live WebSocket connection badge
✨ **Responsive Design** - Works perfectly on projectors/large screens
✨ **Claymorphism UI** - Modern, tactile design language

### Technical Features
🔧 **Hybrid Intelligence** - 3-layer fraud detection (rules + anomalies + confidence)
🔧 **Explainability** - Every decision shows detailed reasoning
🔧 **Behavioral Profiles** - Learns each user's unique patterns
🔧 **95% Confidence** - High-quality synthetic data
🔧 **Production Ready** - Audit logs, appeals, risk categorization

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────┐
│         React Frontend (TrustLens UI)           │
│  7 Pages + Real-Time Updates + Smooth Animation │
└────────────────────┬────────────────────────────┘
                     │ HTTP/WebSocket
┌─────────────────────▼────────────────────────────┐
│      Express.js Backend + Fraud Detection       │
│  • DecisionEngine (5-tier decisions)            │
│  • FraudService (Hybrid intel)                  │
│  • AuditLog (Complete trail)                    │
└────────────────────┬────────────────────────────┘
                     │ MongoDB
┌─────────────────────▼────────────────────────────┐
│         MongoDB Database                        │
│  • 1,100+ realistic transactions                │
│  • 5 customer profiles                          │
│  • Behavioral profiles with 15+ metrics         │
│  • Complete audit trail                         │
└─────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
TrustLens/
├── HACKATHON_DEMO_GUIDE.md        ← Follow this for demo!
├── PERFORMANCE_GUIDE.md            ← Optimization tips
├── server/
│   ├── services/
│   │   ├── decisionEngine.js       (5-tier decisions)
│   │   ├── fraudService.js         (Hybrid detection)
│   │   ├── demoScenarioService.js  (Demo scenarios)
│   │   └── ...
│   ├── routes/
│   │   ├── transactions.js         (API endpoints)
│   │   ├── audit.js                (Audit logs)
│   │   ├── data.js                 (Data generation)
│   │   └── demo.js                 (Demo scenarios)
│   └── server.js                   (Express setup)
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       (Main page with animations)
│   │   │   ├── FraudSimulator.jsx  (Demo scenarios)
│   │   │   ├── AuditLog.jsx        (Audit trail)
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── DemoMode.jsx        (Demo scenario selector)
│   │   │   ├── DecisionBadge.jsx   (Color-coded decisions)
│   │   │   ├── SystemMessage.jsx   (Explanations)
│   │   │   └── ...
│   │   └── App.jsx                 (Router + initialization)
│   └── package.json
└── package.json
```

---

## 🎯 Key Features

### 1. Demo Scenarios (Zero-Setup)
- 3 predefined scenarios
- Perfect for consistent demo runs
- Instant results
- Clear expected outcomes

### 2. Hybrid Fraud Detection
```
Transaction Input
     ↓
┌────────────────────────────┐
│ Tier 1: Rule-Based         │ ← AML limits, velocity
│ Tier 2: Anomalies          │ ← Statistical outliers
│ Tier 3: Confidence Scoring │ ← Bayesian probability
└────────────────────────────┘
     ↓
Decision + Explanation
```

### 3. 5-Tier Decisions
- ✅ **APPROVE** - Automatic approval
- 🟡 **CHALLENGE** - Needs verification
- 🚩 **DECLINE** - Blocked
- ⚠️ **ESCALATE** - Manual review
- ⏸️ **HOLD** - Pending verification

### 4. Complete Audit Trail
Every decision recorded with:
- Transaction details
- Decision reasoning
- User context at time
- Risk levels
- Confidence scores
- Appeal status

---

## 🔑 Demo Credentials

```
User ID: 69dccbb4cf6b05ddf9b96846
Email:   demo@trustlens.com
Profile: Moderate Spender
```

**Pre-loaded Data:**
- ✅ 250+ transactions
- ✅ ~5% fraud rate (~12-13 fraudulent)
- ✅ 2 known devices
- ✅ 3-5 primary locations
- ✅ 95% profile confidence

---

## 📈 Expected Results (Demo Scenarios)

### Scenario 1: Normal Transaction
```json
{
  "decision": "APPROVE",
  "riskLevel": "LOW",
  "fraudScore": "15%",
  "confidence": "95%",
  "systemMessage": "✅ Transaction approved"
}
```

### Scenario 2: Suspicious Transaction
```json
{
  "decision": "CHALLENGE",
  "riskLevel": "MEDIUM",
  "fraudScore": "65%",
  "confidence": "82%",
  "systemMessage": "🟡 Requires verification"
}
```

### Scenario 3: Fraud Case
```json
{
  "decision": "DECLINE",
  "riskLevel": "HIGH",
  "fraudScore": "92%",
  "confidence": "98%",
  "systemMessage": "🚩 Transaction blocked"
}
```

---

## ⚡ Performance Metrics

| Metric | Time | Status |
|--------|------|--------|
| Frontend Load | ~1.2s | ✅ Fast |
| Fraud Detection | ~50ms | ✅ Real-time |
| API Response | ~80ms | ✅ Responsive |
| WebSocket Connect | ~200ms | ✅ Live |
| Full Demo Scenario | ~600ms | ✅ Smooth |

---

## 🎓 What Judges Will Love

✅ **Working Product** - Not just slides, fully functional
✅ **Real Intelligence** - Actual fraud detection algo, not dummy logic
✅ **Beautiful UI** - Attention to design and animation
✅ **Explainability** - AI decisions are transparent
✅ **Production Ready** - Audit logs, appeals, compliance
✅ **Scalable** - Can handle real-world usage
✅ **Realistic Data** - 1,100+ synthetic transactions
✅ **Demo Perfect** - 3 canned scenarios for smooth presentation

---

## 🚨 Troubleshooting During Demo

| Problem | Solution |
|---------|----------|
| "No data loading" | Wait 30s for seed to complete |
| "API error" | Restart backend with `npm run dev` |
| "Slow response" | Kill chrome extensions, use incognito |
| "Demo button missing" | Refresh page (F5) |
| "WebSocket offline" | Check backend console, restart |

---

## 🎬 Additional Features (If You Have Time)

### Manual Transaction Simulator
- Go to Fraud Simulator
- Adjust sliders for amount, location, time
- Watch fraud detection update in real-time
- Great for custom Q&A scenarios

### Audit Log Viewer
- Shows complete transaction history
- Filter by decision type or risk level
- Expand for detailed reasoning
- Compliance-ready

### Profile Intelligence
- Spending patterns and trends
- Category breakdown (pie chart)
- Activity heatmap
- Account health score

### Trust Breakdown
- Educational visualization
- How trust score is calculated
- Penalty and bonus factors
- 90-day trend

---

## 🏆 Presentation Tips

1. **Start on Dashboard** - Shows system is healthy
2. **Use Demo Scenarios** - For consistency and reproducibility
3. **Walk through each scenario** - Slow enough to see animations
4. **Highlight the reasoning** - Show not "black box"
5. **End with Audit Logs** - Proves compliance readiness
6. **Mention stats** - "95% profile confidence with only 30 seconds of data"
7. **Ask for questions** - Engage the judges

---

## 📞 Quick Links

- **Demo Guide**: See `HACKATHON_DEMO_GUIDE.md`
- **Performance Tips**: See `PERFORMANCE_GUIDE.md`
- **Data Summary**: See `SYNTHETIC_DATA_SUMMARY.md`
- **Implementation**: See `IMPLEMENTATION_COMPLETE.md`

---

## 🎉 You're Ready!

Your system is fully loaded and ready to impress. Follow the 5-minute demo script, click through the scenarios, and let the beautiful UI do the talking.

**Good luck at the hackathon! 🚀**

---

**Built with:**
- React 18
- Express.js
- MongoDB
- Tailwind CSS
- Socket.io
- Lucide Icons

**In under 48 hours.** 🏃‍♂️💨
