
import logging

from django.db import transaction
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from visionmadera.models import (
    Sede,
    Disenador,
    AgendaDisenador,
    BloqueHorario,
    EstadoCita,
    TipoPqrs,
    EstadoPqrs,
)

from ia.services.busqueda_semantica import BusquedaSemantica


logger = logging.getLogger(__name__)


MODELOS_SEMANTICOS = [
    (Sede, "sede"),
    (Disenador, "disenador"),
    (AgendaDisenador, "agenda"),
    (BloqueHorario, "bloque"),
    (EstadoCita, "estado_cita"),
    (TipoPqrs, "tipo_pqrs"),
    (EstadoPqrs, "estado_pqrs"),
]


def sincronizar_registro(tipo, registro_id):

    try:

        BusquedaSemantica.indexar_registro(
            tipo,
            registro_id
        )

    except Exception:

        logger.exception(
            "Error al sincronizar %s con ID %s en ChromaDB",
            tipo,
            registro_id
        )


def eliminar_registro(tipo, registro_id):

    try:

        BusquedaSemantica.eliminar_registro(
            tipo,
            registro_id
        )

    except Exception:

        logger.exception(
            "Error al eliminar %s con ID %s de ChromaDB",
            tipo,
            registro_id
        )


for modelo, tipo in MODELOS_SEMANTICOS:

    def crear_receptor_guardado(modelo_tipo):

        @receiver(post_save, sender=modelo_tipo[0], weak=False)
        def receptor_guardado(
            sender,
            instance,
            created,
            **kwargs
        ):

            tipo_actual = modelo_tipo[1]
            registro_id = instance.pk

            transaction.on_commit(
                lambda tipo=tipo_actual, pk=registro_id: (
                    sincronizar_registro(tipo, pk)
                ),
                robust=True
            )

        return receptor_guardado

    def crear_receptor_eliminado(modelo_tipo):

        @receiver(post_delete, sender=modelo_tipo[0], weak=False)
        def receptor_eliminado(
            sender,
            instance,
            **kwargs
        ):

            tipo_actual = modelo_tipo[1]
            registro_id = instance.pk

            transaction.on_commit(
                lambda tipo=tipo_actual, pk=registro_id: (
                    eliminar_registro(tipo, pk)
                ),
                robust=True
            )

        return receptor_eliminado

    crear_receptor_guardado((modelo, tipo))
    crear_receptor_eliminado((modelo, tipo))
