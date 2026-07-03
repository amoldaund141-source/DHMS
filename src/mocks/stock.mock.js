// ── Mock Stock Data ──────────────────────────────────────────────

export const MOCK_STOCK = [
  { id: 1, medicine: 'Paracetamol 500mg', current: 120, ordered: 500, dispensed: 380, threshold: 200, unit: 'tabs', status: 'warning',
    trend: [460, 420, 380, 350, 290, 200, 120] },
  { id: 2, medicine: 'ORS Sachets', current: 18, ordered: 200, dispensed: 182, threshold: 50, unit: 'pcs', status: 'critical',
    trend: [200, 170, 140, 110, 80, 45, 18] },
  { id: 3, medicine: 'Amoxicillin 250mg', current: 340, ordered: 400, dispensed: 60, threshold: 100, unit: 'caps', status: 'success',
    trend: [300, 320, 340, 360, 360, 355, 340] },
  { id: 4, medicine: 'Iron + Folic Acid', current: 580, ordered: 600, dispensed: 20, threshold: 150, unit: 'tabs', status: 'success',
    trend: [400, 450, 500, 540, 565, 575, 580] },
  { id: 5, medicine: 'Metformin 500mg', current: 75, ordered: 300, dispensed: 225, threshold: 100, unit: 'tabs', status: 'warning',
    trend: [300, 250, 200, 170, 130, 100, 75] },
  { id: 6, medicine: 'Atenolol 50mg', current: 8, ordered: 150, dispensed: 142, threshold: 30, unit: 'tabs', status: 'critical',
    trend: [150, 110, 80, 55, 35, 20, 8] },
  { id: 7, medicine: 'Cetirizine 10mg', current: 430, ordered: 500, dispensed: 70, threshold: 100, unit: 'tabs', status: 'success',
    trend: [350, 380, 400, 415, 425, 428, 430] },
  { id: 8, medicine: 'Omeprazole 20mg', current: 290, ordered: 350, dispensed: 60, threshold: 80, unit: 'caps', status: 'success',
    trend: [200, 230, 255, 270, 280, 286, 290] },
  { id: 9, medicine: 'Chloroquine 250mg', current: 42, ordered: 200, dispensed: 158, threshold: 60, unit: 'tabs', status: 'warning',
    trend: [200, 165, 130, 100, 78, 58, 42] },
  { id: 10, medicine: 'Cotrimoxazole DS', current: 0, ordered: 100, dispensed: 100, threshold: 25, unit: 'tabs', status: 'critical',
    trend: [100, 75, 50, 30, 15, 5, 0] },
]

export const MOCK_STOCK_SUMMARY = {
  total: 10,
  healthy: 4,
  low: 3,
  critical: 3,
}
