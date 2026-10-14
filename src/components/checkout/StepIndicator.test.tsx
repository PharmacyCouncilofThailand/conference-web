import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { StepIndicator } from './StepIndicator';

it('displays consecutive numbers while retaining logical step IDs', () => {
    const onStepClick = vi.fn();
    render(<StepIndicator steps={[
        { id: 1, label: 'ข้อมูลส่วนตัว' }, { id: 2, label: 'เลือกแพ็กเกจ' }, { id: 4, label: 'ยืนยันการลงทะเบียน' },
    ]} currentStep={4} onStepClick={onStepClick} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('4')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /เลือกแพ็กเกจ/ }));
    expect(onStepClick).toHaveBeenCalledWith(2);
});
