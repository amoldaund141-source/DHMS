// ── Mock Notifications Data ──────────────────────────────────────

export const MOCK_NOTIFICATIONS = [
  {
    id: 1, type: 'lowStock', read: false,
    title: 'notifications.types.lowStock',
    message: 'ORS Sachets at Alibag PHC dropped to 18 units (threshold: 50).',
    hospital: 'Alibag PHC', time: '2026-07-02T08:15:00', severity: 'critical',
  },
  {
    id: 2, type: 'bedFull', read: false,
    title: 'notifications.types.bedFull',
    message: 'Karjat PHC Special Ward is 100% occupied.',
    hospital: 'Karjat PHC', time: '2026-07-02T07:40:00', severity: 'critical',
  },
  {
    id: 3, type: 'doctorAbsent', read: false,
    title: 'notifications.types.doctorAbsent',
    message: 'Dr. Sanjay Mehta is absent today. No replacement assigned.',
    hospital: 'Alibag PHC', time: '2026-07-02T09:00:00', severity: 'warning',
  },
  {
    id: 4, type: 'appointmentReminder', read: false,
    title: 'notifications.types.appointmentReminder',
    message: 'Upcoming appointment with Dr. Anjali Patil at 10:00 on 05 Jul.',
    hospital: 'Alibag PHC', time: '2026-07-02T06:00:00', severity: 'info',
  },
  {
    id: 5, type: 'lowStock', read: true,
    title: 'notifications.types.lowStock',
    message: 'Metformin 500mg at Pen CHC is below threshold.',
    hospital: 'Pen CHC', time: '2026-07-01T14:30:00', severity: 'warning',
  },
  {
    id: 6, type: 'bedFull', read: true,
    title: 'notifications.types.bedFull',
    message: 'Pen CHC General Ward reached 95% capacity.',
    hospital: 'Pen CHC', time: '2026-07-01T11:00:00', severity: 'warning',
  },
  {
    id: 7, type: 'doctorAbsent', read: true,
    title: 'notifications.types.doctorAbsent',
    message: 'Dr. Lata Chavan and Dr. Nilesh Doke absent at Karjat PHC.',
    hospital: 'Karjat PHC', time: '2026-07-01T09:15:00', severity: 'critical',
  },
  {
    id: 8, type: 'lowStock', read: true,
    title: 'notifications.types.lowStock',
    message: 'Cotrimoxazole DS is completely out of stock at Alibag PHC.',
    hospital: 'Alibag PHC', time: '2026-06-30T16:45:00', severity: 'critical',
  },
]
