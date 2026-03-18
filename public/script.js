console.log("🚀 SCRIPT NEXUS CARREGADO COM SUCESSO!");
const productForm = document.getElementById('productForm');
const achadinhoBtn = document.getElementById('achadinhoBtn');

const historyList = document.getElementById('historyList');
const resultDisplay = document.getElementById('resultDisplay');
const copyBtn = document.getElementById('copyBtn');
const metricsDisplay = document.getElementById('metricsDisplay');
const precoInput = document.getElementById('preco');

// Máscara de Moeda
precoInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === "") {
        e.target.value = "";
        return;
    }
    value = (parseFloat(value) / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    e.target.value = value;
});


/**
 * Carregar Histórico
 */
async function loadHistory() {
    try {
        const response = await fetch('/api/history');
        const files = await response.json();
        
        historyList.innerHTML = '';
        files.forEach(file => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
                <span class="id">${file.id}</span>
                <span class="name">${file.name}</span>
            `;
            li.onclick = () => loadOutput(file.name);
            historyList.appendChild(li);
        });
    } catch (e) {
        console.error('Erro ao carregar histórico');
    }
}

/**
 * Carregar Kit Específico
 */
async function loadOutput(filename) {
    try {
        const response = await fetch(`/api/output/${filename}`);
        const data = await response.json();
        resultDisplay.textContent = data.content;
    } catch (e) {
        alert('Erro ao carregar arquivo de saída');
    }
}

/**
 * console.log("🚀 NEXUS SELLER V2 - AGENTIC VISION ACTIVE");

// Elementos
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const uploadPrompt = document.querySelector('.upload-prompt');
const generateBtn = document.getElementById('generateBtnV2');
const resultDisplay = document.getElementById('resultDisplay');
const precoInput = document.getElementById('preco');
const historyList = document.getElementById('historyList');

let selectedFile = null;

// Máscara de Moeda (Melhorada)
precoInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, "");
    value = (value / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    e.target.value = value === "0,00" ? "" : "R$ " + value;
});

// Lógica de Upload
dropZone.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent-lilac)';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--border)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert("Por favor, envie uma imagem válida.");
        return;
    }
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.classList.remove('hidden');
        uploadPrompt.classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

// Geração V2
generateBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        alert("Orion precisa de uma imagem para começar! 📸");
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
            renderResult(data.content);
            loadHistory();
        } else {
            resultDisplay.innerHTML = `<div style="color: red;">🚨 Erro do Orion: ${data.error}</div>`;
        }
    } catch (error) {
        console.error(error);
        resultDisplay.innerHTML = `<div style="color: red;">🚨 Falha na conexão com o Cérebro Nexus.</div>`;
    } finally {
        setLoading(false);
    }
});

function setLoading(isLoading) {
    if (isLoading) {
        generateBtn.disabled = true;
        generateBtn.innerText = "SINCRONIZANDO VISÃO... 🧠⚡";
        resultDisplay.innerHTML = `<div class="loading-container">
            <p>📸 Analisando produto...</p>
            <p>🎯 Identificando público...</p>
            <p>🔥 Criando desejo...</p>
        </div>`;
    } else {
        generateBtn.disabled = false;
        generateBtn.innerText = "GERAR ESTRATÉGIA ⚡";
    }
}

function renderResult(content) {
    // Limpeza estética do output conforme padrão Orion
    resultDisplay.innerHTML = `<div class="output-v2">${content}</div>`;
}

// Funções de Utilitário (Cópia e Histórico)
async function loadHistory() {
    try {
        const res = await fetch('/api/history');
        const data = await res.json();
        historyList.innerHTML = data.map(item => `
            <li class="history-item" onclick="viewHistoryItem('${item.filename}')">
                <span class="id">${item.id}</span>
                <span class="name">${item.name}</span>
            </li>
        `).join('');
    } catch (e) { console.error("Erro ao carregar histórico", e); }
}

async function viewHistoryItem(filename) {
    try {
        const res = await fetch(`/api/output/${filename}`);
        const text = await res.text();
        renderResult(text);
    } catch (e) { alert("Erro ao carregar item"); }
}

function copyByChannel(channel) {
    const text = resultDisplay.innerText;
    navigator.clipboard.writeText(text).then(() => {
        alert(`Copy para ${channel.toUpperCase()} copiada com sucesso! 🚀`);
    });
}

// Inicialização
loadHistory();
setInterval(loadHistory, 10000);


/**
 * Copiar Conteúdo
 */
copyBtn.addEventListener('click', () => {
    const text = resultDisplay.textContent;
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = 'COPIADO! ✅';
            setTimeout(() => copyBtn.innerText = originalText, 2000);
        });
    }
});

/**
 * Cópia Inteligente por Canal
 */
window.copyByChannel = (channel) => {
    const text = resultDisplay.textContent;
    if (!text) return;

    let filteredText = "";
    
    if (channel === 'shopee') {
        const titleMatch = text.match(/TÍTULO V1: (.*)/);
        const descMatch = text.match(/DESCRIÇÃO: ([\s\S]*?)(?=\nBENEFÍCIOS:)/);
        const benefitsMatch = text.match(/BENEFÍCIOS: ([\s\S]*?)(?=\nPROMESSA:)/);
        
        filteredText = `📦 PRODUTO\n${titleMatch ? titleMatch[1] : ''}\n\n📝 DESCRIÇÃO\n${descMatch ? descMatch[1].trim() : ''}\n\n✅ BENEFÍCIOS\n${benefitsMatch ? benefitsMatch[1].trim() : ''}`;
    } 
    else if (channel === 'instagram') {
        const emotionMatch = text.match(/EMOÇÃO: (.*)/);
        const hookMatch = text.match(/GANCHO V1: (.*)/);
        const captionMatch = text.match(/LEGENDA: ([\s\S]*?)(?=\nGANCHO:)/);
        
        filteredText = `✨ ESPECIAL PARA VOCÊ\n${hookMatch ? hookMatch[1] : ''}\n\n${captionMatch ? captionMatch[1].trim() : ''}\n\n🚀 #tecnologia #sucesso #nexus`;
    }
    else if (channel === 'whatsapp') {
        const waMatch = text.match(/WHATSAPP: ([\s\S]*?)(?=\nPROMPTS:)/);
        filteredText = waMatch ? waMatch[1].trim() : text;
    }

    navigator.clipboard.writeText(filteredText).then(() => {
        alert(`Copiado para ${channel.toUpperCase()}! ✅`);
    });
};

/**
 * Navegação por abas
 */
window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId + 'Tab').classList.add('active');
    event.currentTarget.classList.add('active');
    
    if (tabId === 'dashboard') loadDashboard();
};

