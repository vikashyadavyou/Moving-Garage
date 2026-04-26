from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import MechanicProfile

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'role',
        ]

    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        if data.get('role') == 'admin':
            raise serializers.ValidationError(
                {"role": "Cannot register as admin."}
            )
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Auto-create mechanic profile if role is mechanic
        if user.role == 'mechanic':
            MechanicProfile.objects.create(user=user)

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'role', 'avatar',
        ]
        read_only_fields = ['id', 'role']


class MechanicProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = MechanicProfile
        fields = [
            'id', 'user', 'is_available', 'current_latitude',
            'current_longitude', 'rating', 'total_jobs_completed',
            'specializations', 'experience_years', 'bio',
        ]
        read_only_fields = ['id', 'rating', 'total_jobs_completed']


class MechanicProfileInlineSerializer(serializers.ModelSerializer):
    """Inline serializer for nesting inside user profile (no user nesting)."""

    class Meta:
        model = MechanicProfile
        fields = [
            'id', 'is_available', 'rating', 'total_jobs_completed',
            'specializations', 'experience_years', 'bio',
        ]
        read_only_fields = ['id', 'rating', 'total_jobs_completed']


class ProfileDetailSerializer(serializers.ModelSerializer):
    """Enhanced profile serializer with nested mechanic profile support."""

    mechanic_profile = MechanicProfileInlineSerializer(required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'role', 'avatar', 'mechanic_profile',
        ]
        read_only_fields = ['id', 'username', 'role']

    def update(self, instance, validated_data):
        mechanic_data = validated_data.pop('mechanic_profile', None)

        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update mechanic profile if applicable
        if mechanic_data and instance.role == 'mechanic':
            profile, _ = MechanicProfile.objects.get_or_create(user=instance)
            for attr, value in mechanic_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
