// ── Mock Appointments Data ───────────────────────────────────────

export const MOCK_APPOINTMENTS = [
  {
    id: 1, patient: 'Ramesh Patil', doctor: 'Dr. Anjali Patil', hospital: 'Alibag PHC',
    hospitalId: 1, doctorId: 1, date: '2026-07-02', time: '09:00', status: 'confirmed',
    specialization: 'General Medicine', patientPhone: '+91 9876543210',
  },
  {
    id: 2, patient: 'Sunita More', doctor: 'Dr. Ravi Desai', hospital: 'Alibag PHC',
    hospitalId: 1, doctorId: 2, date: '2026-07-02', time: '09:30', status: 'confirmed',
    specialization: 'Gynaecology', patientPhone: '+91 9876543211',
  },
  {
    id: 3, patient: 'Arun Shinde', doctor: 'Dr. Priya Nair', hospital: 'Alibag PHC',
    hospitalId: 1, doctorId: 4, date: '2026-07-02', time: '10:00', status: 'confirmed',
    specialization: 'Surgery', patientPhone: '+91 9876543212',
  },
  {
    id: 4, patient: 'Kavya Joshi', doctor: 'Dr. Anjali Patil', hospital: 'Alibag PHC',
    hospitalId: 1, doctorId: 1, date: '2026-07-02', time: '10:30', status: 'confirmed',
    specialization: 'General Medicine', patientPhone: '+91 9876543213',
  },
  {
    id: 5, patient: 'Vijay Kulkarni', doctor: 'Dr. Mohan Shinde', hospital: 'Alibag PHC',
    hospitalId: 1, doctorId: 5, date: '2026-07-01', time: '11:00', status: 'completed',
    specialization: 'Orthopaedics', patientPhone: '+91 9876543214',
  },
  {
    id: 6, patient: 'Meena Pawar', doctor: 'Dr. Priya Nair', hospital: 'Alibag PHC',
    hospitalId: 1, doctorId: 4, date: '2026-07-01', time: '14:00', status: 'completed',
    specialization: 'Surgery', patientPhone: '+91 9876543215',
  },
  {
    id: 7, patient: 'Ganesh Deshpande', doctor: 'Dr. Ravi Desai', hospital: 'Alibag PHC',
    hospitalId: 1, doctorId: 2, date: '2026-06-30', time: '09:30', status: 'cancelled',
    specialization: 'Gynaecology', patientPhone: '+91 9876543216',
  },
  // Patient-specific upcoming
  {
    id: 8, patient: 'Suresh Patient', doctor: 'Dr. Anjali Patil', hospital: 'Alibag PHC',
    hospitalId: 1, doctorId: 1, date: '2026-07-05', time: '10:00', status: 'confirmed',
    specialization: 'General Medicine', patientPhone: '+91 9900000001',
  },
  {
    id: 9, patient: 'Suresh Patient', doctor: 'Dr. Kavita Bhosle', hospital: 'Mahad CHC',
    hospitalId: 3, doctorId: 11, date: '2026-07-10', time: '11:30', status: 'confirmed',
    specialization: 'Gynaecology', patientPhone: '+91 9900000001',
  },
  {
    id: 10, patient: 'Suresh Patient', doctor: 'Dr. Rohan Kulkarni', hospital: 'Panvel PHC',
    hospitalId: 4, doctorId: 13, date: '2026-06-20', time: '09:00', status: 'completed',
    specialization: 'General Medicine', patientPhone: '+91 9900000001',
  },
]

export const MOCK_SLOTS = [
  { time: '09:00', available: false },
  { time: '09:30', available: false },
  { time: '10:00', available: true },
  { time: '10:30', available: true },
  { time: '11:00', available: true },
  { time: '11:30', available: false },
  { time: '14:00', available: true },
  { time: '14:30', available: true },
  { time: '15:00', available: true },
  { time: '15:30', available: false },
  { time: '16:00', available: true },
]
