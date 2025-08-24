import * as webllm from "../../webllm-components";
import { OptFrontend } from './opt-frontend';



/*************** WebLLM logic ***************/
const messages = [
    {
        content: "You are a helpful AI agent helping users.",
        role: "system",
    },
];

// 全局变量存储AI回复
let lastAIResponse = "";
let responseHistory = [];

// 清除内存函数
function clearMemory() {
    // 重置消息数组到初始状态
    messages.length = 0;
    messages.push({
        content: "You are a helpful AI agent helping users.",
        role: "system",
    });
    
    // 清除AI回复历史
    lastAIResponse = "";
    responseHistory = [];
    
    // 清除UI显示
    document.getElementById("message-out").classList.add("hidden");
    document.getElementById("message-out").textContent = "";
    document.getElementById("chat-stats").classList.add("hidden");
    document.getElementById("chat-stats").textContent = "";
    
    console.log("Memory cleared - new session started");
}

// 特殊格式处理函数
function processMessageFormat(message) {
    let processedMessage = "";
    let i = 0;
    let shouldStopGeneration = false;
    
    while (i < message.length) {
        const char = message[i];
        
        if (char === "?") {
            // 遇到"?"就换行 - 在HTML中使用<br>标签
            processedMessage += "?<br>";
            i++;
        } else if (char === "<") {
            // 检查是否是"<|im_end|>"
            const remainingText = message.substring(i);
            // 暂时关闭结束标记
            if (false && remainingText.startsWith("<|im_end|>")) {
                // 找到结束标记，停止处理并标记需要停止生成
                shouldStopGeneration = true;
                break;
            } else {
                // 不是结束标记，继续显示
                processedMessage += char;
                i++;
            }
        } else {
            // 普通字符，直接添加
            processedMessage += char;
            i++;
        }
    }
    
    return { processedMessage, shouldStopGeneration };
}

const availableModels = webllm.prebuiltAppConfig.model_list.map(
    (m) => m.model_id,
);
let selectedModel = "SocraticAI_1.5B-q4f16_1-MLC (Hugging Face)";

// Callback function for initializing progress
function updateEngineInitProgressCallback(report) {
    console.log("initialize", report.progress);
    document.getElementById("download-status").textContent = report.text;
}

// Create engine instance
const engine = new webllm.MLCEngine();
engine.setInitProgressCallback(updateEngineInitProgressCallback);

async function initializeWebLLMEngine() {
    document.getElementById("chat-stats").classList.add("hidden");
    document.getElementById("download-status").classList.remove("hidden");
    var modelSelect = document.getElementById("model-selection") as HTMLInputElement;
    selectedModel = modelSelect.value;

    // 检查是否为自定义模型
    let customModels = (window as any).customModels || {};
    let config = {
        temperature: 1.0,
        top_p: 1,
    };
    if (customModels[selectedModel]) {
        // 动态注入到 engine.appConfig
        let appConfig = engine["appConfig"] || webllm.prebuiltAppConfig;
        // 避免重复添加
        if (!appConfig.model_list.find((m) => m.model_id === selectedModel)) {
            appConfig.model_list.push(customModels[selectedModel]);
        }
        engine.setAppConfig(appConfig);
        await engine.reload(selectedModel, config);
    } else {
        await engine.reload(selectedModel, config);
    }
}

async function streamingGenerating(messages, onUpdate, onFinish, onError) {
    try {
        let curMessage = "";
        let usage;
        const completion = await engine.chat.completions.create({
            stream: true,
            messages,
            max_tokens:500,
            stream_options: { include_usage: true },
        });
        for await (const chunk of completion) {
            const curDelta = chunk.choices[0]?.delta.content;
            if (curDelta) {
                curMessage += curDelta;
            }
            if (chunk.usage) {
                usage = chunk.usage;
            }
            onUpdate(curMessage);
        }
        const finalMessage = await engine.getMessage();
        onFinish(finalMessage, usage);
    } catch (err) {
        onError(err);
    }
}

