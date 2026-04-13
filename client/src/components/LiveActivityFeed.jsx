import React, { useState, useEffect, useRef } from 'react';
import { Activity, Wifi, WifiOff, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

const MAX_EVENTS = 20;

function getEventStyle(type) {
  switch (type) {
    case 'fraud':   return { dot: 'bg-red-500',    text: 'text-red-400',    label: 'FRAUD FLAGGED' };
    case 'warning': return { dot: 'bg-amber-500',  text: 'text-amber-400',  label: 'WARNING' };
    case 'safe':    return { dot: 'bg-emerald-500', text: 'text-emerald-400', label: 'CLEARED' };
    case 'connect': return { dot: 'bg-blue-500',    text: 'text-blue-400',   label: 'CONNECTED' };
    case 'disconnect': return { dot: 'bg-gray-500', text: 'text-gray-400',   label: 'OFFLINE' };
    default:         return { dot: 'bg-slate-500',  text: 'text-slate-400',  label: 'EVENT' };
  }
}

const LiveActivityFeed = ({ events = [], isConnected = false, socketId = '' }) => {
  const feedRef = useRef(null);

  // Auto-scroll to newest
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [events]);

  return (
    <div
      id="live-activity-feed"
      className="activity-feed-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider font-mono">
            Live Activity
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <span className="activity-pulse-dot" />
              <span className="text-xs text-emerald-400 font-mono">LIVE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500 font-mono">OFFLINE</span>
            </>
          )}
        </div>
      </div>

      {/* Socket ID */}
      {socketId && (
        <div className="mb-3 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
          <p className="text-xs text-gray-500 font-mono">
            <span className="text-gray-600">session: </span>
            <span className="text-blue-400/70">{socketId.slice(0, 20)}…</span>
          </p>
        </div>
      )}

      {/* Event Feed */}
      <div ref={feedRef} className="activity-feed-list space-y-2 max-h-64 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-600 font-mono">Waiting for activity...</p>
          </div>
        ) : (
          events.map((ev, i) => {
            const style = getEventStyle(ev.type);
            return (
              <div
                key={ev.id}
                className={`activity-event-row ${i === 0 ? 'event-new' : ''}`}
              >
                <div className={`activity-dot flex-shrink-0 ${style.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold font-mono ${style.text}`}>
                      {style.label}
                    </span>
                    {ev.amount && (
                      <span className="text-xs text-gray-500 font-mono">
                        ₹{Number(ev.amount).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  {ev.message && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{ev.message}</p>
                  )}
                </div>
                <span className="text-xs text-gray-600 font-mono flex-shrink-0">
                  {ev.time}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Stats row */}
      <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-400 font-mono">
            {events.filter(e => e.type === 'safe').length}
          </p>
          <p className="text-xs text-gray-600 font-mono">Safe</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-amber-400 font-mono">
            {events.filter(e => e.type === 'warning').length}
          </p>
          <p className="text-xs text-gray-600 font-mono">Warnings</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-red-400 font-mono">
            {events.filter(e => e.type === 'fraud').length}
          </p>
          <p className="text-xs text-gray-600 font-mono">Flagged</p>
        </div>
      </div>
    </div>
  );
};

export default LiveActivityFeed;
export { MAX_EVENTS };
