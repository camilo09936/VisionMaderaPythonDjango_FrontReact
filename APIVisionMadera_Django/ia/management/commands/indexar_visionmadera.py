
from django.core.management.base import BaseCommand

from ia.services.busqueda_semantica import BusquedaSemantica


class Command(BaseCommand):

    help = "Indexa la información de VisionMadera en ChromaDB"

    def handle(self, *args, **options):

        self.stdout.write(
            "Iniciando indexación de VisionMadera..."
        )

        resultado = BusquedaSemantica.indexar_todos()

        self.stdout.write(
            self.style.SUCCESS(
                f"Registros indexados: "
                f"{resultado['total_indexados']}"
            )
        )

        if resultado["errores"]:

            self.stderr.write(
                self.style.WARNING(
                    "Se presentaron errores durante la indexación:"
                )
            )

            for error in resultado["errores"]:

                self.stderr.write(
                    self.style.ERROR(error)
                )
