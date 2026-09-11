import chromadb
from chromadb.config import Settings as ChromaSettings
from backend.config import settings
import logging

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PATH,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self.collection = self.client.get_or_create_collection(
            name="docmind_documents",
            metadata={"description": "Document chunks for semantic search"}
        )

    def add_chunks(self, doc_id: str, chunks: list[str], metadatas: list[dict] = None):
        if not chunks:
            return
        
        ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
        meta = []
        for i, m in enumerate(metadatas or [{}] * len(chunks)):
            item = dict(m)
            item["doc_id"] = doc_id
            item["chunk_index"] = i
            # Chroma metadata values must be primitive types (str, int, float, bool)
            safe_meta = {k: str(v) if isinstance(v, (list, dict)) else v for k, v in item.items()}
            meta.append(safe_meta)
        
        self.collection.upsert(
            ids=ids,
            documents=chunks,
            metadatas=meta
        )

    def search(self, query: str, n_results: int = 5, where: dict = None):
        try:
            kwargs = {
                "query_texts": [query],
                "n_results": min(n_results, max(1, self.collection.count()))
            }
            if where:
                kwargs["where"] = where
            
            results = self.collection.query(**kwargs)
            formatted = []
            if results and results.get("documents") and len(results["documents"]) > 0:
                docs = results["documents"][0]
                metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
                dists = results["distances"][0] if results.get("distances") else [0.0] * len(docs)
                ids = results["ids"][0] if results.get("ids") else [""] * len(docs)
                
                for doc, meta, dist, chunk_id in zip(docs, metas, dists, ids):
                    # Chroma distances are cosine distances (0 is closest, 1 is orthogonal, 2 is opposite)
                    # Convert to similarity score between 0 and 1
                    sim_score = max(0.0, min(1.0, 1.0 - (dist / 2.0)))
                    formatted.append({
                        "chunk_id": chunk_id,
                        "doc_id": meta.get("doc_id", ""),
                        "snippet": doc,
                        "metadata": meta,
                        "relevance_score": round(sim_score, 3)
                    })
            return formatted
        except Exception as e:
            logger.error(f"Error querying vector store: {e}")
            return []

    def delete_document(self, doc_id: str):
        try:
            self.collection.delete(where={"doc_id": doc_id})
        except Exception as e:
            logger.warning(f"Error deleting chunks for doc_id {doc_id}: {e}")

vector_store = VectorStore()
