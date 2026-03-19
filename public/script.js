/**
 * NEXUS SELLER V2 - SCRIPT PRINCIPAL
 * Arquitetura Orion 3.0 - VIPNEXUS IA 2026
 */

console.log("🚀 NEXUS SELLER V2 - SISTEMA INICIALIZADO");

// Elementos da Interface
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');
const uploadPrompt = document.querySelector('.upload-prompt');
const generateBtn = document.getElementById('generateBtnV2');
const resultDisplay = document.getElementById('resultDisplay');
const precoInput = document.getElementById('preco');

// ===============================
// 🔒 SAFE TEXT (BLINDAGEM TOTAL)
// ===============================
function safeText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  if (!text) return fallback;
  const invalid = ["undefined", "null", "nan", "n/a"];
  if (invalid.includes(text.toLowerCase())) return fallback;
  return text;
}

const FALLBACK_VISUAL_PROMPT = "fashion product, women sandals, ecommerce, clean background, premium lighting, realistic, high quality";
const historyList = document.getElementById('historyList');
const metricsDisplay = document.getElementById('metricsDisplay');
const removeImageBtn = document.getElementById('removeImage');

let selectedFile = null;

/**
 * 1. MÁSCARA DE MOEDA (UX)
 */
precoInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (!value) {
        e.target.value = "";
        return;
    }
    value = (parseFloat(value) / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    e.target.value = "R$ " + value;
});

/**
 * 2. FUNÇÃO CENTRAL DE IMAGEM (OBRIGATÓRIO)
 */
function handleImage(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert("Por favor, envie uma imagem válida! 📸");
        return;
    }

    selectedFile = file;
    console.log("📸 Imagem capturada:", file.name || "via clipboard/drag");

    // Preview Imediato
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.classList.remove('hidden');
        removeImageBtn.classList.remove('hidden');
        uploadPrompt.classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

/**
 * 3. EVENTOS DE ENTRADA (CLIQUE, DRAG, PASTE)
 */

// Clique no container abre seletor
dropZone.addEventListener('click', () => fileInput.click());

// Sincronizar input type="file"
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleImage(e.target.files[0]);
    }
});

// Drag & Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent-lilac)';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--border)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border)';
    if (e.dataTransfer.files.length > 0) {
        handleImage(e.dataTransfer.files[0]);
    }
});

// Ctrl + V (Paste)
document.addEventListener('paste', (event) => {
    const items = event.clipboardData.items;
    for (let item of items) {
        if (item.type.includes('image')) {
            handleImage(item.getAsFile());
        }
    }
});

// Remover Imagem
removeImageBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita disparar o clique do dropZone
    selectedFile = null;
    fileInput.value = '';
    imagePreview.src = '';
    imagePreview.classList.add('hidden');
    removeImageBtn.classList.add('hidden');
    uploadPrompt.classList.remove('hidden');
});

/**
 * 4. PIPELINE DE GERAÇÃO (ORION ENGINE)
 */
generateBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        alert("O Orion precisa de uma imagem para começar! 📸");
        return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('preco', precoInput.value);

    try {
        const response = await fetch('/api/generate-v2', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.success) {
            renderResult(data.content, data.imagem);
            loadHistory();
        } else {
            resultDisplay.innerHTML = `<div style="color: #ff4d4d; padding: 20px;">🚨 Erro do Orion: ${data.error}</div>`;
        }
    } catch (error) {
        console.error("Erro no Pipeline:", error);
        resultDisplay.innerHTML = `<div style="color: #ff4d4d; padding: 20px;">🚨 Falha na conexão com o Cérebro Nexus.</div>`;
    } finally {
        setLoading(false);
    }
});

function setLoading(isLoading) {
    if (isLoading) {
        generateBtn.disabled = true;
        generateBtn.innerText = "SINCRONIZANDO VISÃO... 🧠⚡";
        resultDisplay.innerHTML = `
            <div class="loading-container">
                <p>📸 Analisando produto...</p>
                <p>🎯 Identificando público...</p>
                <p>🔥 Criando desejo...</p>
            </div>`;
    } else {
        generateBtn.disabled = false;
        generateBtn.innerText = "GERAR ESTRATÉGIA ⚡";
    }
}

