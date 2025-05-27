from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer

# Create your views here.

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    
    # Bessere Fehlermeldungen für häufige Probleme
    errors = serializer.errors
    if 'email' in errors:
        for error in errors['email']:
            if 'already exists' in str(error) or 'unique' in str(error):
                errors['email'] = ['Diese E-Mail-Adresse ist bereits registriert.']
    
    if 'username' in errors:
        for error in errors['username']:
            if 'already exists' in str(error) or 'unique' in str(error):
                errors['username'] = ['Dieser Benutzername ist bereits vergeben.']
    
    return Response(errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_balance(request):
    """
    Aktualisiert den Kontostand des Benutzers.
    Erwartet: { "amount": 100.50, "operation": "add" oder "subtract" oder "set" }
    """
    try:
        amount = float(request.data.get('amount', 0))
        operation = request.data.get('operation', 'add')
        description = request.data.get('description', '')
        
        if amount < 0:
            return Response({'error': 'Betrag muss positiv sein'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        old_balance = float(user.balance)
        
        if operation == 'add':
            user.balance += amount
        elif operation == 'subtract':
            if user.balance < amount:
                return Response({'error': 'Nicht genügend Guthaben'}, status=status.HTTP_400_BAD_REQUEST)
            user.balance -= amount
        elif operation == 'set':
            user.balance = amount
        else:
            return Response({'error': 'Ungültige Operation. Verwende "add", "subtract" oder "set"'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.save()
        
        return Response({
            'message': 'Kontostand erfolgreich aktualisiert',
            'old_balance': old_balance,
            'new_balance': float(user.balance),
            'amount': amount,
            'operation': operation,
            'description': description
        }, status=status.HTTP_200_OK)
        
    except (ValueError, TypeError):
        return Response({'error': 'Ungültiger Betrag'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
