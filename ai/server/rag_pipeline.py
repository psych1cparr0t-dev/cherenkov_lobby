"""
RAG Pipeline for Cherenkov AI Concierge.
Stubbed out for Vercel deployment due to serverless size constraints.
"""
from typing import List, Optional

class RAGPipeline:
    """
    Dummy Retrieval-Augmented Generation pipeline.
    """
    def __init__(self):
        pass
    
    def ingest_documents(self):
        return 0
    
    def retrieve(self, query: str, k: int = 3) -> List[str]:
        return []
    
    def get_context_prompt(self, query: str) -> str:
        return ""

# Singleton instance
_pipeline: Optional[RAGPipeline] = None

def get_pipeline() -> RAGPipeline:
    """Get or create the RAG pipeline singleton."""
    global _pipeline
    if _pipeline is None:
        _pipeline = RAGPipeline()
    return _pipeline
