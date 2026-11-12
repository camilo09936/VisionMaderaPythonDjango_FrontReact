from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (Usuario, EstadoCita, BloqueHorario, Sede, TipoPqrs, Pqrs, Calificacion, Disenador, AgendaDisenador, Cita, EstadoPqrs)

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'
        extra_kwargs = {'contrasena': {'write_only': True}}

    def validate_correo(self, value):
        existe = User.objects.filter(username__iexact=value)
        if self.instance:
            existe = existe.exclude(username=self.instance.correo)
        if existe.exists():
            raise serializers.ValidationError('Este correo ya está registrado.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        clave = validated_data['contrasena']
        validated_data['contrasena'] = make_password(clave)
        usuario = super().create(validated_data)
        User.objects.create_user(username=usuario.correo, email=usuario.correo, password=clave)
        return usuario

    @transaction.atomic
    def update(self, instance, validated_data):
        correo_anterior = instance.correo
        clave = validated_data.get('contrasena')
        if clave:
            validated_data['contrasena'] = make_password(clave)
        usuario = super().update(instance, validated_data)
        user = User.objects.filter(username=correo_anterior).first()
        if user:
            user.username = user.email = usuario.correo
            if clave:
                user.set_password(clave)
            user.save()
        return usuario

class EstadoCitaSerializer(serializers.ModelSerializer):
    class Meta:
        model= EstadoCita
        fields= '__all__'
        
class BloqueHorarioSerializer(serializers.ModelSerializer):
    class Meta:
        model= BloqueHorario
        fields= '__all__'
        
class SedeSerializer(serializers.ModelSerializer):
    class Meta:
        model= Sede
        fields= '__all__'

class TipoPqrsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoPqrs
        fields = '__all__'
        
class EstadoPqrsSerializer(serializers.ModelSerializer):
    class Meta:
        model= EstadoPqrs
        fields= '__all__'
        
class PqrsSerializer(serializers.ModelSerializer):
    class Meta:
        model= Pqrs
        fields= '__all__'

class CalificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calificacion
        fields = '__all__'

class DisenadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disenador
        fields = '__all__'

class AgendaDisenadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgendaDisenador
        fields = '__all__'

class CitaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cita
        fields = '__all__'
        
class TokenConUsuarioSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        u = Usuario.objects.filter(correo=self.user.username).first()
        data['usuario'] = {
            'documento': u.documento,
            'nombre1': u.nombre1,
            'apellido1': u.apellido1,
        } if u else None
        return data