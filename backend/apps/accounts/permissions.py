from rest_framework.permissions import BasePermission


class IsMechanic(BasePermission):
    """Only allow mechanics to access the view."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'mechanic'
        )


class IsUser(BasePermission):
    """Only allow regular users to access the view."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'user'
        )
