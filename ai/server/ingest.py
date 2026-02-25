#!/usr/bin/env python3
"""
Document Ingestion Script for Cherenkov AI.
Run this to ingest/update the knowledge base.

Usage:
    python ingest.py
"""
from rag_pipeline import RAGPipeline


def main():
    print("=" * 50)
    print("Cherenkov AI - Knowledge Base Ingestion")
    print("=" * 50)
    print()
    
    pipeline = RAGPipeline()
    
    try:
        num_chunks = pipeline.ingest_documents()
        print()
        print("✓ Ingestion complete!")
        print(f"  Total chunks indexed: {num_chunks}")
    except FileNotFoundError as e:
        print(f"✗ Error: {e}")
        print("  Make sure the knowledge directory exists and contains .md files.")
        return 1
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
