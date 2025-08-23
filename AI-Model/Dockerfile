FROM node:lts


WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

RUN apt-get update && \
    apt-get install git-lfs && \
    git lfs install

RUN mkdir models && \
    mkdir libs

WORKDIR /usr/src/app/models
RUN git clone https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC
RUN git clone https://huggingface.co/mlc-ai/Llama-3.2-3B-Instruct-q4f16_1-MLC
RUN git clone https://huggingface.co/mlc-ai/DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC
RUN git clone https://huggingface.co/mlc-ai/Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC
RUN git clone https://huggingface.co/mlc-ai/Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC
RUN git clone https://huggingface.co/mlc-ai/Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC
RUN git clone https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC

# Add TinyLlama models
RUN git clone https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC
RUN git clone https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC

# Add your new model here
# RUN git clone https://huggingface.co/mlc-ai/Your-New-Model-q4f16_1-MLC

WORKDIR /usr/src/app/libs
RUN wget https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Llama-3.2-1B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm
RUN wget https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Llama-3.2-3B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm
RUN wget https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm
RUN wget https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Qwen2-0.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm
RUN wget https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Qwen2.5-3B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm
RUN wget https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Qwen2-7B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm
RUN wget https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Qwen2-1.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm

# Add TinyLlama libraries
RUN wget https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/TinyLlama-1.1B-Chat-v1.0-q4f16_1-ctx2k_cs1k-webgpu.wasm
RUN wget https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/TinyLlama-1.1B-Chat-v1.0-q4f32_1-ctx2k_cs1k-webgpu.wasm

# Add your new model library here
# RUN wget https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Your-New-Model-q4f16_1-ctx4k_cs1k-webgpu.wasm

WORKDIR /usr/src/app

COPY . .

EXPOSE 5050

CMD [ "node", "app.js" ]