/**
 * Dashboard de Performance
 */
window.loadDashboard = async () => {
    try {
        const response = await fetch('/api/metrics');
        const metrics = await response.json();
        renderDashboard(metrics);
    } catch (error) {
        console.error('Erro ao carregar métricas');
    }
};

function renderDashboard(metrics) {
    if (Object.keys(metrics).length === 0) {
        metricsDisplay.innerHTML = '<div class="placeholder-msg">Nenhuma métrica registrada. Carregue um kit para iniciar.</div>';
        return;
    }

    let html = `
        <table class="metrics-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>NOME</th>
                    <th>CLIQUES</th>
                    <th>VENDAS</th>
                    <th>CONV.</th>
                    <th>STATUS</th>
                    <th>PRÓXIMA AÇÃO</th>
                    <th>AÇÕES</th>
                </tr>
            </thead>
            <tbody>
    `;

    const sortedIds = Object.keys(metrics).reverse();
    
    sortedIds.forEach(id => {
        const m = metrics[id];
        const conv = m.clicks > 0 ? ((m.sales / m.clicks) * 100).toFixed(1) : 0;
        
        let tagClass = 'conv-low';
        let statusText = 'DESCARTAR';
        let nextAction = 'Trocar produto ou nicho';
        
        if (conv >= 3) { 
            tagClass = 'conv-high'; 
            statusText = 'ESCALAR'; 
            nextAction = 'Duplicar verba e escalar!';
        }
        else if (conv >= 1) { 
            tagClass = 'conv-mid'; 
            statusText = 'TESTAR'; 
            nextAction = 'Criar novas variações';
        }

        // Aplicar filtro de campeões
        if (window.onlyChampions && statusText !== 'ESCALAR') return;

        html += `
            <tr>
                <td>${id}</td>
                <td><strong>${m.name}</strong></td>
                <td><input type="number" class="action-input" value="${m.clicks}" onchange="updateMetric('${id}', 'clicks', this.value)"></td>
                <td><input type="number" class="action-input" value="${m.sales}" onchange="updateMetric('${id}', 'sales', this.value)"></td>
                <td>${conv}%</td>
                <td><span class="conv-tag ${tagClass}">${statusText}</span></td>
                <td class="next-action">👉 ${nextAction}</td>
                <td class="action-btns">
                    <button class="copy-sub" title="Abrir" onclick="loadKitById('${id}')">👁️</button>
                    <button class="copy-sub" title="Escalar" onclick="scaleProduct('${id}', '${m.name}')">🚀</button>
                    <button class="copy-sub" title="Descartar" onclick="updateMetric('${id}', 'sales', 0); updateMetric('${id}', 'clicks', 0)">🗑️</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    metricsDisplay.innerHTML = html;
}

window.updateMetric = async (id, type, value) => {
    await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, value })
    });
    loadDashboard();
};

window.loadKitById = async (id) => {
    const historyResp = await fetch('/api/history');
    const history = await historyResp.json();
    const item = history.find(h => h.id === id);
    if (item) {
        loadOutput(item.name);
        switchTab('generator');
    }
};

// Auto-registro de nome nas métricas ao carregar kit
const originalLoadOutput = window.loadOutput;
window.loadOutput = async (filename) => {
    const res = await originalLoadOutput(filename);
    const id = filename.split('-')[0];
    const nameMatch = resultDisplay.textContent.match(/TÍTULO: (.*)/);
    if (nameMatch) {
        updateMetric(id, 'name', nameMatch[1]);
    }
    return res;
};

// Filtro de Campeões
window.onlyChampions = false;
window.toggleChampions = () => {
    window.onlyChampions = !window.onlyChampions;
    const btn = document.getElementById('filterChampions');
    btn.classList.toggle('active', window.onlyChampions);
    btn.style.borderColor = window.onlyChampions ? 'var(--accent)' : '';
    loadDashboard();
};

window.scaleProduct = async (id, name) => {
    if (!confirm(`Deseja ESCALAR o produto ${name}? Isso gerará novas variações otimizadas.`)) return;
    
    // Simular que estamos escalando enviando um novo pedido com flag de escala no nome
    document.getElementById('nome_produto').value = `ESCALA: ${name}`;
    document.getElementById('generateBtn').click();
    
    alert(`Ordem de ESCALA enviada para ${id}! Verifique o histórico em instantes.`);
    switchTab('generator');
};

// Inicialização
loadHistory();
setInterval(loadHistory, 10000);
