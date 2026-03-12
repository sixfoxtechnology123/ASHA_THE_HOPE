import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../config/api';

const ConsultationBilling = () => {
  const [formData, setFormData] = useState({
    billId: '',
    patientName: '',
    appointmentRef: '',
    doctorName: '',
    consultationFee: 1000,
    discount: 0,
    gstApplicable: true,
    paymentMode: 'Cash',
  });

  const [savedBill, setSavedBill] = useState(null);

  const feeValue = useMemo(() => Number(formData.consultationFee || 0), [formData.consultationFee]);
  const discountValue = useMemo(() => Number(formData.discount || 0), [formData.discount]);
  const netAmount = Math.max(feeValue - discountValue, 0);
  const gstAmount = formData.gstApplicable ? netAmount * 0.18 : 0;
  const finalAmount = netAmount + gstAmount;

  const fetchNextBillId = async () => {
    try {
      const res = await api.get('/billing/next-id');
      if (res.data.success) {
        setFormData((prev) => ({ ...prev, billId: res.data.nextId }));
      }
    } catch (error) {
      toast.error('FAILED TO GENERATE BILL ID');
    }
  };

  useEffect(() => {
    fetchNextBillId();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleGenerateInvoice = async () => {
    try {
      const payload = {
        ...formData,
        consultationFee: feeValue,
        discount: discountValue,
      };
      const response = await api.post('/billing/create', payload);
      setSavedBill(response.data.data);
      fetchNextBillId();
      toast.success(`Invoice ${response.data.data.billId} generated`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate invoice');
    }
  };

  const handleWhatsAppShare = () => {
    const message = `Hello ${formData.patientName}, your invoice ${savedBill?.billId || ''} for amount ${finalAmount.toFixed(
      2
    )} is generated. Payment Mode: ${formData.paymentMode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-semibold">
      <header className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-3xl border-b-4 border-emerald-500 bg-white p-4 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Consultation Billing</h1>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-600">
              Billing & Revenue Management
            </p>
          </div>
          {savedBill?.billId && (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
              Invoice: {savedBill.billId}
            </div>
          )}
        </div>
      </header>

      <main className="px-6 pb-12">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="grid grid-cols-1 gap-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] md:grid-cols-2">
            <Input label="Bill ID" name="billId" value={formData.billId} onChange={handleInputChange} readOnly />
            <Input label="Patient Name" name="patientName" value={formData.patientName} onChange={handleInputChange} />
            <Input label="Appointment Reference" name="appointmentRef" value={formData.appointmentRef} onChange={handleInputChange} />
            <Input label="Doctor" name="doctorName" value={formData.doctorName} onChange={handleInputChange} />
            <Input
              label="Consultation Fee (Auto)"
              name="consultationFee"
              value={formData.consultationFee}
              readOnly
              onChange={handleInputChange}
            />
            <Input
              label="Discount"
              name="discount"
              type="number"
              value={formData.discount}
              onChange={handleInputChange}
            />
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">GST Applicable</label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  name="gstApplicable"
                  checked={formData.gstApplicable}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-emerald-500"
                />
                Apply 18% GST
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-3">
              <Amount label="Net Amount" value={netAmount} />
              <Amount label="GST" value={gstAmount} />
              <Amount label="Final Amount" value={finalAmount} />
            </div>

            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">Payment Mode</label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase outline-none focus:border-emerald-500"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <button
              onClick={handleGenerateInvoice}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-600"
            >
              Generate Invoice
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-slate-800"
            >
              Print Invoice
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-800"
            >
              Share via WhatsApp
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConsultationBilling;

const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">{label}</label>
    <input
      {...props}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase outline-none focus:border-emerald-500"
    />
  </div>
);

const Amount = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
    <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">{label}</div>
    <div className="mt-1 text-lg font-black text-slate-900">{value.toFixed(2)}</div>
  </div>
);
