# Guide: Adding New Models to WebLLM Project

This guide explains how to add new models to the WebLLM project. The project uses MLC-LLM for model conversion and serves models through a Node.js server.

## Overview

The project consists of three main components:
1. **MLC-LLM Conversion Environment** (`mlc-llm/`) - For converting models to WebAssembly format
2. **AI-Model Server** (`AI-Model/`) - Serves converted models and libraries
3. **WebLLM Components** (`optlite-webllm/webllm-components/`) - Frontend configuration

## Step 1: Model Conversion (Using MLC-LLM)

### Prerequisites
- Docker with NVIDIA container toolkit
- CUDA-compatible GPU (recommended)
- 8GB+ RAM, 20GB+ storage

### 1.1 Convert Model Weights
```bash
# Build the MLC-LLM conversion environment
cd mlc-llm
docker build -t mlc-llm-converter .

# Run the conversion container
docker run --gpus all -it mlc-llm-converter

# Inside the container, convert your model
mlc_llm convert_weight /path/to/your/model --quantization q4f16_1 -o /path/to/output/folder
```

### 1.2 Generate MLC Chat Config
```bash
mlc_llm gen_config /path/to/your/model --quantization q4f16_1 --conv-template [model_template] -o /path/to/output/folder
```

### 1.3 Compile Model Libraries
```bash
mlc_llm compile /path/to/your/model -o /path/to/output/folder
```

**Available quantization options**: `q0f16`, `q0f32`, `q3f16_1`, `q4f16_1`, `q4f32_1`, `q4f16_awq`

## Step 2: Update AI-Model Server

### 2.1 Update `AI-Model/app.js`
Add a new route for your model:

```javascript
// Add your new model route
app.use('/models/Your-New-Model-q4f16_1-MLC/resolve/main/', express.static('./models/Your-New-Model-q4f16_1-MLC/'));

// Example: Adding Qwen2.5-1.5B-Instruct model
app.use('/models/Qwen2.5-1.5B-Instruct-q4f16_1-MLC/resolve/main/', express.static('./models/Qwen2.5-1.5B-Instruct-q4f16_1-MLC/'));
```

### 2.2 Update `AI-Model/Dockerfile`
Add model cloning and library downloading:

```dockerfile
# Clone your converted model
RUN git clone https://huggingface.co/mlc-ai/Your-New-Model-q4f16_1-MLC

# Download the corresponding library
RUN wget https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Your-New-Model-q4f16_1-ctx4k_cs1k-webgpu.wasm
```

## Step 3: Update WebLLM Configuration

### 3.1 Update `optlite-webllm/webllm-components/src/config.ts`
Add your model to the `model_list` array:

```typescript
// For localhost deployment
{
  model: "http://localhost:5050/models/Your-New-Model-q4f16_1-MLC",
  model_id: "Your-New-Model (Localhost)",
  model_lib: "http://localhost:5050/libs/Your-New-Model-q4f16_1-ctx4k_cs1k-webgpu.wasm",
  vram_required_MB: 1500.0, // Calculate based on your model size
  low_resource_required: true, // Set based on requirements
  overrides: {
    context_window_size: 4096,
  }
},

// Example: Qwen2.5-1.5B-Instruct model
{
  model: "http://localhost:5050/models/Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
  model_id: "Qwen2.5-1.5B-Instruct (Localhost)",
  model_lib: "http://localhost:5050/libs/Qwen2-1.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
  vram_required_MB: 795.98,
  low_resource_required: true,
  overrides: {
    context_window_size: 2048,
  }
},

// For production deployment (Hugging Face)
{
  model: "https://huggingface.co/mlc-ai/Your-New-Model-q4f16_1-MLC",
  model_id: "Your-New-Model (Hugging Face)",
  model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Your-New-Model-q4f16_1-ctx4k_cs1k-webgpu.wasm",
  vram_required_MB: 1500.0,
  low_resource_required: true,
  overrides: {
    context_window_size: 4096,
  }
}
```

### 3.2 Model Configuration Parameters

- **model**: URL to the model weights
- **model_id**: Display name for the model
- **model_lib**: URL to the WebAssembly library file
- **vram_required_MB**: VRAM requirement in MB (use `utils/vram_requirements` to calculate)
- **low_resource_required**: Whether the model can run on limited devices
- **overrides**: Configuration overrides (context window, etc.)

## Step 4: Calculate VRAM Requirements

Use the provided utility to calculate VRAM requirements:

```bash
# In the MLC-LLM container
python3 -c "from mlc_llm.utils import vram_requirements; print(vram_requirements.calculate_vram_requirement('/path/to/your/model'))"
```

## Step 5: Deploy and Test

### 5.1 Build and Deploy AI-Model Server
```bash
cd AI-Model
docker build -t ai-model-server .
docker run -p 5050:5050 ai-model-server
```

### 5.2 Test Your Model
```bash
# Test the model endpoint
curl http://localhost:5050/models/Your-New-Model-q4f16_1-MLC/resolve/main/

# Test the library endpoint
curl http://localhost:5050/libs/Your-New-Model-q4f16_1-ctx4k_cs1k-webgpu.wasm
```

### 5.3 Update WebLLM Components
```bash
cd optlite-webllm/webllm-components
npm install
npm run build
```

## Example: Adding a Custom Model

Let's say you want to add a custom Llama model:

### 1. Model Conversion
```bash
mlc_llm convert_weight /path/to/custom-llama --quantization q4f16_1 -o ./custom-llama-converted
mlc_llm gen_config /path/to/custom-llama --quantization q4f16_1 --conv-template llama-3 -o ./custom-llama-converted
mlc_llm compile /path/to/custom-llama -o ./custom-llama-converted
```

### 2. Update AI-Model Server
```javascript
// In app.js
app.use('/models/Custom-Llama-q4f16_1-MLC/resolve/main/', express.static('./models/Custom-Llama-q4f16_1-MLC/'));
```

```dockerfile
# In Dockerfile
RUN git clone https://huggingface.co/mlc-ai/Custom-Llama-q4f16_1-MLC
RUN wget https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Custom-Llama-q4f16_1-ctx4k_cs1k-webgpu.wasm
```

### 3. Update WebLLM Config
```typescript
{
  model: "http://localhost:5050/models/Custom-Llama-q4f16_1-MLC",
  model_id: "Custom Llama (Localhost)",
  model_lib: "http://localhost:5050/libs/Custom-Llama-q4f16_1-ctx4k_cs1k-webgpu.wasm",
  vram_required_MB: 879.04,
  low_resource_required: true,
  overrides: {
    context_window_size: 4096,
  }
}
```

## Troubleshooting

### Common Issues

1. **Model not found**: Check if the model path is correct in `app.js`
2. **Library not found**: Verify the library file exists and is accessible
3. **VRAM errors**: Recalculate VRAM requirements and adjust `low_resource_required`
4. **CORS errors**: Check CORS configuration in `app.js`

### Debug Commands

```bash
# Check if model files exist
ls -la AI-Model/models/

# Check if library files exist
ls -la AI-Model/libs/

# Test server endpoints
curl -I http://localhost:5050/models/Your-Model/resolve/main/
curl -I http://localhost:5050/libs/Your-Model-library.wasm
```

## Notes

- Always test with localhost first before deploying to production
- Ensure model compatibility with the current MLC-LLM version
- Consider model size and performance requirements
- Update documentation when adding new models
- Follow the existing naming conventions for consistency 