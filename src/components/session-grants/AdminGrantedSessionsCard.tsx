'use client';

import { CalendarDays, MapPin } from 'lucide-react';
import type { AdminGrantedSessionDto } from '@/lib/api/payments';

interface AdminGrantedSessionsCardProps {
  sessions: AdminGrantedSessionDto[];
  compact?: boolean;
}

export function AdminGrantedSessionsCard({ sessions, compact = false }: AdminGrantedSessionsCardProps) {
  if (sessions.length === 0) return null;

  return (
    <section className={compact ? 'mt-4' : 'mt-6'} aria-label="Session ที่ได้รับสิทธิ์เพิ่มเติม">
      <div className="rounded-2xl border border-[#8a8a00]/25 bg-[#8a8a00]/5 p-4">
        <h3 className="font-semibold text-[#737300]">Session ที่ได้รับสิทธิ์เพิ่มเติม</h3>
        <p className="mt-1 text-sm text-gray-500">สิทธิ์เหล่านี้ถูกเพิ่มให้กับ Registration ของคุณโดยผู้ดูแลระบบ</p>
        <div className="mt-3 space-y-3">
          {sessions.map((session) => (
            <div key={`${session.registrationId}-${session.sessionId}`} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="font-medium text-gray-900">{session.sessionName}</div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-[#8a8a00]" />
                  {new Date(session.startTime).toLocaleString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {session.room && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#8a8a00]" />
                    {session.room}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
