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


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