/*************** UI logic ***************/
function onMessageSend(input) {
    const message = {
        content: input,
        role: "user",
    };
    if (input.length === 0) {
        return;
    }
    
    // 从网页输入框获取系统提示词，如果没有则使用默认值
    const systemPromptInput = document.getElementById('system-prompt-input') as HTMLTextAreaElement;
    const systemPrompt = systemPromptInput ? systemPromptInput.value.trim() : "You are a helpful AI agent helping users.";
    
    // 每次发送消息时创建新的会话
    const sessionMessages = [
        {
            content: systemPrompt || "You are a helpful AI agent helping users.", // 使用用户输入或默认值
            role: "system",
        },
        message
    ];
    
    // 显示发送给大模型的内容
    displaySentContent(sessionMessages);
    
    // 启用停止按钮，禁用Ask AI按钮
    const stopButton = document.getElementById('stopGeneration') as HTMLButtonElement;
    const askAIButton = document.getElementById('askAI') as HTMLButtonElement;
    if (stopButton && askAIButton) {
        stopButton.disabled = false;
        askAIButton.disabled = true;
    }
    
    //document.getElementById("send").disabled = true;
    document.getElementById("message-out").classList.remove("hidden");
    document.getElementById("message-out").textContent = "AI is thinking...";

    // 不再将消息添加到全局 messages 数组
    // messages.push(message);

    // const onFinishGenerating = (finalMessage, usage) => {
    //     document.getElementById("message-out").textContent = "AI Response:\n" + finalMessage;
    //     const usageText =
    //     `prompt_tokens: ${usage.prompt_tokens}, ` +
    //     `completion_tokens: ${usage.completion_tokens}, ` +
    //     `prefill: ${usage.extra.prefill_tokens_per_s.toFixed(4)} tokens/sec, ` +
    //     `decoding: ${usage.extra.decode_tokens_per_s.toFixed(4)} tokens/sec`;
    //     document.getElementById("chat-stats").classList.remove("hidden");
    //     document.getElementById("chat-stats").textContent = usageText;
    //     //document.getElementById("send").disabled = false;
    // };

    const onFinishGenerating = (finalMessage, usage) => {
        // 应用特殊格式处理
        const { processedMessage, shouldStopGeneration } = processMessageFormat(finalMessage);
        
        // 保存处理后的回复到全局变量
        lastAIResponse = processedMessage;
        responseHistory.push({
            timestamp: new Date(),
            message: processedMessage,
            usage: usage
        });
        
        document.getElementById("message-out").innerHTML = "AI Response:<br>" + processedMessage;
        const usageText =
        `prompt_tokens: ${usage.prompt_tokens}, ` +
        `completion_tokens: ${usage.completion_tokens}, ` +
        `prefill: ${usage.extra.prefill_tokens_per_s.toFixed(4)} tokens/sec, ` +
        `decoding: ${usage.extra.decode_tokens_per_s.toFixed(4)} tokens/sec`;
        document.getElementById("chat-stats").classList.remove("hidden");
        document.getElementById("chat-stats").textContent = usageText;
        
        // 生成完成后，重新启用Ask AI按钮，禁用停止按钮
        // 重新获取按钮引用，避免作用域问题
        const stopBtn = document.getElementById('stopGeneration') as HTMLButtonElement;
        const askAIBtn = document.getElementById('askAI') as HTMLButtonElement;
        if (stopBtn && askAIBtn) {
            stopBtn.disabled = true;
            askAIBtn.disabled = false;
        }
    };

    const onError = (err) => {
        document.getElementById("message-out").textContent = "Error: " + err;
        console.error(err);
        
        // 发生错误时，重新启用Ask AI按钮，禁用停止按钮
        // 重新获取按钮引用，避免作用域问题
        const stopBtn = document.getElementById('stopGeneration') as HTMLButtonElement;
        const askAIBtn = document.getElementById('askAI') as HTMLButtonElement;
        if (stopBtn && askAIBtn) {
            stopBtn.disabled = true;
            askAIBtn.disabled = false;
        }
    };

    streamingGenerating(
        // messages,
        sessionMessages, // 使用新的会话消息数组
        (msg) => {
            // 应用特殊格式处理
            const { processedMessage, shouldStopGeneration } = processMessageFormat(msg);
            document.getElementById("message-out").innerHTML = "AI Response:<br>" + processedMessage;
            
            // 如果检测到结束标记，停止后端生成
            if (shouldStopGeneration) {
                engine.interruptGenerate();
            }
        },
        onFinishGenerating,
        onError
    );
}

