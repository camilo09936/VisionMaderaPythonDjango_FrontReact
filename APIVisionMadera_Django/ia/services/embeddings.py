
import requests

from django.conf import settings

class EmbeddingService:

    @staticmethod
    def generar_embeddings(textos):

        if not textos:
            return []

        url = (
            settings.OLLAMA_CONFIG["BASE_URL"].rstrip("/")
            + "/api/embed"
        )

        payload = {
            "model": settings.OLLAMA_EMBEDDING_MODEL,
            "input": textos,
        }

        try:
            response = requests.post(
                url,
                json=payload,
                timeout=settings.OLLAMA_CONFIG["TIMEOUT"],
            )

            response.raise_for_status()

            resultado = response.json()

            embeddings = resultado.get("embeddings")

            if (
                not embeddings
                or len(embeddings) != len(textos)
            ):
                raise RuntimeError(
                    "Ollama no devolvió todos los embeddings."
                )

            return embeddings

        except requests.Timeout:
            raise RuntimeError(
                "El servicio de embeddings tardó demasiado."
            )

        except requests.ConnectionError:
            raise RuntimeError(
                "No fue posible conectar con Ollama."
            )

        except requests.RequestException as error:
            raise RuntimeError(
                f"Error al generar embeddings: {error}"
            )
