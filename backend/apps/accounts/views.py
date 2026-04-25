from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model

from .serializers import (
    UserRegistrationSerializer, UserSerializer,
    MechanicProfileSerializer, LoginSerializer,
)
from .models import MechanicProfile
from .permissions import IsMechanic

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ - Register a new user or mechanic."""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """POST /api/v1/auth/login/ - Login with username and password."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )
        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/auth/me/ - View and update user profile."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class MechanicAvailabilityView(APIView):
    """PATCH /api/v1/mechanic/availability/ - Toggle online/offline."""
    permission_classes = [permissions.IsAuthenticated, IsMechanic]

    def patch(self, request):
        profile = request.user.mechanic_profile
        is_available = request.data.get('is_available')
        if is_available is not None:
            profile.is_available = is_available
            profile.save(update_fields=['is_available'])
        return Response(MechanicProfileSerializer(profile).data)


class MechanicLocationView(APIView):
    """PATCH /api/v1/mechanic/location/ - Update GPS coordinates."""
    permission_classes = [permissions.IsAuthenticated, IsMechanic]

    def patch(self, request):
        profile = request.user.mechanic_profile
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        if lat is not None and lng is not None:
            profile.current_latitude = lat
            profile.current_longitude = lng
            profile.save(update_fields=['current_latitude', 'current_longitude'])
        return Response(MechanicProfileSerializer(profile).data)


class MechanicStatsView(APIView):
    """GET /api/v1/mechanic/stats/ - Job stats for mechanic."""
    permission_classes = [permissions.IsAuthenticated, IsMechanic]

    def get(self, request):
        profile = request.user.mechanic_profile
        return Response({
            'total_jobs_completed': profile.total_jobs_completed,
            'rating': str(profile.rating),
            'is_available': profile.is_available,
        })
