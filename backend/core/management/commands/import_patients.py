"""
Management command: python manage.py import_patients <file.xlsx>

Expected Excel columns:
  name | email | phone | dob | gender | blood_group | emergency_contact | district_code

All created users have role='patient' and password='changeme@123'
(In production, trigger a password-reset email instead.)

Usage:
  python manage.py import_patients data/patients.xlsx
"""
import pandas as pd
from django.core.management.base import BaseCommand, CommandError

from core.models import District, User


class Command(BaseCommand):
    help = "Import patient records from an Excel file into the DHMS database."

    def add_arguments(self, parser):
        parser.add_argument(
            "file_path",
            type=str,
            help="Path to the Excel file (.xlsx)",
        )

    def handle(self, *args, **options):
        file_path = options["file_path"]

        try:
            df = pd.read_excel(file_path)
        except FileNotFoundError:
            raise CommandError(f"File not found: {file_path}")
        except Exception as e:
            raise CommandError(f"Failed to read Excel file: {e}")

        df.columns = df.columns.str.strip().str.lower()

        if "name" not in df.columns or "email" not in df.columns:
            raise CommandError("Excel file must have at least 'name' and 'email' columns.")

        imported = 0
        skipped  = 0

        for idx, row in df.iterrows():
            row_num = idx + 2
            try:
                email = str(row["email"]).strip().lower()

                if User.objects.filter(email=email).exists():
                    self.stderr.write(
                        self.style.WARNING(f"  Row {row_num}: {email} already exists — skipped.")
                    )
                    skipped += 1
                    continue

                name_parts = str(row.get("name", "")).strip().split(" ", 1)
                first = name_parts[0]
                last  = name_parts[1] if len(name_parts) > 1 else ""

                district = None
                district_code = str(row.get("district_code", "")).strip().upper()
                if district_code:
                    district = District.objects.filter(code=district_code).first()
                    if not district:
                        self.stderr.write(
                            self.style.WARNING(
                                f"  Row {row_num}: District code '{district_code}' not found — "
                                "patient created without district."
                            )
                        )

                user = User(
                    username=email,
                    email=email,
                    first_name=first,
                    last_name=last,
                    role=User.ROLE_PATIENT,
                    district=district,
                    phone=str(row.get("phone", "")).strip(),
                    gender=str(row.get("gender", "")).strip(),
                    blood_group=str(row.get("blood_group", "")).strip(),
                    emergency_contact=str(row.get("emergency_contact", "")).strip(),
                )

                if "dob" in row and pd.notna(row["dob"]):
                    user.dob = pd.to_datetime(row["dob"]).date()

                # TODO: In production — send a password reset email instead
                user.set_password("changeme@123")
                user.save()

                self.stdout.write(f"  Row {row_num}: Created patient — {email}")
                imported += 1

            except Exception as e:
                self.stderr.write(self.style.ERROR(f"  Row {row_num}: ERROR — {e}"))
                skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ Done. Imported: {imported} | Skipped/Errors: {skipped}"
            )
        )
