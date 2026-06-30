'use client';

export interface OptionalSessionOption {
    id: string;
    sessionName: string;
    room?: string | null;
    maxCapacity?: number;
    enrolledCount?: number;
    seatsRemaining?: number | null;
    isFull?: boolean;
    description?: string | null;
}

interface OptionalSessionSelectorProps {
    sessions: OptionalSessionOption[];
    selectedSessionIds: string[];
    onToggle: (sessionId: string) => void;
    disabled?: boolean;
}

export function OptionalSessionSelector({
    sessions,
    selectedSessionIds,
    onToggle,
    disabled = false,
}: OptionalSessionSelectorProps) {
    if (sessions.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3 pt-4 border-t border-gray-100">
            <div>
                <h4 className="font-semibold text-gray-800">กิจกรรมที่ลงทะเบียนล่วงหน้า (ไม่บังคับ)</h4>
                <p className="text-xs text-gray-500 mt-1">
                    กิจกรรมที่มีจำนวนจำกัด กรุณาเลือกตอนลงทะเบียนเข้างาน หากไม่เลือกจะไม่สามารถเข้าร่วมได้
                </p>
            </div>

            <div className="space-y-2">
                {sessions.map((session) => {
                    const isSelected = selectedSessionIds.includes(session.id);
                    const isFull = session.isFull || session.seatsRemaining === 0;
                    const seatsLabel =
                        session.maxCapacity && session.maxCapacity > 0
                            ? session.seatsRemaining != null
                                ? `เหลือ ${session.seatsRemaining} / ${session.maxCapacity} ที่`
                                : `${session.enrolledCount ?? 0} / ${session.maxCapacity} ที่`
                            : null;

                    return (
                        <label
                            key={session.id}
                            className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                                disabled || isFull
                                    ? 'opacity-60 cursor-not-allowed bg-gray-50 border-gray-200'
                                    : isSelected
                                        ? 'bg-[#8a8a00]/10 border-[#8a8a00]'
                                        : 'bg-white border-gray-200 hover:border-[#8a8a00]/40'
                            }`}
                        >
                            <input
                                type="checkbox"
                                className="mt-1 accent-[#8a8a00]"
                                checked={isSelected}
                                disabled={disabled || isFull}
                                onChange={() => onToggle(session.id)}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium text-gray-900">{session.sessionName}</span>
                                    {isFull && (
                                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full normal-case tracking-normal bg-red-100 text-red-700">
                                            เต็มแล้ว
                                        </span>
                                    )}
                                </div>
                                {session.room && (
                                    <p className="text-sm text-gray-500 mt-0.5">{session.room}</p>
                                )}
                                {session.description && (
                                    <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                                )}
                                {seatsLabel && (
                                    <p className={`text-sm mt-1 ${isFull ? 'text-red-600' : 'text-[#737300]'}`}>
                                        {seatsLabel}
                                    </p>
                                )}
                            </div>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
