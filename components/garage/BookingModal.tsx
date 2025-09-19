"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Dispatch, SetStateAction } from 'react';

export type BookingModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  step: 'choice' | 'register' | 'verify' | 'slot';
  setStep: Dispatch<SetStateAction<'choice' | 'register' | 'verify' | 'slot'>>;
  regName: string;
  setRegName: (v: string) => void;
  regEmail: string;
  setRegEmail: (v: string) => void;
  regPassword: string;
  setRegPassword: (v: string) => void;
  contactEmail: string;
  setContactEmail: (v: string) => void;
  contactPhone: string;
  setContactPhone: (v: string) => void;
  otp: string;
  setOtp: (v: string) => void;
  onRegister: () => void;
  onVerify: () => void;
  // slot props
  slotStart?: Date | null;
  setSlotStart?: (d: Date | null) => void;
  slotEnd?: Date | null;
  setSlotEnd?: (d: Date | null) => void;
  onConfirmSlot?: () => void;
  submitting: boolean;
};

export default function BookingModal(props: BookingModalProps) {
  const {
    open,
    onOpenChange,
    step,
    setStep,
    regName,
    setRegName,
    regEmail,
    setRegEmail,
    regPassword,
    setRegPassword,
    contactEmail,
    setContactEmail,
    contactPhone,
    setContactPhone,
    otp,
    setOtp,
    onRegister,
    onVerify,
    submitting,
    slotStart,
    setSlotStart,
    slotEnd,
    setSlotEnd,
    onConfirmSlot,
  } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {step === 'choice' && (
          <div>
            <DialogHeader>
              <DialogTitle>Continue Booking</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 mt-2">You are not logged in. Choose an option to continue:</p>
            <div className="mt-4 flex flex-col gap-3">
              <Button onClick={() => setStep('register')} className="w-full">Register an Account</Button>
              <Button variant="outline" onClick={() => setStep('verify')} className="w-full">Quick Verify (OTP)</Button>
            </div>
          </div>
        )}
        {step === 'register' && (
          <div>
            <DialogHeader>
              <DialogTitle>Register to Book</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <Input placeholder="Full Name" value={regName} onChange={(e) => setRegName(e.target.value)} />
              <Input placeholder="Email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              <Input placeholder="Password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setStep('choice')}>Back</Button>
                <Button onClick={onRegister} disabled={submitting}>{submitting ? 'Submitting...' : 'Register & Book'}</Button>
              </div>
            </div>
          </div>
        )}
        {step === 'verify' && (
          <div>
            <DialogHeader>
              <DialogTitle>Quick Verify</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 mt-2">Enter your email or phone, and OTP 1234 to continue.</p>
            <div className="mt-4 space-y-3">
              <Input placeholder="Email (optional)" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              <Input placeholder="Phone (optional)" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              <Input placeholder="OTP (use 1234)" value={otp} onChange={(e) => setOtp(e.target.value)} />
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setStep('choice')}>Back</Button>
                <Button onClick={onVerify} disabled={submitting}>{submitting ? 'Submitting...' : 'Verify & Book'}</Button>
              </div>
            </div>
          </div>
        )}
        {step === 'slot' && (
          <div>
            <DialogHeader>
              <DialogTitle>Select Time Slot</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start</label>
                <Input
                  type="datetime-local"
                  value={slotStart ? new Date(slotStart).toISOString().slice(0,16) : ''}
                  onChange={(e) => setSlotStart && setSlotStart(e.target.value ? new Date(e.target.value) : null)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End</label>
                <Input
                  type="datetime-local"
                  value={slotEnd ? new Date(slotEnd).toISOString().slice(0,16) : ''}
                  onChange={(e) => setSlotEnd && setSlotEnd(e.target.value ? new Date(e.target.value) : null)}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setStep('choice')}>Back</Button>
                <Button onClick={onConfirmSlot} disabled={submitting || !slotStart || !slotEnd}>{submitting ? 'Submitting...' : 'Confirm Booking'}</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