// 添加停止生成函数
function stopGeneration() {
    try {
        // 中断AI生成
        if (engine && typeof engine.interruptGenerate === 'function') {
            engine.interruptGenerate();
        }
        
        // 更新UI状态
        document.getElementById("message-out").textContent = "Generation stopped by user.";
        
        // 重新启用Ask AI按钮，禁用停止按钮
        const stopButton = document.getElementById('stopGeneration') as HTMLButtonElement;
        const askAIButton = document.getElementById('askAI') as HTMLButtonElement;
        if (stopButton && askAIButton) {
            stopButton.disabled = true;
            askAIButton.disabled = false;
        }
        
        console.log("AI generation stopped by user");
    } catch (error) {
        console.error("Error stopping generation:", error);
    }
}

// 添加显示发送内容的函数
function displaySentContent(sessionMessages) {
    const sentContentDisplay = document.getElementById('sent-content-display');
    const sentContentText = document.getElementById('sent-content-text');
    const sentSystemPrompt = document.getElementById('sent-system-prompt');
    const sentUserQuestion = document.getElementById('sent-user-question');
    
    if (sentContentDisplay && sentContentText && sentSystemPrompt && sentUserQuestion) {
        // 显示整个发送区域
        sentContentDisplay.style.display = 'block';
        
        // 格式化显示内容
        const formattedContent = sessionMessages.map(msg => {
            return `[${msg.role.toUpperCase()}]:\n${msg.content}\n`;
        }).join('\n');
        
        // 显示完整内容
        sentContentText.textContent = formattedContent;
        
        // 分别显示系统提示词和用户问题
        sentSystemPrompt.textContent = sessionMessages[0].content;
        sentUserQuestion.textContent = sessionMessages[1].content;
        
        // 自动滚动到底部
        sentContentText.scrollTop = sentContentText.scrollHeight;
    }
}

// Option 1: If getCode is exported from opt-frontend.ts



document.getElementById("askAI").addEventListener("click", function () {
    //const frontend = new OptFrontend();

    // 从网页输入框获取问题模板，如果没有则使用默认值
    const questionTemplateInput = document.getElementById('question-template-input') as HTMLTextAreaElement;
    const questionTemplate = questionTemplateInput ? questionTemplateInput.value.trim() : DEFAULT_QUESTION_TEMPLATE;
    
    // 获取代码和错误信息
    const codeText = extractText();
    const errorText = document.getElementById("frontendErrorOutput").textContent?.replace("(UNSUPPORTED FEATURES)", "") || "";
    
    // 使用模板生成问题
    const question = questionTemplate
        .replace('{code}', codeText)
        .replace('{error}', errorText);

    document.getElementById("chat-stats").classList.add("hidden");
    onMessageSend(question);
});

/*************** UI binding ***************/
availableModels.forEach((modelId) => {
    const option = document.createElement("option");
    option.value = modelId;
    option.textContent = modelId;
    document.getElementById("model-selection").appendChild(option);
});
(document.getElementById("model-selection") as HTMLSelectElement).value = selectedModel;
document.getElementById("download").addEventListener("click", function () {
    initializeWebLLMEngine().then(() => {
        const askAIButton = document.getElementById("askAI") as HTMLButtonElement;
        const clearMemoryButton = document.getElementById("clearMemory") as HTMLButtonElement;
        
        askAIButton.disabled = false;
        askAIButton.title = ""; // 清除提示，因为按钮现在可用了
        clearMemoryButton.disabled = false;
    });
});