function renderResult(data) {
    if (!data || typeof data !== 'object') {
        resultDisplay.innerHTML = `<div class="error-msg">Erro ao processar estratégia. Orion em standby.</div>`;
        return;
    }

    const { titulo, descricao, bullets, cta, legenda, fraseViral, visualPrompt } = data;
    
    let html = '';
    
    // Header do Criativo
    html += `
        <div class="creative-output">
            <h3>🖼️ CRIATIVO GERADO (ORION 3.0)</h3>
            <div id="imageContainer" class="image-preview-placeholder">
                <p>Gerando composição visual...</p>
            </div>
            <div class="action-row" id="imageActions" style="display: none;">
                <button onclick="downloadCurrentCreative()" class="download-btn">BAIXAR CRIATIVO 📥</button>
            </div>
        </div>
    `;

    // Conteúdo Estratégico Limpo
    html += `
        <div class="output-clean">
            <h2 class="copy-title">${safeText(titulo)}</h2>
            <p class="copy-desc">${safeText(descricao)}</p>
            
            <div class="copy-section">
                <strong>💎 BENEFÍCIOS CHAVE:</strong>
                <ul class="copy-bullets">
                    ${(bullets || []).map(b => `<li>${safeText(b)}</li>`).join('')}
                </ul>
            </div>

            <div class="copy-section">
                <strong>🎯 CHAMADA PARA AÇÃO (CTA):</strong>
                <p class="copy-cta">${safeText(cta)}</p>
            </div>

            <div class="copy-section">
                <strong>📱 LEGENDA SUGERIDA:</strong>
                <p class="copy-caption">${safeText(legenda)}</p>
            </div>

            <div class="copy-section">
                <strong>🔥 FRASE VIRAL:</strong>
                <p class="copy-viral">${safeText(fraseViral)}</p>
            </div>
        </div>
    `;

    resultDisplay.innerHTML = html;

    // Disparar geração de imagem via Proxy se houver prompt
    if (visualPrompt) {
        generateAndDisplayImage(visualPrompt);
    }
}

let currentImageBlobUrl = null;

async function generateAndDisplayImage(prompt) {
    const container = document.getElementById('imageContainer');
    const actions = document.getElementById('imageActions');
    
    try {
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || "Erro no Servidor Proxy");
        }

        const contentType = response.headers.get("content-type");
        const blob = await response.blob();

        console.log(`🎨 Blob Recebido: Size=${blob.size} Type=${contentType}`);

        if (blob.size < 1000 || !contentType.includes("image")) {
            throw new Error("O servidor não retornou uma imagem válida.");
        }

        if (currentImageBlobUrl) URL.revokeObjectURL(currentImageBlobUrl);
        currentImageBlobUrl = URL.createObjectURL(blob);

        container.innerHTML = `<img src="${currentImageBlobUrl}" alt="Criativo" class="generated-image" onerror="this.parentElement.innerHTML='<p class=\'error-msg\'>Erro ao carregar preview local.</p>'">`;
        actions.style.display = 'flex';
    } catch (e) {
        console.error("❌ Erro de Renderização:", e);
        container.innerHTML = `<p class="error-msg">⚠️ ${e.message}</p>`;
    }
}

window.downloadCurrentCreative = () => {
    if (!currentImageBlobUrl) return;
    const link = document.createElement('a');
    link.href = currentImageBlobUrl;
    link.download = `criativo_nexus_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * 5. HISTÓRICO E MÉTRICAS
 */
async function loadHistory() {
    try {
        const res = await fetch('/api/history');
        const data = await res.json();
        historyList.innerHTML = data.map(item => `
            <li class="history-item" onclick="viewHistoryItem('${item.name}')">
                <span class="id">${item.id}</span>
                <span class="name">${item.name}</span>
            </li>
        `).join('');
    } catch (e) {
        console.error("Erro ao carregar histórico", e);
    }
}

async function viewHistoryItem(filename) {
    try {
        const res = await fetch(`/api/output/${filename}`);
        const data = await res.json();
        renderResult(data.content);
    } catch (e) {
        alert("Erro ao carregar item do histórico.");
    }
}

window.copyByChannel = (channel) => {
    const text = resultDisplay.innerText;
    if (!text) return;

    let filteredText = text;
    // Lógica simples de filtro por canal (Pode ser expandida conforme necessidade)
    if (channel === 'whatsapp') {
        const match = text.match(/WHATSAPP: ([\s\S]*?)(?=\nPROMPTS:|$)/i);
        if (match) filteredText = match[1].trim();
    }

    navigator.clipboard.writeText(filteredText).then(() => {
        alert(`Copy para ${channel.toUpperCase()} copiada! 🚀`);
    });
};

window.downloadImage = async (url) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `criativo_nexus_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
        // Fallback simples se fetch falhar (CORS etc)
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = 'criativo.jpg';
        link.click();
    }
};

/**
 * 6. DASHBOARD E INICIALIZAÇÃO
 */
window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    // Obs: Se houver abas no HTML, as classes 'active' serão aplicadas
    const target = document.getElementById(tabId + 'Tab');
    if (target) target.classList.add('active');
};

// Inicialização
loadHistory();
setInterval(loadHistory, 30000); // Atualiza a cada 30s
