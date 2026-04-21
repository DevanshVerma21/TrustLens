import React, { useState } from 'react';
import { BarChart3, TrendingUp, Smartphone, MapPin, Calendar, Award } from 'lucide-react';

function SpendingStats() {
  return (
    <div className="space-y-4">
      <div className="clay-card p-6">
        <h3 className="font-bold text-clay-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> Daily Spending
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-clay-700">Average</span>
              <span className="font-bold text-clay-900">$156.40</span>
            </div>
            <div className="bg-clay-200 rounded-full h-3">
              <div
                className="bg-gradient-trust-medium rounded-full h-3"
                style={{ width: '62%' }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-clay-700">Low</span>
              <span className="font-bold text-clay-900">$24</span>
            </div>
            <div className="bg-clay-200 rounded-full h-3">
              <div
                className="bg-green-500 rounded-full h-3"
                style={{ width: '10%' }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-clay-700">High</span>
              <span className="font-bold text-clay-900">$2,450</span>
            </div>
            <div className="bg-clay-200 rounded-full h-3">
              <div
                className="bg-red-500 rounded-full h-3"
                style={{ width: '98%' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="clay-card p-4">
          <p className="text-xs text-clay-600 mb-1">Monthly Avg</p>
          <p className="text-2xl font-bold text-clay-900">$4,692</p>
        </div>
        <div className="clay-card p-4">
          <p className="text-xs text-clay-600 mb-1">Transactions</p>
          <p className="text-2xl font-bold text-clay-900">432</p>
        </div>
      </div>
    </div>
  );
}

function CategoryChart() {
  const categories = [
    { name: 'Shopping', percent: 45, color: 'bg-blue-500' },
    { name: 'Dining', percent: 25, color: 'bg-amber-500' },
    { name: 'Entertainment', percent: 15, color: 'bg-purple-500' },
    { name: 'Utilities', percent: 10, color: 'bg-green-500' },
    { name: 'Transfer', percent: 5, color: 'bg-red-500' },
  ];

  return (
    <div className="clay-card p-6">
      <h3 className="font-bold text-clay-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" /> Spending by Category
      </h3>

      {/* Pie Chart */}
      <div className="flex justify-center mb-6">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {/* Shopping */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="8"
              strokeDasharray="70.7 157.08"
            />
            {/* Dining */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="8"
              strokeDasharray="39.27 157.08"
              strokeDashoffset="-70.7"
            />
            {/* Entertainment */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#a855f7"
              strokeWidth="8"
              strokeDasharray="23.56 157.08"
              strokeDashoffset="-109.97"
            />
            {/* Utilities */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#10b981"
              strokeWidth="8"
              strokeDasharray="15.71 157.08"
              strokeDashoffset="-133.53"
            />
            {/* Transfer */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#ef4444"
              strokeWidth="8"
              strokeDasharray="7.85 157.08"
              strokeDashoffset="-149.24"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-clay-900">$4.7k</p>
              <p className="text-xs text-clay-600">monthly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-clay-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${cat.color}`} />
              <span className="text-sm text-clay-700">{cat.name}</span>
            </div>
            <span className="text-sm font-bold text-clay-900">{cat.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityHeatmap() {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = [];
  for (let i = 0; i < 24; i += 3) {
    hours.push(`${i}:00`);
  }

  // Generate random activity data
  const getIntensity = (row, col) => {
    const base = (row + col) % 5;
    return base * 0.2;
  };

  const getColor = (intensity) => {
    if (intensity < 0.2) return 'bg-gray-200';
    if (intensity < 0.4) return 'bg-green-200';
    if (intensity < 0.6) return 'bg-green-400';
    if (intensity < 0.8) return 'bg-green-600';
    return 'bg-green-800';
  };

  return (
    <div className="clay-card p-6">
      <h3 className="font-bold text-clay-900 mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" /> Activity Heatmap
      </h3>
      <p className="text-xs text-clay-600 mb-4">When you typically transact</p>

      <div className="overflow-x-auto">
        <div className="space-y-1">
          {hours.map((hour, row) => (
            <div key={row} className="flex items-center gap-2">
              <span className="w-12 text-xs font-semibold text-clay-600">{hour}</span>
              <div className="flex gap-1 flex-1">
                {daysOfWeek.map((_, col) => (
                  <div
                    key={col}
                    className={`w-6 h-6 rounded-lg ${getColor(getIntensity(row, col))} cursor-pointer hover:ring-2 hover:ring-clay-900`}
                    title={`${daysOfWeek[col]} at ${hour}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2 flex-wrap">
        {['Low', 'Medium-Low', 'Medium', 'Medium-High', 'High'].map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`w-4 h-4 rounded ${getColor(i * 0.2)}`} />
            <span className="text-xs text-clay-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LocationBreakdown() {
  const locations = [
    { name: 'New York', percent: 60, icon: '📍' },
    { name: 'Los Angeles', percent: 20, icon: '📍' },
    { name: 'Chicago', percent: 10, icon: '📍' },
    { name: 'Boston', percent: 5, icon: '📍' },
    { name: 'Other', percent: 5, icon: '📍' },
  ];

  return (
    <div className="clay-card p-6">
      <h3 className="font-bold text-clay-900 mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5" /> Top Locations
      </h3>

      <div className="space-y-3">
        {locations.map((loc, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-clay-700">{loc.icon} {loc.name}</span>
              <span className="font-bold text-clay-900">{loc.percent}%</span>
            </div>
            <div className="bg-clay-200 rounded-full h-3">
              <div
                className="bg-gradient-trust-medium rounded-full h-3"
                style={{ width: `${loc.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeviceUsage() {
  const devices = [
    { name: 'Windows PC', percent: 65, icon: '🖥️' },
    { name: 'MacBook Pro', percent: 20, icon: '💻' },
    { name: 'iPad Air', percent: 10, icon: '📱' },
    { name: 'Other Devices', percent: 5, icon: '🖥️' },
  ];

  return (
    <div className="clay-card p-6">
      <h3 className="font-bold text-clay-900 mb-4 flex items-center gap-2">
        <Smartphone className="w-5 h-5" /> Device Usage
      </h3>

      <div className="space-y-3">
        {devices.map((device, i) => (
          <div key={i} className="p-3 bg-clay-50 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold text-clay-900">{device.icon} {device.name}</span>
              <span className="text-sm font-bold text-clay-900">{device.percent}%</span>
            </div>
            <div className="bg-clay-200 rounded-full h-2">
              <div
                className={`bg-gradient-trust-high rounded-full h-2`}
                style={{ width: `${device.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountHealthScore() {
  const score = 8.5;
  const maxScore = 10;
  const percentage = (score / maxScore) * 100;

  const factors = [
    { label: 'No Chargebacks', value: '✅' },
    { label: 'Account Age', value: '3+ years' },
    { label: 'Transaction Velocity', value: 'Normal' },
    { label: 'Device Loyalty', value: '85%' },
    { label: 'Pattern Consistency', value: 'High' },
  ];

  return (
    <div className="clay-card p-6">
      <h3 className="font-bold text-clay-900 mb-4 flex items-center gap-2">
        <Award className="w-5 h-5" /> Account Health Score
      </h3>

      <div className="mb-6">
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#c7a586" strokeWidth="3" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#gradientHealth)"
              strokeWidth="3"
              strokeDasharray={`${(percentage / 100) * 282.7} 282.7`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradientHealth" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{score}</p>
              <p className="text-xs text-clay-600">/10</p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm font-semibold text-green-600 mb-4">Excellent</p>

        <div className="space-y-2">
          {factors.map((factor, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <span className="text-sm text-clay-700">{factor.label}</span>
              <span className="text-sm font-bold text-green-600">{factor.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfileIntelligence() {
  const accountAge = 3;
  const totalTransactions = 432;
  const avgDaily = 1.2;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-clay-900 mb-2">Profile Intelligence</h1>
        <p className="text-clay-600">Your behavioral patterns and account insights</p>
      </div>

      {/* Profile Header */}
      <div className="clay-card p-8 bg-gradient-to-r from-gradient-trust-high/10 to-gradient-trust-medium/10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-clay-600 text-sm mb-1">Account Age</p>
            <p className="text-3xl font-bold text-clay-900">{accountAge}</p>
            <p className="text-xs text-clay-600">years</p>
          </div>
          <div>
            <p className="text-clay-600 text-sm mb-1">Total Transactions</p>
            <p className="text-3xl font-bold text-clay-900">{totalTransactions}</p>
            <p className="text-xs text-clay-600">lifetime</p>
          </div>
          <div>
            <p className="text-clay-600 text-sm mb-1">Daily Average</p>
            <p className="text-3xl font-bold text-clay-900">{avgDaily}</p>
            <p className="text-xs text-clay-600">transactions</p>
          </div>
          <div>
            <p className="text-clay-600 text-sm mb-1">Profile Status</p>
            <p className="text-3xl font-bold text-green-600">✅</p>
            <p className="text-xs text-clay-600">verified</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <SpendingStats />
          <CategoryChart />
          <ActivityHeatmap />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <AccountHealthScore />
          <LocationBreakdown />
          <DeviceUsage />
        </div>
      </div>

      {/* Behavioral Insights */}
      <div className="clay-card p-6">
        <h2 className="text-lg font-bold text-clay-900 mb-4">Behavioral Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <p className="font-semibold text-blue-900 mb-1">📊 Spending Pattern</p>
            <p className="text-sm text-blue-800">
              You typically spend between $50-$300 per transaction, with shopping being your primary category at 45% of spending.
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
            <p className="font-semibold text-purple-900 mb-1">⏰ Peak Activity</p>
            <p className="text-sm text-purple-800">
              Most active during business hours (9 AM - 5 PM), especially on weekdays. Weekend activity is minimal.
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
            <p className="font-semibold text-green-900 mb-1">📍 Location Loyalty</p>
            <p className="text-sm text-green-800">
              Primarily transact from New York (60% of transactions). Occasional travel to LA and Chicago.
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
            <p className="font-semibold text-amber-900 mb-1">📱 Device Consistency</p>
            <p className="text-sm text-amber-800">
              Strong device loyalty with Windows PC being your primary device (65% of transactions).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
