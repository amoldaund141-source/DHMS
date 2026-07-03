import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { useHospitals } from '@/hooks/useHospitals'
import { useSlots, useBookAppointment } from '@/hooks/useAppointments'
import { useAuth } from '@/context/AuthContext'

const STEPS = ['Select Doctor', 'Choose Slot', 'Confirm']

const stepVariants = {
  enter:  (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

// Generate 7 day strip
const DATE_STRIP = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))

export default function BookAppointment() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [submitted, setSubmitted] = useState(false)

  // Step 1 state
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [selectedDoctor, setSelectedDoctor] = useState(null)

  // Step 2 state
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedSlot, setSelectedSlot] = useState(null)

  const { user } = useAuth()
  const { data: hospitals = [] } = useHospitals()
  const { data: slots = [] } = useSlots({
    hospitalId: selectedHospital?.id,
    doctorId: selectedDoctor?.id,
    date: selectedDate,
  })
  const { mutate: bookAppt, isPending: isBooking } = useBookAppointment()

  const { register, handleSubmit } = useForm()

  const goNext = () => {
    setDir(1)
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const goBack = () => {
    setDir(-1)
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleConfirm = async () => {
    bookAppt(
      {
        hospital: selectedHospital?.id,
        doctor: selectedDoctor?.id,
        date: selectedDate,
        time: selectedSlot,
      },
      { onSuccess: () => setSubmitted(true) }
    )
  }

  // Availability indicator color
  const availColor = (h) => {
    const occ = h.bedOccupancy
    if (occ >= 90) return 'bg-critical'
    if (occ >= 70) return 'bg-warning'
    return 'bg-success'
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-5">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto"
        >
          <svg className="w-10 h-10 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="font-display font-bold text-2xl text-ink">Appointment Booked!</h2>
          <p className="font-body text-sm text-body/70 mt-2">
            Your appointment with <strong>{selectedDoctor?.name}</strong> at <strong>{selectedHospital?.name}</strong>
            <br />on <strong>{format(new Date(selectedDate), 'dd MMM yyyy')}</strong> at <strong>{selectedSlot}</strong> is confirmed.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex gap-3 justify-center">
          <button onClick={() => navigate('/patient/appointments')} className="btn-primary">
            View My Appointments
          </button>
          <button onClick={() => { setSubmitted(false); setStep(0); setSelectedHospital(null); setSelectedDoctor(null); setSelectedSlot(null) }}
            className="btn-ghost">
            Book Another
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6 pb-6">
      <div>
        <h2 className="font-display font-semibold text-xl text-ink">{t('appointments.bookAppointment') ?? 'Book Appointment'}</h2>
        <p className="font-body text-sm text-body/70 mt-0.5">Find a doctor and book your slot in 3 easy steps</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                i < step ? 'bg-primary text-white' :
                i === step ? 'bg-primary/15 text-primary border-2 border-primary' :
                'bg-mist text-body/40 border-2 border-border'
              }`}>
                {i < step ? (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={`font-body text-xs font-medium hidden sm:block ${i === step ? 'text-ink' : 'text-body/50'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full transition-all ${i < step ? 'bg-primary' : 'bg-border'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          {/* ── STEP 0: Select Hospital & Doctor ── */}
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <h3 className="font-display font-semibold text-sm text-ink">Step 1 — Select a Hospital &amp; Doctor</h3>

              {hospitals.map((h) => (
                <div key={h.id} className={`card overflow-hidden transition-all ${selectedHospital?.id === h.id ? 'ring-2 ring-primary' : ''}`}>
                  {/* Hospital header */}
                  <button
                    id={`hospital-${h.id}`}
                    onClick={() => { setSelectedHospital(h); setSelectedDoctor(null) }}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-mist/40 transition-colors text-left"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${availColor(h)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-sm text-ink">{h.name}</p>
                      <p className="font-body text-2xs text-body/60">{h.location} · {h.type} · {h.distance} km</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono text-xs text-body/50 tabular">{h.doctorsPresent}/{h.doctorsTotal} doctors</p>
                      <p className="font-mono text-xs tabular mt-0.5" style={{ color: h.bedOccupancy > 85 ? 'var(--color-critical)' : 'var(--color-success)' }}>
                        {100 - h.bedOccupancy}% beds free
                      </p>
                    </div>
                    <svg className={`w-4 h-4 text-body/30 transition-transform flex-shrink-0 ${selectedHospital?.id === h.id ? 'rotate-90 text-primary' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  {/* Doctors list (expanded when hospital selected) */}
                  <AnimatePresence>
                    {selectedHospital?.id === h.id && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden border-t border-border"
                      >
                        <div className="px-5 py-3 bg-mist/30">
                          <p className="font-body text-2xs text-body/50 uppercase tracking-wider font-semibold mb-2">Available Doctors</p>
                          <div className="space-y-2">
                            {h.doctors.filter((d) => d.status === 'present').map((doc) => (
                              <button
                                key={doc.id}
                                id={`doctor-${doc.id}`}
                                onClick={() => setSelectedDoctor(doc)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                                  selectedDoctor?.id === doc.id
                                    ? 'bg-primary/8 border-primary/30 shadow-sm'
                                    : 'bg-surface border-border hover:border-primary/20'
                                }`}
                              >
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <span className="font-mono text-xs font-bold text-primary">{doc.name.split(' ').pop()?.[0]}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-body text-sm font-medium text-ink">{doc.name}</p>
                                  <p className="font-body text-2xs text-body/60">{doc.specialization}</p>
                                </div>
                                {selectedDoctor?.id === doc.id && (
                                  <svg className="w-4 h-4 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>
                            ))}
                            {h.doctors.filter((d) => d.status === 'absent').map((doc) => (
                              <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-mist opacity-50 cursor-not-allowed">
                                <div className="w-8 h-8 rounded-full bg-body/10 flex items-center justify-center flex-shrink-0">
                                  <span className="font-mono text-xs font-bold text-body/40">{doc.name.split(' ').pop()?.[0]}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-body text-sm font-medium text-body/50">{doc.name}</p>
                                  <p className="font-body text-2xs text-body/40">{doc.specialization} · Absent today</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              <div className="flex justify-end pt-2">
                <button
                  id="step0-next"
                  disabled={!selectedHospital || !selectedDoctor}
                  onClick={goNext}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next → Choose Slot
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: Choose Date & Slot ── */}
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <h3 className="font-display font-semibold text-sm text-ink">Step 2 — Choose Date &amp; Time Slot</h3>

              {/* Selected doctor recap */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-primary/6 border border-primary/20">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <span className="font-mono text-sm font-bold text-primary">{selectedDoctor?.name?.split(' ').pop()?.[0]}</span>
                </div>
                <div>
                  <p className="font-body text-sm font-medium text-ink">{selectedDoctor?.name}</p>
                  <p className="font-body text-2xs text-body/60">{selectedDoctor?.specialization} · {selectedHospital?.name}</p>
                </div>
              </div>

              {/* Date strip */}
              <div>
                <p className="font-body text-xs font-semibold text-body/50 uppercase tracking-wider mb-2">Select Date</p>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {DATE_STRIP.map((date) => {
                    const key = format(date, 'yyyy-MM-dd')
                    const isSelected = key === selectedDate
                    return (
                      <button
                        key={key}
                        id={`date-${key}`}
                        onClick={() => { setSelectedDate(key); setSelectedSlot(null) }}
                        className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-primary border-primary text-white shadow-sm'
                            : 'bg-surface border-border text-body hover:border-primary/30'
                        }`}
                      >
                        <span className={`font-body text-2xs uppercase ${isSelected ? 'text-white/70' : 'text-body/60'}`}>{format(date, 'EEE')}</span>
                        <span className="font-mono font-semibold text-base tabular">{format(date, 'd')}</span>
                        <span className={`font-body text-2xs ${isSelected ? 'text-white/70' : 'text-body/50'}`}>{format(date, 'MMM')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div>
                <p className="font-body text-xs font-semibold text-body/50 uppercase tracking-wider mb-2">Available Slots</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((slot, i) => (
                    <motion.button
                      key={slot.time}
                      id={`slot-${slot.time.replace(':', '')}`}
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.time)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                        !slot.available
                          ? 'border-border bg-mist text-body/30 cursor-not-allowed'
                          : selectedSlot === slot.time
                          ? 'bg-primary border-primary text-white shadow-sm'
                          : 'border-success/30 bg-success-tint text-success hover:border-success cursor-pointer hover:shadow-sm'
                      }`}
                    >
                      <span className="font-mono text-sm tabular block">{slot.time}</span>
                      <span className="font-body text-2xs block mt-0.5 opacity-70">
                        {!slot.available ? 'Booked' : 'Free'}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={goBack} className="btn-ghost">← Back</button>
                <button
                  id="step1-next"
                  disabled={!selectedSlot}
                  onClick={goNext}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next → Review
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Review & Confirm ── */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <h3 className="font-display font-semibold text-sm text-ink">Step 3 — Review &amp; Confirm</h3>

              {/* Summary card */}
              <div className="card p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-mono text-lg font-bold text-primary">{selectedDoctor?.name?.split(' ').pop()?.[0]}</span>
                  </div>
                  <div>
                    <p className="font-display font-semibold text-base text-ink">{selectedDoctor?.name}</p>
                    <p className="font-body text-sm text-body/60">{selectedDoctor?.specialization}</p>
                  </div>
                </div>

                {[
                  { icon: '🏥', label: 'Hospital',     value: selectedHospital?.name },
                  { icon: '📍', label: 'Location',     value: selectedHospital?.location },
                  { icon: '📅', label: 'Date',         value: format(new Date(selectedDate), 'EEEE, dd MMMM yyyy') },
                  { icon: '🕐', label: 'Time',         value: selectedSlot },
                  { icon: '📞', label: 'Hospital Phone', value: selectedHospital?.phone },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="text-base w-6 text-center flex-shrink-0">{row.icon}</span>
                    <p className="font-body text-2xs text-body/50 w-28 flex-shrink-0">{row.label}</p>
                    <p className="font-body text-sm text-ink font-medium">{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Reminder note */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-info-tint border border-info/20">
                <span className="text-info mt-0.5">ℹ️</span>
                <p className="font-body text-xs text-ink/80">
                  Please arrive 10 minutes early. Bring your Aadhaar card and any previous prescriptions.
                  You can cancel this appointment from <strong>My Appointments</strong>.
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={goBack} className="btn-ghost">← Back</button>
                <button
                  id="confirm-booking"
                  onClick={handleConfirm}
                  className="btn-primary"
                >
                  ✓ Confirm Booking
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
