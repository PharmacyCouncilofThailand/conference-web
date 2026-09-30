'use client';

import { CalendarDays, MapPin } from 'lucide-react';
import type { AdminGrantedSessionDto } from '@/lib/api/payments';

export function AdminGrantedSessions({ sessions }: { sessions: AdminGrantedSessionDto[] }) {
  if (sessions.length === 0) return null;

  return (
    <section className="mt-4" aria-label="Session ที่ได้รับสิทธิ์เพิ่มเติม">
      <div className="rounded-2xl border border-[#8a8a00]/25 bg-[#8a8a00]/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-[#737300]">Session ที่ได้รับสิทธิ์เพิ่มเติม</h3>
          <span className="rounded-full bg-[#8a8a00]/10 px-2 py-1 text-xs font-medium text-[#737300]">เพิ่มโดย Admin</span>
        </div>
        <div className="mt-3 space-y-3">
          {sessions.map((session) => (
            <div key={`${session.registrationId}-${session.sessionId}`} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="font-medium text-gray-900">{session.sessionName}</div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-[#8a8a00]" />
                  {new Date(session.startTime).toLocaleString('th-TH', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
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
