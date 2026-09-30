import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminGrantedSessions } from './AdminGrantedSessions';

const session = {
  registrationId: 42,
  sessionId: 77,
  sessionName: 'Clinical Workshop',
  sessionType: 'workshop',
  startTime: '2026-10-10T09:00:00.000Z',
  endTime: '2026-10-10T10:00:00.000Z',
  room: 'Room A',
  grantedAt: '2026-10-01T01:00:00.000Z',
  source: 'admin_grant' as const,
};

describe('AdminGrantedSessions', () => {
  it('renders nothing for an empty grant list', () => {
    const { container } = render(<AdminGrantedSessions sessions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the granted session without fabricating purchase or receipt details', () => {
    render(<AdminGrantedSessions sessions={[session]} />);
    expect(screen.getByText('Clinical Workshop')).toBeInTheDocument();
    expect(screen.getByText('Room A')).toBeInTheDocument();
    expect(screen.getByText('เพิ่มโดย Admin')).toBeInTheDocument();
    expect(screen.queryByText(/THB|USD|receipt|ใบเสร็จ|ชำระเงิน/i)).not.toBeInTheDocument();
  });
});
