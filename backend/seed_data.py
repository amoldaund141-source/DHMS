"""
Seed script — loads Raigad district mock data into the database.

Run with:
  python manage.py shell < seed_data.py
  -- OR --
  python manage.py shell -c "exec(open('seed_data.py').read())"

This creates:
  - 1 District (Raigad)
  - 6 Hospitals (matching frontend mock data exactly)
  - 3 Users: admin, staff, patient (matching frontend mock credentials)
  - Beds, Doctors, Stock, TestAvailability per hospital
"""
from django.utils import timezone
from core.models import (
    District, Hospital, User, Bed, Doctor, Attendance,
    StockItem, StockHistory, TestAvailability, Footfall,
)

print("🌱 Starting DHMS seed data...")

# ─────────────────────────────────────────────────────────────────────────────
# DISTRICT
# ─────────────────────────────────────────────────────────────────────────────
district, _ = District.objects.get_or_create(
    code="RAIGAD",
    defaults={"name": "Raigad", "state": "Maharashtra"},
)
print(f"  ✓ District: {district}")

# ─────────────────────────────────────────────────────────────────────────────
# HOSPITALS (matches frontend MOCK_HOSPITALS)
# ─────────────────────────────────────────────────────────────────────────────
hospitals_data = [
    {"name": "Alibag PHC",  "type": "PHC", "area": "urban", "location": "Alibag, Raigad",  "lat": 18.6415, "lng": 72.8722, "phone": "+91 2141 222233", "status": "operational"},
    {"name": "Pen CHC",     "type": "CHC", "area": "urban", "location": "Pen, Raigad",     "lat": 18.7333, "lng": 73.1000, "phone": "+91 2143 255011", "status": "operational"},
    {"name": "Mahad CHC",   "type": "CHC", "area": "rural", "location": "Mahad, Raigad",   "lat": 18.0859, "lng": 73.4167, "phone": "+91 2145 222400", "status": "operational"},
    {"name": "Panvel PHC",  "type": "PHC", "area": "urban", "location": "Panvel, Raigad",  "lat": 18.9894, "lng": 73.1175, "phone": "+91 22 27456789",  "status": "operational"},
    {"name": "Karjat PHC",  "type": "PHC", "area": "rural", "location": "Karjat, Raigad",  "lat": 18.9142, "lng": 73.3189, "phone": "+91 2148 222155", "status": "operational"},
    {"name": "Uran PHC",    "type": "PHC", "area": "rural", "location": "Uran, Raigad",    "lat": 18.8849, "lng": 72.9354, "phone": "+91 22 27222300",  "status": "operational"},
]

hospital_objs = {}
for hd in hospitals_data:
    h, _ = Hospital.objects.get_or_create(
        name=hd["name"], district=district, defaults={**hd, "district": district}
    )
    hospital_objs[h.name] = h
    print(f"  ✓ Hospital: {h.name}")

# ─────────────────────────────────────────────────────────────────────────────
# BEDS
# ─────────────────────────────────────────────────────────────────────────────
beds_data = {
    "Alibag PHC":  {"general_total": 20, "general_occupied": 14, "semi_total": 10, "semi_occupied": 7,  "special_total": 5,  "special_occupied": 2},
    "Pen CHC":     {"general_total": 40, "general_occupied": 38, "semi_total": 20, "semi_occupied": 18, "special_total": 10, "special_occupied": 10},
    "Mahad CHC":   {"general_total": 30, "general_occupied": 18, "semi_total": 15, "semi_occupied": 8,  "special_total": 8,  "special_occupied": 3},
    "Panvel PHC":  {"general_total": 25, "general_occupied": 10, "semi_total": 12, "semi_occupied": 5,  "special_total": 6,  "special_occupied": 1},
    "Karjat PHC":  {"general_total": 20, "general_occupied": 19, "semi_total": 8,  "semi_occupied": 8,  "special_total": 4,  "special_occupied": 4},
    "Uran PHC":    {"general_total": 20, "general_occupied": 9,  "semi_total": 8,  "semi_occupied": 3,  "special_total": 4,  "special_occupied": 1},
}
for name, data in beds_data.items():
    Bed.objects.get_or_create(hospital=hospital_objs[name], defaults=data)
