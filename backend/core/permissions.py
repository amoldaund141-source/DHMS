"""
DHMS Custom Permissions.

Role scoping rules (enforced in every view):
  - admin (non-state): Hospital.objects.filter(district=request.user.district)
  - is_state_admin:    Hospital.objects.all()
  - staff:             request.user.hospital only
  - patient:           their own appointments only
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """Allows access only to admin role users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "admin"
        )


class IsStaff(BasePermission):
    """Allows access only to staff role users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "staff"
        )


class IsPatient(BasePermission):
    """Allows access only to patient role users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "patient"
        )


class IsAdminOrStaff(BasePermission):
    """Allows access to admin or staff users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ("admin", "staff")
        )


class IsAdminOrReadOnly(BasePermission):
    """Read for all authenticated, write only for admin."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "admin"
        )


class ScopedToDistrict(BasePermission):
    """
    Non-state admins must have a district.
    State admins pass everything.
    Staff pass (they are scoped to hospital, not district).
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role == "admin" and not request.user.is_state_admin:
            return bool(request.user.district_id)
        return True


class ScopedToHospital(BasePermission):
    """Staff must have a hospital assigned."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role == "staff":
            return bool(request.user.hospital_id)
        return True