$("#send").click(() => {
    var inputElement = document.getElementById("user-input") as HTMLInputElement;
    onMessageSend(inputElement.value);
});

function extractText() {
    const container = document.querySelector('.ace_layer.ace_text-layer');
    const lines = container.querySelectorAll('.ace_line');
    let extractedText = '';
    lines.forEach(line => {
        extractedText += line.textContent + '\n';
    });

    return extractedText;
}

// the ask AI button hide and display
function initializeErrorObserver() {
    const frontendErrorOutput = document.getElementById('frontendErrorOutput');
    const askAIButton = document.getElementById('askAI');
    const clearMemoryButton = document.getElementById('clearMemory');
    const chatStats = document.getElementById('chat-stats');
    const messageOut = document.getElementById('message-out');

    if (!frontendErrorOutput || !askAIButton || !clearMemoryButton) {
        console.error('Required elements not found');
        return;
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
            const hasError = frontendErrorOutput.textContent?.trim() !== '';
            askAIButton.style.display = hasError ? 'block' : 'none';
            // Clear Memory按钮跟随Ask AI的显示状态
            clearMemoryButton.style.display = askAIButton.style.display;
            
            if (!hasError) {
                // Clear and hide message-out and chat-stats when error is cleared
                if (chatStats) {
                    chatStats.classList.add('hidden');
                    chatStats.textContent = '';
                }
                if (messageOut) {
                    messageOut.classList.add('hidden');
                    messageOut.textContent = '';
                }
            }
        });
    });

    observer.observe(frontendErrorOutput, {
        childList: true,
        characterData: true,
        subtree: true
    });

    // Initial check
    askAIButton.style.display = 
        frontendErrorOutput.textContent?.trim() !== '' ? 'block' : 'none';
    clearMemoryButton.style.display = askAIButton.style.display;
}

document.addEventListener('DOMContentLoaded', initializeErrorObserver);

// === 自定义模型逻辑 ===
document.getElementById("add-custom-model").addEventListener("click", function () {
    const baseUrl = (document.getElementById("custom-model-base-url") as HTMLInputElement).value.trim();
    const wasmUrl = (document.getElementById("custom-model-wasm-url") as HTMLInputElement).value.trim();
    const customId = (document.getElementById("custom-model-id") as HTMLInputElement).value.trim() || ("Custom-" + Date.now());
    const errorDiv = document.getElementById("custom-model-error");

    errorDiv.textContent = "";

    if (!baseUrl || !wasmUrl) {
        errorDiv.textContent = "Please enter Base URL and WASM URL";
        return;
    }

    // 组装 ModelRecord
    const customModelRecord = {
        model: baseUrl,
        model_id: customId,
        model_lib: wasmUrl,
        overrides: {
            context_window_size: 2048
        }
    };

    // 动态添加到下拉框
    const option = document.createElement("option");
    option.value = customId;
    option.textContent = customId + "(Customized)";
    document.getElementById("model-selection").appendChild(option);

    // 记录到全局
    (window as any).customModels = (window as any).customModels || {};
    (window as any).customModels[customId] = customModelRecord;

    // 自动选中
    (document.getElementById("model-selection") as HTMLSelectElement).value = customId;
});

// === 显示最后修改时间 ===
function showLastModified() {
    // 你可以用构建时注入的时间戳，或者用 Date.now() 作为演示
    // 推荐用构建时注入的字符串，下面用 Date.now() 作为例子
    // const lastModified = "Last modified: " + new Date(/*BUILD_TIMESTAMP*/ Date.now()).toLocaleString();
    //手动修改信息，用于验证页面是否已更新
    const lastModified = "Last modified: " + "2508250400";
    let modDiv = document.getElementById("last-modified-block");
    if (!modDiv) {
        modDiv = document.createElement("div");
        modDiv.id = "last-modified-block";
        modDiv.style.cssText = "position:fixed;bottom:0;left:0;width:100%;background:#eee;color:#333;padding:4px 0;text-align:center;font-size:12px;z-index:9999;";
        document.body.appendChild(modDiv);
    }
    modDiv.textContent = lastModified;
}

