"""
Management command: python manage.py import_stock <file.xlsx>

Expected Excel columns:
  hospital_name | medicine | unit | current_qty | ordered | dispensed | threshold

Usage:
  python manage.py import_stock data/stock.xlsx
"""
import pandas as pd
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from core.models import Hospital, StockItem, StockHistory


class Command(BaseCommand):
    help = "Import medicine stock from an Excel file into the DHMS database."

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

        required_columns = {"hospital_name", "medicine", "unit", "current_qty", "threshold"}
        missing = required_columns - set(df.columns.str.strip().str.lower())
        if missing:
            raise CommandError(f"Missing required columns: {missing}")

        df.columns = df.columns.str.strip().str.lower()
        imported = 0
        skipped  = 0
        today    = timezone.localdate()

        for idx, row in df.iterrows():
            row_num = idx + 2  # Excel row (1-indexed + header)
            try:
                hospital_name = str(row["hospital_name"]).strip()
                try:
                    hospital = Hospital.objects.get(name=hospital_name)
                except Hospital.DoesNotExist:
                    self.stderr.write(
                        self.style.WARNING(f"  Row {row_num}: Hospital '{hospital_name}' not found — skipped.")
                    )
                    skipped += 1
                    continue

                item, created = StockItem.objects.update_or_create(
                    hospital=hospital,
                    medicine=str(row["medicine"]).strip(),
                    defaults={
                        "unit":        str(row.get("unit", "tabs")).strip(),
                        "current_qty": int(row["current_qty"]),
                        "ordered":     int(row.get("ordered", 0)),
                        "dispensed":   int(row.get("dispensed", 0)),
                        "threshold":   int(row["threshold"]),
                    },
                )

                # Record stock history snapshot
                StockHistory.objects.get_or_create(
                    stock_item=item,
                    date=today,
                    defaults={"qty": item.current_qty},
                )

                action = "Created" if created else "Updated"
                self.stdout.write(f"  Row {row_num}: {action} — {item.medicine} @ {hospital_name}")
                imported += 1

            except Exception as e:
                self.stderr.write(self.style.ERROR(f"  Row {row_num}: ERROR — {e}"))
                skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ Done. Imported: {imported} | Skipped/Errors: {skipped}"
            )
        )
