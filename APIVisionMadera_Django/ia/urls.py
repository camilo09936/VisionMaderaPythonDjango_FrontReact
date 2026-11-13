from django.urls import path
from .views import TablonAsistenteView

urlpatterns = [
    path(
        "tablon/",
        TablonAsistenteView.as_view(),
        name="tablon-asistente",
    ),
]