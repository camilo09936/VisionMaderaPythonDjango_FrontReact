
from visionmadera.models import (
    Sede,
    Disenador,
    AgendaDisenador,
    BloqueHorario,
    EstadoCita,
    TipoPqrs,
    EstadoPqrs,
)

from ia.services.embeddings import EmbeddingService
from ia.vectorstore.chroma_store import ChromaStore


class BusquedaSemantica:

    MODELOS = {
        "sede": Sede,
        "disenador": Disenador,
        "agenda": AgendaDisenador,
        "bloque": BloqueHorario,
        "estado_cita": EstadoCita,
        "tipo_pqrs": TipoPqrs,
        "estado_pqrs": EstadoPqrs,
    }

    # 1. OBTENER UN REGISTRO DESDE SQL SERVER

    @staticmethod
    def obtener_registro(tipo, registro_id):

        modelo = BusquedaSemantica.MODELOS.get(tipo)

        if modelo is None:
            return None

        queryset = modelo.objects.all()

        if tipo == "disenador":
            queryset = queryset.select_related("sede")

        elif tipo == "agenda":
            queryset = queryset.select_related(
                "disenador",
                "disenador__sede",
                "bloque",
            )

        return queryset.filter(pk=registro_id).first()

    # 2. CONSTRUIR TEXTO PARA GENERAR EL EMBEDDING

    @staticmethod
    def construir_texto(tipo, objeto):

        if tipo == "sede":

            return (
                f"Sede de VisionMadera: {objeto.nombre}. "
                f"Dirección: {objeto.direccion}. "
                f"Teléfono: {objeto.telefono}. "
                f"Información de ubicación y contacto de la sede."
            )

        elif tipo == "disenador":

            return (
                f"Diseñador de VisionMadera: "
                f"{objeto.nombre} {objeto.apellido}. "
                f"Trabaja en la sede {objeto.sede.nombre}. "
                f"Dirección de la sede: {objeto.sede.direccion}. "
                f"Información sobre el personal de diseño y su sede."
            )

        elif tipo == "agenda":

            disenador = objeto.disenador
            bloque = objeto.bloque

            return (
                f"Agenda de atención de VisionMadera. "
                f"Diseñador: {disenador.nombre} "
                f"{disenador.apellido}. "
                f"Sede: {disenador.sede.nombre}. "
                f"Día de atención: {objeto.dia_semana}. "
                f"Horario: desde las {bloque.hora_inicio} "
                f"hasta las {bloque.hora_fin}. "
                f"Información sobre los días y horarios habituales "
                f"de atención del diseñador."
            )

        elif tipo == "bloque":

            return (
                f"Bloque de horario de VisionMadera. "
                f"Hora de inicio: {objeto.hora_inicio}. "
                f"Hora de finalización: {objeto.hora_fin}. "
                f"Franja horaria disponible para configurar agendas."
            )

        elif tipo == "estado_cita":

            return (
                f"Estado de una cita de VisionMadera: "
                f"{objeto.nombre}. "
                f"Información general sobre los estados "
                f"que puede tener una cita."
            )

        elif tipo == "tipo_pqrs":

            return (
                f"Tipo de solicitud o PQRS de VisionMadera: "
                f"{objeto.nombre}. "
                f"Categoría de solicitudes, peticiones, quejas, "
                f"reclamos o sugerencias de los clientes."
            )

        elif tipo == "estado_pqrs":

            return (
                f"Estado de una PQRS de VisionMadera: "
                f"{objeto.nombre}. "
                f"Información general sobre los estados "
                f"de las solicitudes de los clientes."
            )

        return ""

    # 3. IDENTIFICADOR ÚNICO PARA CHROMADB

    @staticmethod
    def construir_id(tipo, registro_id):

        return f"{tipo}_{registro_id}"

    # 4. CONSTRUIR METADATOS

    @staticmethod
    def construir_metadata(tipo, objeto):

        return {
            "tipo": tipo,
            "objeto_id": int(objeto.pk),
        }

    # 5. INDEXAR TODOS LOS REGISTROS

    @staticmethod
    def indexar_todos():

        coleccion = ChromaStore.obtener_coleccion()

        total = 0
        errores = []

        lote = []

        for tipo, modelo in BusquedaSemantica.MODELOS.items():

            registros = modelo.objects.all().order_by("pk")

            for objeto in registros:

                texto = BusquedaSemantica.construir_texto(
                    tipo,
                    objeto
                )

                if not texto.strip():
                    continue

                lote.append({
                    "tipo": tipo,
                    "objeto": objeto,
                    "texto": texto,
                })

                if len(lote) == 32:

                    total, errores = (
                        BusquedaSemantica._procesar_lote(
                            lote,
                            coleccion,
                            total,
                            errores
                        )
                    )

                    lote = []

        if lote:

            total, errores = (
                BusquedaSemantica._procesar_lote(
                    lote,
                    coleccion,
                    total,
                    errores
                )
            )

        return {
            "total_indexados": total,
            "errores": errores,
        }

    # 6. PROCESAR LOTES DE REGISTROS

    @staticmethod
    def _procesar_lote(lote, coleccion, total, errores):

        try:

            textos = [
                elemento["texto"]
                for elemento in lote
            ]

            embeddings = (
                EmbeddingService.generar_embeddings(textos)
            )

            coleccion.upsert(
                ids=[
                    BusquedaSemantica.construir_id(
                        elemento["tipo"],
                        elemento["objeto"].pk
                    )
                    for elemento in lote
                ],

                embeddings=embeddings,

                documents=textos,

                metadatas=[
                    BusquedaSemantica.construir_metadata(
                        elemento["tipo"],
                        elemento["objeto"]
                    )
                    for elemento in lote
                ],
            )

            total += len(lote)

        except Exception as error:

            errores.append(str(error))

        return total, errores

    # 7. INDEXAR UN REGISTRO INDIVIDUAL

    @staticmethod
    def indexar_registro(tipo, registro_id):

        coleccion = ChromaStore.obtener_coleccion()

        objeto = BusquedaSemantica.obtener_registro(
            tipo,
            registro_id
        )

        if objeto is None:

            BusquedaSemantica.eliminar_registro(
                tipo,
                registro_id
            )

            return

        texto = BusquedaSemantica.construir_texto(
            tipo,
            objeto
        )

        embeddings = EmbeddingService.generar_embeddings(
            [texto]
        )

        coleccion.upsert(
            ids=[
                BusquedaSemantica.construir_id(
                    tipo,
                    registro_id
                )
            ],

            embeddings=embeddings,

            documents=[texto],

            metadatas=[
                BusquedaSemantica.construir_metadata(
                    tipo,
                    objeto
                )
            ],
        )

    # 8. ELIMINAR UN REGISTRO DE CHROMADB

    @staticmethod
    def eliminar_registro(tipo, registro_id):

        coleccion = ChromaStore.obtener_coleccion()

        identificador = (
            BusquedaSemantica.construir_id(
                tipo,
                registro_id
            )
        )

        coleccion.delete(
            ids=[identificador]
        )

    # 9. BUSCAR INFORMACIÓN SEMÁNTICAMENTE

    @staticmethod
    def buscar_informacion(pregunta, cantidad=5):

        if not pregunta or not pregunta.strip():

            raise ValueError(
                "Debes ingresar una pregunta."
            )

        if cantidad < 1:

            raise ValueError(
                "La cantidad debe ser mayor que cero."
            )

        coleccion = ChromaStore.obtener_coleccion()

        total_indexados = coleccion.count()

        if total_indexados == 0:
            return []

        embeddings = EmbeddingService.generar_embeddings(
            [pregunta]
        )

        embedding = embeddings[0]

        resultados = coleccion.query(
            query_embeddings=[embedding],
            n_results=min(cantidad, total_indexados),
            include=[
                "metadatas",
                "distances",
                "documents",
            ],
        )

        ids = resultados.get("ids", [[]])[0]

        metadatas = resultados.get(
            "metadatas",
            [[]]
        )[0]

        documents = resultados.get(
            "documents",
            [[]]
        )[0]

        distances = resultados.get(
            "distances",
            [[]]
        )[0]

        informacion = []

        for indice, identificador in enumerate(ids):

            metadata = metadatas[indice]

            tipo = metadata["tipo"]

            objeto_id = metadata["objeto_id"]

            # Recuperar el registro actual desde SQL Server
            objeto = BusquedaSemantica.obtener_registro(
                tipo,
                objeto_id
            )

            # Ignorar registros que ya no existen en SQL Server
            if objeto is None:
                continue

            # Construir nuevamente el texto con datos actuales
            contenido = BusquedaSemantica.construir_texto(
                tipo,
                objeto
            )

            informacion.append({
                "id": identificador,
                "tipo": tipo,
                "objeto_id": objeto_id,
                "contenido": contenido,
                "distancia": distances[indice],
            })

        return informacion