print("  ✓ Beds seeded")

# ─────────────────────────────────────────────────────────────────────────────
# DOCTORS
# ─────────────────────────────────────────────────────────────────────────────
doctors_data = {
    "Alibag PHC": [
        ("Dr. Anjali Patil", "General Medicine", "present", "08:45"),
        ("Dr. Ravi Desai",   "Gynaecology",      "present", "09:10"),
        ("Dr. Sanjay Mehta", "Paediatrics",       "absent",  None),
        ("Dr. Priya Nair",   "Surgery",           "present", "08:30"),
    ],
    "Pen CHC": [
        ("Dr. Meera Joshi",   "General Medicine", "present", "09:00"),
        ("Dr. Kiran More",    "Orthopaedics",     "absent",  None),
        ("Dr. Suresh Kadam",  "Gynaecology",      "present", "08:50"),
        ("Dr. Nisha Thakur",  "Paediatrics",      "absent",  None),
        ("Dr. Amol Sawant",   "Surgery",          "present", "09:15"),
    ],
    "Mahad CHC": [
        ("Dr. Santosh Rane",   "General Medicine", "present", "09:00"),
        ("Dr. Kavita Bhosle",  "Gynaecology",      "present", "08:45"),
        ("Dr. Deepak Gaikwad", "Paediatrics",      "absent",  None),
    ],
    "Panvel PHC": [
        ("Dr. Rohan Kulkarni", "General Medicine", "present", "09:00"),
        ("Dr. Smita Pawar",    "Gynaecology",      "present", "09:05"),
        ("Dr. Vijay Shinde",   "Paediatrics",      "present", "08:55"),
    ],
    "Karjat PHC": [
        ("Dr. Arun Bhatt",  "General Medicine", "present", "09:10"),
        ("Dr. Lata Chavan", "Gynaecology",      "absent",  None),
        ("Dr. Nilesh Doke", "Paediatrics",      "absent",  None),
    ],
    "Uran PHC": [
        ("Dr. Seema Naik",   "General Medicine", "present", "09:00"),
        ("Dr. Pramod Kale",  "Paediatrics",      "present", "08:50"),
    ],
}

from datetime import time as dtime, date as ddate
today = timezone.localdate()

for hospital_name, doctors in doctors_data.items():
    hospital = hospital_objs[hospital_name]
    for doc_name, spec, att_status, check_in_str in doctors:
        doc, _ = Doctor.objects.get_or_create(
            hospital=hospital, name=doc_name, defaults={"specialization": spec}
        )
        check_in = None
        if check_in_str:
            h, m = check_in_str.split(":")
            check_in = dtime(int(h), int(m))
        Attendance.objects.get_or_create(
            doctor=doc, date=today,
            defaults={"status": att_status, "check_in": check_in}
        )
print("  ✓ Doctors & attendance seeded")

# ─────────────────────────────────────────────────────────────────────────────
# STOCK  (Alibag PHC — staff's hospital)
# ─────────────────────────────────────────────────────────────────────────────
alibag = hospital_objs["Alibag PHC"]
stock_data = [
    ("Paracetamol 500mg",  "tabs", 120,  500, 380, 200, [460,420,380,350,290,200,120]),
    ("ORS Sachets",        "pcs",  18,   200, 182, 50,  [200,170,140,110,80,45,18]),
    ("Amoxicillin 250mg",  "caps", 340,  400, 60,  100, [300,320,340,360,360,355,340]),
    ("Iron + Folic Acid",  "tabs", 580,  600, 20,  150, [400,450,500,540,565,575,580]),
    ("Metformin 500mg",    "tabs", 75,   300, 225, 100, [300,250,200,170,130,100,75]),
    ("Atenolol 50mg",      "tabs", 8,    150, 142, 30,  [150,110,80,55,35,20,8]),
    ("Cetirizine 10mg",    "tabs", 430,  500, 70,  100, [350,380,400,415,425,428,430]),
    ("Omeprazole 20mg",    "caps", 290,  350, 60,  80,  [200,230,255,270,280,286,290]),
    ("Chloroquine 250mg",  "tabs", 42,   200, 158, 60,  [200,165,130,100,78,58,42]),
    ("Cotrimoxazole DS",   "tabs", 0,    100, 100, 25,  [100,75,50,30,15,5,0]),
]

