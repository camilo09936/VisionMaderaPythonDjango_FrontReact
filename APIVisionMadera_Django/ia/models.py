
from django.db import models
from django.conf import settings


class Conversacion(models.Model):

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversaciones",
    )

    titulo = models.CharField(
        max_length=150,
        default="Nueva conversación",
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"{self.titulo} - {self.usuario}"


class Mensaje(models.Model):

    ROLES = [
        ("USUARIO", "Usuario"),
        ("ASISTENTE", "Asistente"),
    ]

    conversacion = models.ForeignKey(
        Conversacion,
        on_delete=models.CASCADE,
        related_name="mensajes",
    )

    rol = models.CharField(
        max_length=20,
        choices=ROLES,
    )

    contenido = models.TextField()

    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["fecha_creacion", "id"]

    def __str__(self):
        return f"{self.rol}: {self.contenido[:50]}"