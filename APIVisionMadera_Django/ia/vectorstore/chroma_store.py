import chromadb
from django.conf import settings

class ChromaStore:
    @staticmethod
    def obtener_coleccion():
        cliente= chromadb.PersistentClient(
            path= str(settings.CHROMA_PERSIST_DIRECTORY)
        )
        colecction= cliente.get_or_create_collection(
            name= settings.CHROMA_COLLECTION,
            metadata={
                "hnsw:space": "cosine"
            }
        )

        return colecction