document.addEventListener('DOMContentLoaded', showLastModified);

// 在文件顶部添加默认值常量
const DEFAULT_SYSTEM_PROMPT = "You are a helpful AI agent helping users.";
const DEFAULT_QUESTION_TEMPLATE = "I'm writing Python, and here's my code: {code} and I received this error: {error} Hint in Socratic style:";

// 添加Clear Memory按钮事件监听器
document.addEventListener('DOMContentLoaded', function() {
    const clearMemoryBtn = document.getElementById('clearMemory') as HTMLButtonElement;
    const askAIButton = document.getElementById('askAI') as HTMLButtonElement;
    const stopButton = document.getElementById('stopGeneration') as HTMLButtonElement;
    
    if (clearMemoryBtn) {
        // 临时隐藏 clearMemory 按钮
        clearMemoryBtn.style.display = 'none';
        // clearMemoryBtn.addEventListener('click', clearMemory);
    }
    
    // 确保Ask AI按钮在禁用状态时有正确的提示
    if (askAIButton && askAIButton.disabled) {
        askAIButton.title = "Select and pull model first";
    }
    
    // 添加停止按钮事件监听器
    if (stopButton) {
        stopButton.addEventListener('click', stopGeneration);
        // 初始状态禁用停止按钮
        stopButton.disabled = true;
    }
    
    // 初始化系统提示词输入框和下拉框
    const systemPromptInput = document.getElementById('system-prompt-input') as HTMLTextAreaElement;
    const systemPromptSelect = document.getElementById('system-prompt-select') as HTMLSelectElement;
    
    if (systemPromptInput && systemPromptSelect) {
        // 设置默认值
        systemPromptInput.value = DEFAULT_SYSTEM_PROMPT;
        
        // 添加下拉框选择事件监听器
        systemPromptSelect.addEventListener('change', function() {
            const selectedValue = this.value;
            if (selectedValue) {
                // 当选择预设提示词时，自动填入文本框
                systemPromptInput.value = selectedValue;
                // 保存到localStorage
                localStorage.setItem('optlite-system-prompt', selectedValue);
                // 重置下拉框选择
                this.value = '';
            }
        });
        
        // 添加文本框输入事件监听器，实时保存用户输入
        systemPromptInput.addEventListener('input', function() {
            // 可以将用户输入保存到 localStorage 中，这样刷新页面后不会丢失
            localStorage.setItem('optlite-system-prompt', this.value);
        });
        
        // 从 localStorage 恢复用户之前输入的内容
        const savedPrompt = localStorage.getItem('optlite-system-prompt');
        if (savedPrompt) {
            systemPromptInput.value = savedPrompt;
        }
    }
    
    // 初始化问题模板输入框和下拉框
    const questionTemplateInput = document.getElementById('question-template-input') as HTMLTextAreaElement;
    const questionTemplateSelect = document.getElementById('question-template-select') as HTMLSelectElement;
    
    if (questionTemplateInput && questionTemplateSelect) {
        // 设置默认值
        questionTemplateInput.value = DEFAULT_QUESTION_TEMPLATE;
        
        // 添加下拉框选择事件监听器
        questionTemplateSelect.addEventListener('change', function() {
            const selectedValue = this.value;
            if (selectedValue) {
                // 当选择预设模板时，自动填入文本框
                questionTemplateInput.value = selectedValue;
                // 保存到localStorage
                localStorage.setItem('optlite-question-template', selectedValue);
                // 重置下拉框选择
                this.value = '';
            }
        });
        
        // 添加文本框输入事件监听器，实时保存用户输入
        questionTemplateInput.addEventListener('input', function() {
            // 可以将用户输入保存到 localStorage 中，这样刷新页面后不会丢失
            localStorage.setItem('optlite-question-template', this.value);
        });
        
        // 从 localStorage 恢复用户之前输入的内容
        const savedTemplate = localStorage.getItem('optlite-question-template');
        if (savedTemplate) {
            questionTemplateInput.value = savedTemplate;
        }
    }
});

