#!/bin/bash
# RunPod RAG System Setup Script
# Run this after connecting to your RunPod instance

set -e  # Exit on error

echo "🚀 Starting RunPod RAG Setup..."

# Update system
apt-get update
apt-get install -y git wget curl vim

# Install Python dependencies
pip install --upgrade pip

echo "📦 Installing core dependencies..."
pip install \
    langchain==0.1.0 \
    langchain-community==0.0.10 \
    qdrant-client==1.7.0 \
    sentence-transformers==2.3.1 \
    vllm==0.2.7 \
    fastapi==0.109.0 \
    uvicorn==0.27.0 \
    python-multipart==0.0.6 \
    pydantic==2.5.3 \
    transformers==4.36.2 \
    accelerate==0.25.0 \
    bitsandbytes==0.41.3 \
    unstructured==0.11.8 \
    pymupdf==1.23.8 \
    python-docx==1.1.0 \
    openpyxl==3.1.2

echo "🐳 Setting up Qdrant vector database..."
# Install Docker if not present
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

# Start Qdrant
docker run -d \
    --name qdrant \
    -p 6333:6333 \
    -p 6334:6334 \
    -v $(pwd)/qdrant_storage:/qdrant/storage:z \
    qdrant/qdrant

echo "⏳ Waiting for Qdrant to start..."
sleep 5

# Check Qdrant is running
curl -s http://localhost:6333/collections || echo "Warning: Qdrant not responding yet"

echo "📚 Creating project structure..."
mkdir -p /workspace/rag_project/{models,documents,src,data}
cd /workspace/rag_project

echo "🤖 Downloading models (this may take 10-30 minutes)..."

# Download small model (8B)
echo "Downloading Llama 3.1 8B..."
huggingface-cli download \
    meta-llama/Llama-3.1-8B-Instruct \
    --local-dir /workspace/rag_project/models/llama-3.1-8b \
    --local-dir-use-symlinks False

# Download embedding model
echo "Downloading embedding model..."
python3 << 'EOF'
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('intfloat/multilingual-e5-large')
model.save('/workspace/rag_project/models/embeddings')
print("✅ Embedding model downloaded")
EOF

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Upload your documents to: /workspace/rag_project/documents/"
echo "2. Run the indexing script: python src/index_documents.py"
echo "3. Start the chat server: python src/api_server.py"
echo ""
echo "🌐 Access URLs:"
echo "   - API: http://[your-runpod-id].runpod.net:8000"
echo "   - Docs: http://[your-runpod-id].runpod.net:8000/docs"
echo "   - Qdrant: http://localhost:6333/dashboard"
