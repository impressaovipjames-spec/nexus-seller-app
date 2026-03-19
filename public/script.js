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

function renderResult(content, imageUri = null) {
    let html = '';
    if (imageUri) {
        html += `
            <div class="creative-output">
                <h3>🖼️ CRIATIVO GERADO (ORION 3.0)</h3>
                <img src="${imageUri}" alt="Criativo Gerado" class="generated-image">
                <a href="${imageUri}" target="_blank" class="download-btn">BAIXAR CRIATIVO 📥</a>
            </div>
        `;
    }
    // Formatar quebras de linha para exibição HTML se necessário, ou manter pre-wrap via CSS
    html += `<div class="output-v2">${content.replace(/\n/g, '<br>')}</div>`;
    resultDisplay.innerHTML = html;
}

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
