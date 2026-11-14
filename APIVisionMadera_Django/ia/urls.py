from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (AsistenteVisionMaderaView, ConversacionViewSet, BusquedaSemanticaView, )

router= DefaultRouter()

router.register(
    "conversaciones",
    ConversacionViewSet,
    basename="conversacion",
)

urlpatterns=[
    path(
        "tablon/",
        AsistenteVisionMaderaView.as_view(),
        name="asistente-vision-madera",
    ),

    path(
        "buscar-informacion/",
        BusquedaSemanticaView.as_view(),
        name="buscar-informacion"
    ),
]

urlpatterns += router.urls