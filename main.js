const fs = require('fs');
const path = require('path');
const https = require('https');

// Carregar Configuração
let configPath = path.join(__dirname, 'config.json');
let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Caminhos
const inputDir = path.resolve(__dirname, config.input_dir);
const outputDir = path.resolve(__dirname, config.output_dir);
const processingDir = path.resolve(__dirname, config.processing_dir);
const processedDir = path.resolve(__dirname, config.processed_dir);
const promptFilePath = path.resolve(__dirname, config.prompt_file);
const templateFilePath = path.resolve(__dirname, config.template_file);
const logsDir = path.resolve(__dirname, './logs');

// Garantir que pastas existem
[outputDir, processingDir, processedDir, logsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/**
 * Salva a configuração atualizada (para o last_id)
 */
function saveConfig() {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Função para registrar logs detalhados
 */
function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    if (data) {
        logMessage += `\nDATA: ${JSON.stringify(data, null, 2)}`;
    }
    logMessage += '\n';
    
    console.log(`[${level.toUpperCase()}] ${message}`);
    fs.appendFileSync(path.join(logsDir, 'process.log'), logMessage);
}

/**
 * Log de Performance
 */
function logPerformance(id, duration, status) {
    const timestamp = new Date().toISOString();
    const line = `${timestamp} | ID: ${id} | Tempo: ${duration}ms | Status: ${status}\n`;
    fs.appendFileSync(path.join(logsDir, 'performance.log'), line);
}

/**
 * Utilitário para gerar slug
 */
function slugify(text) {
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '_')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

/**
 * Chamada Real de LLM (Mockable)
 */
async function callLLM(prompt, productData) {
    // Se for um pedido de escala, injetamos uma instrução de "Otimização Extrema"
    let modifier = "";
    if (productData.nome_produto.startsWith("ESCALA:")) {
        modifier = "\n\n⚠️ MODO ESCALA ATIVADO: Este produto já é um campeão de vendas. Sua missão é criar variações ainda mais agressivas, curtas e magnéticas para escala de anúncios. Foque em quebra de padrão total.";
    }

    const fullPrompt = `${prompt}${modifier}\n\nPRODUTO: ${JSON.stringify(productData)}`;
    
    // Verificação de API Key para chamadas reais
    if (config.api_key && config.api_key !== "YOUR_API_KEY_HERE") {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
               contents: [{ parts: [{ text: fullPrompt }] }]
            });

            const options = {
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models/${config.model}:generateContent?key=${config.api_key}`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': postData.length }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (d) => body += d);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        if (response.candidates && response.candidates[0].content) {
                            resolve(response.candidates[0].content.parts[0].text);
                        } else {
                            reject(new Error('Resposta inválida da API'));
                        }
                    } catch (e) { reject(e); }
                });
            });

            req.on('error', (e) => reject(e));
            req.write(postData);
            req.end();
        });
    }

    // MOCK MODE (fallback)
    return new Promise((resolve) => {
        setTimeout(() => {
            const isEscala = productData.nome_produto.startsWith("ESCALA:");
            const prefix = isEscala ? "[ESCALA VALIDADA] " : "";
            
            const mockResponse = `
[SCORE DE PRODUTO]
- Apelo Visual: 10
- Utilidade: 9
- Desejo: 10
- MÉDIA FINAL: 9.7

[VARIAÇÕES A/B]
TÍTULO V1: ${prefix}${productData.nome_produto} - PERFORMANCE EXTREMA
TÍTULO V2: Domine o dia com o NOVO ${productData.nome_produto}
PROMESSA V1: Resultados ou seu dinheiro de volta AGORA.
PROMESSA V2: A única solução 100% garantida do mercado.
GANCHO V1: Pare de jogar dinheiro fora!
GANCHO V2: O segredo dos 1% finalmente liberado.

[KIT COMPLETO]
EMOÇÃO: Alívio imediato e Poder.
DOR: Chega de sofrer com ${productData.problema}.
DESEJO: Liberdade total usando ${productData.nome_produto}.
TRANSFORMAÇÃO: Vida nova após o primeiro uso.
TÍTULO: ${productData.nome_produto.toUpperCase()} - MODO ESCALA
DESCRIÇÃO: ${productData.descricao} otimizada para quem não tem tempo a perder.
BENEFÍCIOS: ${productData.diferencial}, Rapidez e Status Premium.
PROMESSA PRINCIPAL: O ${productData.nome_produto} é o seu passe para o próximo nível.
PÚBLICO: ${productData.publico}
LEGENDA: Cansado de promessas vazias? O ${productData.nome_produto} chegou para mudar o jogo.

[ROTEIRO RÍGIDO]
GANCHO: Pare o que está fazendo AGORA!
PROBLEMA: ${productData.problema}
SOLUÇÃO: O ${productData.nome_produto} resolve isso em segundos.
CTA FINAL: Clique no botão abaixo e mude sua realidade.

[MODO ACHADINHO]
FRASE VIRAL: ESSE É O FAMOSO PRODUTO MÁGICO QUE TODO MUNDO QUER! 🌟
3 BULLETS RÁPIDOS: - Resolve ${productData.problema}, - Tem ${productData.diferencial}, - Preço de lançamento.
CTA CURTO: Corre no link da bio agora!

[CHECKLIST FINAL]
CHECKLIST:
[x] Título Validado
[x] Copy Persuasiva
[x] Pronto para Publicar
[x] Canal Definido

[PROMPTS DE IMAGEM]
Cinematic drone shot of the product, 8k, photorealistic, luxury vibes.
            `;
            resolve(mockResponse);
        }, 2000);
    });
}

/**
 * Parser Estruturado
 */
function parseResponseToTemplate(rawResponse, template) {
    let output = template;
    const mapping = {
        'SCORE DE PRODUTO': '{{SCORE}}',
        'TÍTULO V1': '{{TITULO_V1}}',
        'TÍTULO V2': '{{TITULO_V2}}',
        'PROMESSA V1': '{{PROMESSA_V1}}',
        'PROMESSA V2': '{{PROMESSA_V2}}',
        'GANCHO V1': '{{GANCHO_V1}}',
        'GANCHO V2': '{{GANCHO_V2}}',
        'EMOÇÃO': '{{EMOCAO}}',
        'DOR': '{{DOR}}',
        'DESEJO': '{{DESEJO}}',
        'TRANSFORMAÇÃO': '{{TRANSFORMACAO}}',
        'TÍTULO': '{{TITULO}}',
        'DESCRIÇÃO': '{{DESCRICAO}}',
        'BENEFÍCIOS': '{{BENEFICIOS}}',
        'PROMESSA PRINCIPAL': '{{PROMESSA_FORTE}}',
        'PÚBLICO': '{{PUBLICO}}',
        'LEGENDA': '{{LEGENDA}}',
        'GANCHO': '{{GANCHO}}',
        'PROBLEMA': '{{PROBLEMA_DOR}}',
        'SOLUÇÃO': '{{SOLUCAO}}',
        'CTA': '{{CTA}}',
        'FRASE VIRAL': '{{ACHADINHO_FRASE}}',
        '3 BULLETS RÁPIDOS': '{{ACHADINHO_BULLETS}}',
        'CTA CURTO': '{{ACHADINHO_CTA}}',
        'CHECKLIST': '{{CHECKLIST}}',
        'WHATSAPP': '{{WHATSAPP}}',
        'PROMPTS': '{{PROMPTS}}'
    };

    Object.keys(mapping).forEach(section => {
        // Regex para capturar conteúdo até a próxima tag principal ou fim de colchetes ou fim de linha com nova tag
        const regex = new RegExp(`${section}:?\\s*([\\s\\S]*?)(?=\\n[A-ZÁÉÍÓÚ 0-9\\[\\]]+:|\\n---+|$)`, 'i');
        const match = rawResponse.match(regex);
        const value = match ? match[1].trim() : "Não gerado";
        
        // Substituição global manual
        output = output.split(mapping[section]).join(value);
    });

    return output;
}

/**
 * Processa um único arquivo
 */
async function processFile(file) {
    const startTime = Date.now();
    const inputPath = path.join(inputDir, file);
    const processingPath = path.join(processingDir, file);
    const processedPath = path.join(processedDir, file);
    
    let productID = "";

    try {
        // 1. Mover para /processando
        fs.renameSync(inputPath, processingPath);
        
        const inputData = JSON.parse(fs.readFileSync(processingPath, 'utf8'));
        
        // Validação básica
        if (!inputData.nome_produto) throw new Error("nome_produto ausente");

        // 2. Gerar ID Único
        config.last_id++;
        saveConfig();
        productID = `NX-${config.last_id.toString().padStart(4, '0')}`;
        
        log('info', `Iniciando processamento ${productID}: ${inputData.nome_produto}`);

        // 3. Preparar e Chamar LLM
        const promptBase = fs.readFileSync(promptFilePath, 'utf8');
        const finalPrompt = `${promptBase}\n\nPRODUTO: ${inputData.nome_produto}\nDESCRIÇÃO: ${inputData.descricao}\nPROBLEMA: ${inputData.problema}\nPÚBLICO: ${inputData.publico}\nCANAL: ${inputData.canal}\nPREÇO: ${inputData.preco}\nDIFERENCIAL: ${inputData.diferencial}`;
        
        const rawAIResponse = await callLLM(finalPrompt, inputData);

        // 4. Formatar Template
        const templateContent = fs.readFileSync(templateFilePath, 'utf8');
        let finalOutput = parseResponseToTemplate(rawAIResponse, templateContent);
        
        // Adicionar ID no topo do arquivo
        finalOutput = `Identificador: ${productID}\n${finalOutput}`;

        // 5. Salvar Saída
        const slug = slugify(inputData.nome_produto);
        const outputFileName = `${productID}-${slug}.txt`;
        const outputFilePath = path.join(outputDir, outputFileName);
        
        fs.writeFileSync(outputFilePath, finalOutput);

        // 6. Mover para /processados
        fs.renameSync(processingPath, processedPath);
        
        const duration = Date.now() - startTime;
        log('info', `Sucesso ${productID}! Gerado: ${outputFileName}`);
        logPerformance(productID, duration, "OK");

    } catch (error) {
        const duration = Date.now() - startTime;
        log('error', `Falha ao processar ${file}`, { error: error.message });
        logPerformance(productID || "N/A", duration, "ERRO");
        
        // Mover para processados mesmo com erro para desobstruir a fila
        if (fs.existsSync(processingPath)) {
            fs.renameSync(processingPath, processedPath);
        }
    }
}

/**
 * Loop Contínuo
 */
async function worker() {
    log('info', `Worker iniciado. Monitorando ${inputDir}...`);
    
    while (true) {
        const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json'));
        
        if (files.length > 0) {
            log('info', `Encontrados ${files.length} arquivos para processar.`);
            for (const file of files) {
                await processFile(file);
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, config.loop_interval_ms));
    }
}

worker().catch(e => log('error', 'Erro fatal no Worker', { error: e.message }));