from datetime import timedelta

for med, unit, qty, ordered, dispensed, threshold, trend in stock_data:
    item, _ = StockItem.objects.get_or_create(
        hospital=alibag, medicine=med,
        defaults={"unit": unit, "current_qty": qty, "ordered": ordered,
                  "dispensed": dispensed, "threshold": threshold}
    )
    # Create 7-day history
    for i, qty_val in enumerate(trend):
        hist_date = today - timedelta(days=6 - i)
        StockHistory.objects.get_or_create(
            stock_item=item, date=hist_date, defaults={"qty": qty_val}
        )
print("  ✓ Stock & history seeded")

# ─────────────────────────────────────────────────────────────────────────────
# TEST AVAILABILITY
# ─────────────────────────────────────────────────────────────────────────────
tests = ["X-Ray", "Blood Test", "USG", "ECG", "Urine Test", "CBC"]
for hospital in hospital_objs.values():
    for test in tests:
        TestAvailability.objects.get_or_create(
            hospital=hospital, test_name=test,
            defaults={"available": True}
        )
print("  ✓ Test availability seeded")

# ─────────────────────────────────────────────────────────────────────────────
# FOOTFALL (7-day sample data)
# ─────────────────────────────────────────────────────────────────────────────
footfall_data = {
    "Alibag PHC": [142, 158, 171, 149, 191, 217, 126],
    "Pen CHC":    [287, 312, 341, 298, 382, 434, 252],
    "Mahad CHC":  [198, 207, 231, 209, 256, 301, 185],
}
for hospital_name, counts in footfall_data.items():
    hospital = hospital_objs[hospital_name]
    for i, count in enumerate(counts):
        day = today - timedelta(days=6 - i)
        Footfall.objects.get_or_create(hospital=hospital, date=day, defaults={"count": count})
print("  ✓ Footfall seeded")

# ─────────────────────────────────────────────────────────────────────────────
# USERS (matching frontend mock credentials exactly)
# ─────────────────────────────────────────────────────────────────────────────
admin_user, _ = User.objects.get_or_create(
    email="admin@dhms.in",
    defaults={
        "username":      "admin@dhms.in",
        "first_name":    "Dr. Ananya",
        "last_name":     "Rao",
        "role":          "admin",
        "district":      district,
        "is_state_admin": False,
    },
)
admin_user.set_password("admin123")
admin_user.save()

staff_user, _ = User.objects.get_or_create(
    email="staff@dhms.in",
    defaults={
        "username":   "staff@dhms.in",
        "first_name": "Nurse Priya",
        "last_name":  "Naik",
        "role":       "staff",
        "hospital":   hospital_objs["Alibag PHC"],
        "district":   district,
    },
)
staff_user.set_password("staff123")
staff_user.save()

patient_user, _ = User.objects.get_or_create(
    email="patient@dhms.in",
    defaults={
        "username":   "patient@dhms.in",
        "first_name": "Suresh",
        "last_name":  "Patient",
        "role":       "patient",
        "district":   district,
        "phone":      "+91 9900000001",
    },
)
patient_user.set_password("patient123")
patient_user.save()

print("  ✓ Users seeded (admin@dhms.in / admin123, staff@dhms.in / staff123, patient@dhms.in / patient123)")

print("\n✅ DHMS seed data complete!")
print("   Run the dev server: python manage.py runserver")
print("   Django admin:       http://localhost:8000/admin/")
print("   API login:          POST http://localhost:8000/api/auth/login/")
