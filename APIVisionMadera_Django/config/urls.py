"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from visionmadera.views import (UsuarioViewSet, EstadoCitaViewSet, BloqueHorarioViewSet, SedeViewSet, TipoPqrsViewSet, PqrsViewSet, CalificacionViewSet, DisenadorViewSet, AgendaDisenadorViewSet, CitaViewSet, EstadoPqrsViewSet, TokenConUsuarioView)

router = DefaultRouter()
router.register('usuarios', UsuarioViewSet)
router.register('estados-cita', EstadoCitaViewSet)
router.register('bloques-horario', BloqueHorarioViewSet)
router.register('sedes', SedeViewSet)
router.register('tipos-pqrs', TipoPqrsViewSet)
router.register('estados-pqrs', EstadoPqrsViewSet)
router.register('pqrs', PqrsViewSet)
router.register('calificaciones', CalificacionViewSet)
router.register('disenadores', DisenadorViewSet)
router.register('agenda-disenadores', AgendaDisenadorViewSet)
router.register('citas', CitaViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/', TokenConUsuarioView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/ia/', include('ia.urls')),
]