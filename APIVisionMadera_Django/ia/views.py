import logging

from django.db import transaction
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Conversacion, Mensaje

from .serializers import (PreguntaSerializer, RespuestaSerializer, MensajeSerializer, ConversacionSerializer,)
from .services.asistente import AsistenteVisionMadera
from ia.services.busqueda_semantica import BusquedaSemantica

logger = logging.getLogger(__name__)

class AsistenteVisionMaderaView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = PreguntaSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        pregunta = serializer.validated_data["pregunta"]

        try:
            resultado = AsistenteVisionMadera.generar_respuesta(
                pregunta
            )

            respuesta_serializer = RespuestaSerializer(
                data=resultado
            )

            respuesta_serializer.is_valid(raise_exception=True)

            return Response(
                respuesta_serializer.data,
                status=status.HTTP_200_OK,
            )

        except RuntimeError as error:

            logger.warning(
                "Error en el asistente de VisionMadera: %s",
                error,
            )

            return Response(
                {"error": str(error)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        except Exception:

            logger.exception(
                "Error inesperado en el asistente de VisionMadera"
            )

            return Response(
                {"error": "No fue posible procesar la consulta."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# Sistema de conversaciones
class ConversacionViewSet(viewsets.ModelViewSet):

    serializer_class = ConversacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        # Cada usuario solamente consulta sus propias conversaciones
        return (
            Conversacion.objects
            .filter(usuario=self.request.user)
            .prefetch_related("mensajes")
            .order_by("-fecha_actualizacion")
        )

    def perform_create(self, serializer):

        # La conversación queda asociada al usuario autenticado
        serializer.save(usuario=self.request.user)

    @action(
        detail=True,
        methods=["get", "post"],
        url_path="mensajes",
    )
    def mensajes(self, request, pk=None):

        conversacion = self.get_object()

        # GET: consultar el historial.
        if request.method == "GET":

            mensajes = conversacion.mensajes.all()

            serializer = MensajeSerializer(
                mensajes,
                many=True,
            )

            return Response(serializer.data)

        # POST: enviar una pregunta
        serializer = PreguntaSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        pregunta = serializer.validated_data["pregunta"]

        # Recuperar los últimos 10 mensajes anteriores
        historial = list(
            conversacion.mensajes
            .order_by("-fecha_creacion", "-id")
            .values("rol", "contenido")[:10]
        )

        # El modelo debe recibirlos en orden cronológico
        historial.reverse()

        try:

            resultado = AsistenteVisionMadera.generar_respuesta(
                pregunta,
                historial,
            )

            respuesta = resultado["respuesta"]
            modelo = resultado["modelo"]

            # Guardar pregunta y respuesta juntas
            with transaction.atomic():

                Mensaje.objects.create(
                    conversacion=conversacion,
                    rol="USUARIO",
                    contenido=pregunta,
                )

                mensaje_asistente = Mensaje.objects.create(
                    conversacion=conversacion,
                    rol="ASISTENTE",
                    contenido=respuesta,
                )

                # El primer mensaje define el título
                if conversacion.titulo == "Nueva conversación":
                    conversacion.titulo = pregunta[:150]

                conversacion.fecha_actualizacion = timezone.now()

                conversacion.save(
                    update_fields=[
                        "titulo",
                        "fecha_actualizacion",
                    ]
                )

            return Response(
                {
                    "conversacion": conversacion.id,
                    "pregunta": pregunta,
                    "respuesta": respuesta,
                    "modelo": modelo,
                    "mensaje_id": mensaje_asistente.id,
                },
                status=status.HTTP_200_OK,
            )

        except RuntimeError as error:

            logger.warning(
                "Error procesando mensaje de conversación: %s",
                error,
            )

            return Response(
                {"error": str(error)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        except Exception:

            logger.exception(
                "Error inesperado procesando mensaje de conversación"
            )

            return Response(
                {"error": "No fue posible procesar el mensaje."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class BusquedaSemanticaView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        pregunta = request.query_params.get(
            "q",
            ""
        ).strip()

        cantidad = request.query_params.get(
            "cantidad",
            5
        )

        if not pregunta:

            return Response(
                {
                    "error": "Debes ingresar una pregunta."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            cantidad = int(cantidad)

            if cantidad < 1 or cantidad > 20:
                raise ValueError

        except (ValueError, TypeError):

            return Response(
                {
                    "error": "La cantidad debe estar entre 1 y 20."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            resultados = (
                BusquedaSemantica.buscar_informacion(
                    pregunta,
                    cantidad
                )
            )

            return Response(
                {
                    "pregunta": pregunta,
                    "total_resultados": len(resultados),
                    "resultados": resultados,
                },
                status=status.HTTP_200_OK
            )

        except RuntimeError:

            return Response(
                {
                    "error": (
                        "No fue posible realizar la búsqueda semántica."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        except Exception:

            return Response(
                {
                    "error": (
                        "Ocurrió un error al realizar la búsqueda."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
