// ── Mock Attendance Data ─────────────────────────────────────────

export const MOCK_ATTENDANCE = [
  { id: 1, name: 'Dr. Anjali Patil', specialization: 'General Medicine', status: 'present', checkIn: '08:45' },
  { id: 2, name: 'Dr. Ravi Desai', specialization: 'Gynaecology', status: 'present', checkIn: '09:10' },
  { id: 3, name: 'Dr. Sanjay Mehta', specialization: 'Paediatrics', status: 'absent', checkIn: null },
  { id: 4, name: 'Dr. Priya Nair', specialization: 'Surgery', status: 'present', checkIn: '08:30' },
  { id: 5, name: 'Dr. Mohan Shinde', specialization: 'Orthopaedics', status: 'present', checkIn: '09:00' },
  { id: 6, name: 'Dr. Rekha Kulkarni', specialization: 'Ophthalmology', status: 'absent', checkIn: null },
]

export const MOCK_ATTENDANCE_HISTORY = [
  { date: '2026-06-25', present: 5, absent: 1 },
  { date: '2026-06-26', present: 4, absent: 2 },
  { date: '2026-06-27', present: 6, absent: 0 },
  { date: '2026-06-28', present: 5, absent: 1 },
  { date: '2026-06-29', present: 3, absent: 3 },
  { date: '2026-06-30', present: 5, absent: 1 },
  { date: '2026-07-01', present: 4, absent: 2 },
]
