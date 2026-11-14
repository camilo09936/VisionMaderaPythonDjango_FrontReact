import logging
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import (
    PreguntaSerializer,
    RespuestaSerializer,
)
from .services.asistente import TablonAsistente

logger = logging.getLogger(__name__)

class TablonAsistenteView(APIView):
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
            resultado = TablonAsistente.generar_respuesta(pregunta)
            respuesta_serializer = RespuestaSerializer(data=resultado)
            respuesta_serializer.is_valid(raise_exception=True)
            return Response(
                respuesta_serializer.data,
                status=status.HTTP_200_OK,
            )
        except RuntimeError as error:
            logger.warning(
                "Error en Tablón (asistente de Madecentro): %s",
                error,
            )
            return Response(
                {"error": str(error)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception:
            logger.exception(
                "Error inesperado en Tablón (asistente de Madecentro)"
            )
            return Response(
                {"error": "No fue posible procesar la consulta."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )