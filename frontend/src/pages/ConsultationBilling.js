import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../config/api';
import { Edit, Trash2, Share2, FileDown, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';

const ConsultationBilling = () => {
  const [formData, setFormData] = useState({
    billId: '',
    patientName: '',
    patientPhone: '',
    appointmentRef: '',
    doctorName: '',
    consultationFee: 1000,
    discount: 0,
    gstRate: '',
    paymentMode: 'Cash',
  });

  const [savedBill, setSavedBill] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [billingList, setBillingList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const feeValue = useMemo(() => Number(formData.consultationFee || 0), [formData.consultationFee]);
  const discountValue = useMemo(() => Number(formData.discount || 0), [formData.discount]);
  const netAmount = Math.max(feeValue - discountValue, 0);
  const gstRateValue = Number(formData.gstRate || 0);
  const gstAmount = gstRateValue > 0 ? (netAmount * gstRateValue) / 100 : 0;
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

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/all');
      if (res.data.success) {
        setAppointments(res.data.data || []);
      }
    } catch (error) {
      toast.error('FAILED TO LOAD APPOINTMENTS');
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors/all');
      if (res.data.success) {
        setDoctors(res.data.data || []);
      }
    } catch (error) {
      toast.error('FAILED TO LOAD DOCTORS');
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await api.get('/billing/all');
      if (res.data.success) setBillingList(res.data.data || []);
    } catch (error) {
      toast.error('FAILED TO LOAD BILLING LIST');
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAppointmentSelect = (e) => {
    const value = e.target.value;
    const selected = appointments.find((appt) => appt.appointmentId === value);
    if (!selected) {
      setFormData((prev) => ({
        ...prev,
        patientName: '',
        patientPhone: '',
        appointmentRef: '',
        doctorName: '',
        consultationFee: prev.consultationFee || 0
      }));
      return;
    }
    const doctor = doctors.find((doc) => doc.doctorId === selected.doctorId);
    setFormData((prev) => ({
      ...prev,
      patientName: selected.patientName || '',
      patientPhone: selected.patientMobile || '',
      appointmentRef: selected.appointmentId || '',
      doctorName: selected.doctorName || doctor?.doctorName || '',
      consultationFee: doctor?.consultationFee ?? prev.consultationFee
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        consultationFee: feeValue,
        discount: discountValue,
        gstRate: gstRateValue
      };
      const response = editingId
        ? await api.put(`/billing/update/${editingId}`, payload)
        : await api.post('/billing/create', payload);
      setSavedBill(response.data.data);
      toast.success(editingId ? `Invoice ${response.data.data.billId} updated` : `Invoice ${response.data.data.billId} generated`);
      setEditingId(null);
      setShowForm(false);
      setFormData((prev) => ({
        ...prev,
        patientName: '',
        patientPhone: '',
        appointmentRef: '',
        doctorName: '',
        discount: 0,
        gstRate: '',
        paymentMode: 'Cash'
      }));
      await fetchNextBillId();
      await fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate invoice');
    }
  };

  const buildBillPdf = (bill) => {
    const doc = new jsPDF();
    const left = 15;
    let y = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Consultation Billing Invoice', left, y);

    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Bill ID: ${bill.billId || '-'}`, left, y);
    doc.text(`Date: ${new Date(bill.createdAt || Date.now()).toLocaleDateString()}`, 120, y);

    y += 8;
    doc.text(`Patient Name: ${bill.patientName || '-'}`, left, y);
    y += 6;
    doc.text(`Phone: ${bill.patientPhone || '-'}`, left, y);
    y += 6;
    doc.text(`Appointment ID: ${bill.appointmentRef || '-'}`, left, y);
    y += 6;
    doc.text(`Doctor: ${bill.doctorName || '-'}`, left, y);

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Billing Summary', left, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text(`Consultation Fee: ${Number(bill.consultationFee || 0).toFixed(2)}`, left, y);
    y += 6;
    doc.text(`Discount: ${Number(bill.discount || 0).toFixed(2)}`, left, y);
    y += 6;
    doc.text(`GST %: ${Number(bill.gstRate || 0).toFixed(2)}`, left, y);
    y += 6;
    doc.text(`GST Amount: ${Number(bill.gstAmount || 0).toFixed(2)}`, left, y);
    y += 6;
    doc.text(`Final Amount: ${Number(bill.finalAmount || 0).toFixed(2)}`, left, y);

    y += 8;
    doc.text(`Payment Mode: ${bill.paymentMode || '-'}`, left, y);

    return doc;
  };

  const downloadBillPdf = (bill) => {
    const doc = buildBillPdf(bill);
    doc.save(`${bill.billId || 'invoice'}.pdf`);
  };

  const shareBillPdf = async (bill) => {
    const doc = buildBillPdf(bill);
    const blob = doc.output('blob');
    const fileName = `${bill.billId || 'invoice'}.pdf`;
    const file = new File([blob], fileName, { type: 'application/pdf' });
    const message = `Invoice ${bill.billId || ''} for ${bill.patientName || 'patient'}`;

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: message });
        return;
      } catch (error) {
        // fall through to download + WhatsApp link
      }
    }

    doc.save(fileName);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const printBillPdf = (bill) => {
    const doc = buildBillPdf(bill);
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  };

  const handleEdit = (bill) => {
    setEditingId(bill._id);
    setFormData({
      billId: bill.billId || '',
      patientName: bill.patientName || '',
      patientPhone: bill.patientPhone || '',
      appointmentRef: bill.appointmentRef || '',
      doctorName: bill.doctorName || '',
      consultationFee: bill.consultationFee ?? 0,
      discount: bill.discount ?? 0,
      gstRate: bill.gstRate ?? '',
      paymentMode: bill.paymentMode || 'Cash'
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (bill) => {
    const confirmed = window.confirm(`Delete invoice ${bill.billId}?`);
    if (!confirmed) return;
    try {
      const res = await api.delete(`/billing/${bill._id}`);
      if (res.data.success) {
        toast.success('BILL DELETED');
        await fetchBills();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'DELETE FAILED');
    }
  };

  const resetForm = async () => {
    setEditingId(null);
    setFormData((prev) => ({
      ...prev,
      patientName: '',
      patientPhone: '',
      appointmentRef: '',
      doctorName: '',
      consultationFee: prev.consultationFee || 0,
      discount: 0,
      gstRate: '',
      paymentMode: 'Cash'
    }));
    await fetchNextBillId();
  };

  const openForm = async () => {
    await resetForm();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const appointmentOptions = useMemo(
    () =>
      appointments.map((appt) => ({
        id: appt.appointmentId || '',
        label: `${appt.patientName || 'UNKNOWN'} | ${appt.patientMobile || 'N/A'} | ${appt.appointmentId || '-'}`
      })),
    [appointments]
  );

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
          {!showForm ? (
            <button
              type="button"
              onClick={openForm}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-600"
            >
              Add Billing
            </button>
          ) : (
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white"
            >
              Back to List
            </button>
          )}
          {savedBill?.billId && (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
              Invoice: {savedBill.billId}
            </div>
          )}
        </div>
      </header>

      <main className="px-6 pb-12">
        <div className="mx-auto max-w-5xl space-y-6">
          {!showForm ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-600">Billing List</h2>
              </div>
              {billingList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-bold uppercase">No billing records yet.</div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <div className="max-h-[520px] overflow-auto">
                    <table className="w-full min-w-[1200px]">
                      <thead>
                        <tr className="sticky top-0 z-10 bg-white text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-600">
                          <th className="py-3 px-3">Bill ID</th>
                          <th className="py-3 px-3">Patient</th>
                          <th className="py-3 px-3">Phone</th>
                          <th className="py-3 px-3">Appointment</th>
                          <th className="py-3 px-3">Doctor</th>
                          <th className="py-3 px-3">Fee</th>
                          <th className="py-3 px-3">Discount</th>
                          <th className="py-3 px-3">GST %</th>
                          <th className="py-3 px-3">Final</th>
                          <th className="py-3 px-3">Payment</th>
                          <th className="py-3 px-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingList.map((bill) => (
                          <tr key={bill._id} className="border-b border-slate-100 text-[13px] font-bold text-slate-600">
                            <td className="py-3 px-3 font-bold text-emerald-600">{bill.billId}</td>
                            <td className="py-3 px-3">{bill.patientName || '-'}</td>
                            <td className="py-3 px-3">{bill.patientPhone || '-'}</td>
                            <td className="py-3 px-3">{bill.appointmentRef || '-'}</td>
                            <td className="py-3 px-3">{bill.doctorName || '-'}</td>
                            <td className="py-3 px-3">{Number(bill.consultationFee || 0).toFixed(2)}</td>
                            <td className="py-3 px-3">{Number(bill.discount || 0).toFixed(2)}</td>
                            <td className="py-3 px-3">{Number(bill.gstRate || 0).toFixed(2)}</td>
                            <td className="py-3 px-3">{Number(bill.finalAmount || 0).toFixed(2)}</td>
                            <td className="py-3 px-3">{bill.paymentMode}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(bill)}
                                  className="rounded-xl bg-slate-100 p-2 text-emerald-600 transition hover:bg-emerald-600 hover:text-white"
                                  title="Edit"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(bill)}
                                  className="rounded-xl bg-rose-100 p-2 text-rose-600 transition hover:bg-rose-600 hover:text-white"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              {/* <button
                                type="button"
                                onClick={() => shareBillPdf(bill)}
                                className="rounded-xl bg-emerald-100 p-2 text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                                title="Share PDF"
                              >
                                <Share2 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadBillPdf(bill)}
                                className="rounded-xl bg-slate-200 p-2 text-slate-700 transition hover:bg-slate-800 hover:text-white"
                                title="Download PDF"
                              >
                                <FileDown size={16} />
                              </button> */}
                              <button
                                type="button"
                                onClick={() => printBillPdf(bill)}
                                className="rounded-xl bg-slate-200 p-2 text-slate-700 transition hover:bg-slate-800 hover:text-white"
                                title="Print PDF"
                              >
                                <Printer size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] md:grid-cols-2"
            >
              <div className="md:col-span-2 grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-3">
                <div className="flex flex-col gap-2 md:col-span-3">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">Patient Name List (Search)</label>
                  <input
                    list="appointment-options"
                    onChange={handleAppointmentSelect}
                    placeholder="Search patient name / phone / appointment ID"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase outline-none focus:border-emerald-500"
                  />
                  <datalist id="appointment-options">
                    {appointmentOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </datalist>
                </div>
              </div>
              <Input label="Bill ID" name="billId" value={formData.billId} onChange={handleInputChange} readOnly />
              <Input label="Patient Name" name="patientName" value={formData.patientName} onChange={handleInputChange} />
              <Input label="Phone Number" name="patientPhone" value={formData.patientPhone} onChange={handleInputChange} />
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
              <Input
                label="GST % (Optional)"
                name="gstRate"
                type="number"
                value={formData.gstRate}
                onChange={handleInputChange}
                placeholder="Enter GST %"
                required={false}
              />

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

              <div className="md:col-span-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-600"
                >
                  {editingId ? 'Update Billing' : 'Submit Billing'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-slate-800"
                >
                  Reset
                </button>
              </div>
            </form>
          )}
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
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase outline-none placeholder:normal-case focus:border-emerald-500"
    />
  </div>
);

const Amount = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
    <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">{label}</div>
    <div className="mt-1 text-lg font-black text-slate-900">{value.toFixed(2)}</div>
  </div>
);
