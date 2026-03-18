console.log("🚀 SCRIPT NEXUS CARREGADO COM SUCESSO!");
const productForm = document.getElementById('productForm');
const achadinhoBtn = document.getElementById('achadinhoBtn');

const historyList = document.getElementById('historyList');
const resultDisplay = document.getElementById('resultDisplay');
const copyBtn = document.getElementById('copyBtn');
const metricsDisplay = document.getElementById('metricsDisplay');

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
 * Submeter Formulário
 */
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        nome_produto: document.getElementById('nome_produto').value,
        preco: document.getElementById('preco').value,
        canal: document.getElementById('canal').value,
        descricao: document.getElementById('descricao').value,
        publico: document.getElementById('publico').value,
        problema: document.getElementById('problema').value,
        diferencial: document.getElementById('diferencial').value
    };

    resultDisplay.innerHTML = '<div class="loading-spinner">✨ Criando sua estratégia... Aguarde...</div>';

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        if (result.success) {
            resultDisplay.textContent = result.content;
            productForm.reset();
            loadHistory();
        }
    } catch (e) {
        resultDisplay.textContent = '❌ Erro ao gerar kit. Tente novamente.';
    }
});

/**
 * Botão Modo Achadinho (SPRINT CORREÇÃO)
 */
achadinhoBtn.addEventListener('click', async () => {
    const nome = document.getElementById('nome_produto').value;
    if (!nome) return alert('Digite o nome do produto para o Modo Achadinho!');

    const formData = {
        nome_produto: `MODO ACHADINHO: ${nome}`,
        preco: document.getElementById('preco').value,
        canal: 'WhatsApp',
        descricao: document.getElementById('descricao').value,
        publico: document.getElementById('publico').value,
        problema: document.getElementById('problema').value,
        diferencial: document.getElementById('diferencial').value
    };

    resultDisplay.innerHTML = '<div class="loading-spinner">💖 Gerando Achadinho Mágico... ✨</div>';

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        if (result.success) {
            resultDisplay.textContent = result.content;
            loadHistory();
        }
    } catch (e) {
        resultDisplay.textContent = '❌ Erro no Modo Achadinho.';
    }
});


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
