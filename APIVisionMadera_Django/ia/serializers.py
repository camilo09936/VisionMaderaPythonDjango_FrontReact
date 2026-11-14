
from rest_framework import serializers

from .models import Conversacion, Mensaje


class PreguntaSerializer(serializers.Serializer):
    pregunta = serializers.CharField(
        required=True,
        min_length=3,
        max_length=1000,
        trim_whitespace=True,
        error_messages={
            "required": "Debes ingresar una pregunta.",
            "min_length": "La pregunta debe tener al menos 3 caracteres.",
            "max_length": "La pregunta no puede superar los 1000 caracteres.",
        },
    )


class RespuestaSerializer(serializers.Serializer):
    respuesta = serializers.CharField()
    modelo = serializers.CharField()
    sedes_consultadas = serializers.IntegerField()
    disenadores_consultados = serializers.IntegerField()
    horarios_disponibles_consultados = serializers.IntegerField()


class MensajeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mensaje
        fields = [
            "id",
            "rol",
            "contenido",
            "fecha_creacion",
        ]
        read_only_fields = fields


class ConversacionSerializer(serializers.ModelSerializer):
    mensajes = MensajeSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Conversacion
        fields = [
            "id",
            "titulo",
            "fecha_creacion",
            "fecha_actualizacion",
            "mensajes",
        ]
        read_only_fields = fields
