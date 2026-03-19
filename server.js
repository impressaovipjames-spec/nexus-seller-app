process.on('uncaughtException', (err) => {
  console.error('🔥 ERRO NÃO CAPTURADO:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('🔥 PROMISE QUEBROU:', err);
});

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const upload = multer({ dest: 'uploads/' });
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const PORT = process.env.PORT || config.port || 8080;
console.log(`🔥 SERVER ATIVO NA PORTA ${PORT}`);

const https = require('https');

// Configurações
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const inputDir = path.resolve(__dirname, config.input_dir);
const outputDir = path.resolve(__dirname, config.output_dir);
const metricsPath = path.join(__dirname, 'metrics', 'metrics.json');
const promptFilePath = path.resolve(__dirname, config.prompt_file);
const templateFilePath = path.resolve(__dirname, config.template_file);

// Garantir que pastas existem
[inputDir, outputDir, path.join(__dirname, 'metrics')].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/**
 * Utilitários do Motor (Migrados do main.js)
 */
async function callLLM(prompt, productData) {
    let modifier = "";
    if (productData.nome_produto.startsWith("ESCALA:")) {
        modifier = "\n\n⚠️ MODO ESCALA ATIVADO: Este produto já é um campeão de vendas. Sua missão é criar variações ainda mais agressivas, curtas e magnéticas para escala de anúncios. Foque em quebra de padrão total.";
    }
    const fullPrompt = `${prompt}${modifier}\n\nPRODUTO: ${JSON.stringify(productData)}`;
    
    if (config.api_key && config.api_key !== "YOUR_API_KEY_HERE") {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] });
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
                        } else { reject(new Error('Resposta inválida da API')); }
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
            resolve(`
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
CHECKLIST: [x] Título Validado [x] Copy Persuasiva [x] Pronto para Publicar [x] Canal Definido

[PROMPTS DE IMAGEM]
Cinematic drone shot of the product, 8k, photorealistic, luxury vibes.
            `);
        }, 1500);
    });
}

function parseResponseToTemplate(rawResponse, template) {
    let output = template;
    const mapping = {
        'SCORE DE PRODUTO': '{{SCORE}}', 'TÍTULO V1': '{{TITULO_V1}}', 'TÍTULO V2': '{{TITULO_V2}}',
        'PROMESSA V1': '{{PROMESSA_V1}}', 'PROMESSA V2': '{{PROMESSA_V2}}', 'GANCHO V1': '{{GANCHO_V1}}',
        'GANCHO V2': '{{GANCHO_V2}}', 'EMOÇÃO': '{{EMOCAO}}', 'DOR': '{{DOR}}', 'DESEJO': '{{DESEJO}}',
        'TRANSFORMAÇÃO': '{{TRANSFORMACAO}}', 'TÍTULO': '{{TITULO}}', 'DESCRIÇÃO': '{{DESCRICAO}}',
        'BENEFÍCIOS': '{{BENEFICIOS}}', 'PROMESSA PRINCIPAL': '{{PROMESSA_FORTE}}', 'PÚBLICO': '{{PUBLICO}}',
        'LEGENDA': '{{LEGENDA}}', 'GANCHO': '{{GANCHO}}', 'PROBLEMA': '{{PROBLEMA_DOR}}',
        'SOLUÇÃO': '{{SOLUCAO}}', 'CTA': '{{CTA}}', 'FRASE VIRAL': '{{ACHADINHO_FRASE}}',
        '3 BULLETS RÁPIDOS': '{{ACHADINHO_BULLETS}}', 'CTA CURTO': '{{ACHADINHO_CTA}}',
        'CHECKLIST': '{{CHECKLIST}}', 'WHATSAPP': '{{WHATSAPP}}', 'PROMPTS': '{{PROMPTS}}'
    };

    Object.keys(mapping).forEach(section => {
        const regex = new RegExp(`${section}:?\\s*([\\s\\S]*?)(?=\\n[A-ZÁÉÍÓÚ 0-9\\[\\]]+:|\\n---+|$)`, 'i');
        const match = rawResponse.match(regex);
        const value = match ? match[1].trim() : "Não gerado";
        output = output.split(mapping[section]).join(value);
    });
    return output;
}

/**
 * API: Gerar novo kit (Síncrono/Tempo Real)
 */
app.post('/api/generate', async (req, res) => {
    try {
        const productData = req.body;
        if (!productData.nome_produto) {
            return res.status(400).json({ error: 'Nome do produto é obrigatório' });
        }

        // Salvar input (para backup)
        const fileName = `${Date.now()}_input.json`;
        fs.writeFileSync(path.join(inputDir, fileName), JSON.stringify(productData, null, 2));
        
        // Processar em tempo real
        const promptBase = fs.readFileSync(promptFilePath, 'utf8');
        const finalPrompt = `${promptBase}\n\nPRODUTO: ${productData.nome_produto}\nDESCRIÇÃO: ${productData.descricao}\nPROBLEMA: ${productData.problema}\nPÚBLICO: ${productData.publico}\nCANAL: ${productData.canal}\nPREÇO: ${productData.preco}\nDIFERENCIAL: ${productData.diferencial}`;
        
        const rawAIResponse = await callLLM(finalPrompt, productData);
        const templateContent = fs.readFileSync(templateFilePath, 'utf8');
        let finalOutput = parseResponseToTemplate(rawAIResponse, templateContent);
        
        // Incrementar ID e Salvar Output
        config.last_id++;
        fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 2));
        const productID = `NX-${config.last_id.toString().padStart(4, '0')}`;
        finalOutput = `Identificador: ${productID}\n${finalOutput}`;

        const outputFileName = `${productID}-${productData.nome_produto.replace(/\s+/g, '_').toLowerCase()}.txt`;
        fs.writeFileSync(path.join(outputDir, outputFileName), finalOutput);

        res.json({ success: true, content: finalOutput, id: productID });
    } catch (error) {
        console.error('Erro na API Generate:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * API: Listar histórico de kits gerados
 */
app.get('/api/history', (req, res) => {
    try {
        const files = fs.readdirSync(outputDir)
            .filter(f => f.endsWith('.txt'))
            .map(f => {
                const stats = fs.statSync(path.join(outputDir, f));
                return {
                    name: f,
                    created: stats.birthtime,
                    id: f.split('-')[0] // Pega o NX-XXXX
                };
            })
            .sort((a, b) => b.created - a.created);

        res.json(files);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * API: Obter conteúdo de um kit
 */
app.get('/api/output/:filename', (req, res) => {
    try {
        const filePath = path.join(outputDir, req.params.filename);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            res.json({ content });
        } else {
            res.status(404).json({ error: 'Arquivo não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para buscar métricas
app.get('/api/metrics', (req, res) => {
    if (!fs.existsSync(metricsPath)) {
        return res.json({});
    }
    const data = fs.readFileSync(metricsPath, 'utf8');
    res.json(JSON.parse(data || '{}'));
});

// Endpoint para atualizar métricas
app.post('/api/metrics', (req, res) => {
    const { id, type, value } = req.body;
    let metrics = {};
    
    if (fs.existsSync(metricsPath)) {
        metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8') || '{}');
    }

    if (!metrics[id]) {
        metrics[id] = { clicks: 0, sales: 0, name: 'Produto Desconhecido' };
    }

    if (type === 'name') metrics[id].name = value;
    else metrics[id][type] = parseInt(value) || 0;

    fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
    res.json({ success: true, metrics: metrics[id] });
});

// Health Check
app.get('/health', (req, res) => {
    res.send('OK - NEXUS IS ALIVE');
});

// --- NEXUS V2 - PIPELINE ARKHEON + LEXION + GEMINI ---
app.post('/api/generate-v2', upload.single('image'), async (req, res) => {
    let imagePath = null;
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'O Orion precisa da foto do produto para o Arkheon escanear.' });

        const preco = req.body.preco || "Sob consulta";
        imagePath = req.file.path;
        const imageBase64 = fs.readFileSync(imagePath).toString('base64');

        // ESTÁGIO 1: HARKHEON (Scanner de Dor e Visão)
        console.log("📡 Ativando HARKHEON (O Princípio da Visão)...");
        const harkheonFullManual = fs.readFileSync(path.join(__dirname, 'prompts', 'harkheon_full.txt'), 'utf8');
        
        const harkheonSystemContext = `
        ${harkheonFullManual}
        
        MÓDULO LUZ ATIVO: Comece a resposta com um versículo NVI real.
        
        MISSÃO ATUAL:
        Analise a imagem fornecida. 
        Execute o MÓDULO 1: SCAN DE DORES (PROCESSO COMPLETO).
        Entregue a SAÍDA PADRÃO: PRODUTO, CATEGORIA, PÚBLICO, DOR, DESEJO, GANHO EMOCIONAL.
        Identifique a OPORTUNIDADE PRINCIPAL e PRÓXIMO PASSO SUGERIDO.
        Use o Protocolo AAH se houver incertezas.
        `;

        const arkheonResult = await callArkheon(harkheonSystemContext, imageBase64);
        console.log("✅ HARKHEON Concluído.");

        // ESTÁGIO 2: LEXION (Engenharia de Prompt)
        console.log("📡 Ativando LEXION (Diretor de Criação)...");
        const lexionFullManual = fs.readFileSync(path.join(__dirname, 'prompts', 'lexion_full.txt'), 'utf8');
        
        const lexionSystemContext = `
        ${lexionFullManual}
        
        MISSÃO ATUAL:
        Transformar a análise do ARKHEON em um PROMPT FINAL de alta conversão.
        Siga os templates da Parte 2 (VÍDEO, IMAGEM, CRIAÇÃO) para compor a instrução para o GEMINI.
        O prompt final deve solicitar Título, Descrição, 5 Bullets, Legenda e CTA.
        `;

        const lexionInput = `ANÁLISE DO ARKHEON:\n${arkheonResult}\nPREÇO: ${preco}`;
        const lexionResult = await callLexion(lexionSystemContext, lexionInput);
        console.log("✅ LEXION Concluído.");

        // ESTÁGIO 3: GEMINI (Execução Final)
        console.log("📡 Ativando GEMINI (Execução Final)...");
        // O Lexion gera o "PROMPT FINAL: ...", precisamos extrair o conteúdo após esse marcador
        const finalPromptMatch = lexionResult.match(/PROMPT FINAL:([\s\S]*)/i);
        const finalPrompt = finalPromptMatch ? finalPromptMatch[1].trim() : lexionResult;
        
        const copyContent = await callLLM(finalPrompt, { nome_produto: "PRODUTO V2", preco: preco });
        console.log("✅ Geração Final Concluída.");

        // Salvar no Histórico
        const id = "NX-" + Math.floor(1000 + Math.random() * 9000);
        const filename = `${id}.txt`;
        fs.writeFileSync(path.join(outputDir, filename), copyContent);

        // Limpar arquivo temporário
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

        res.json({ success: true, content: copyContent, id: id });

    } catch (error) {
        console.error('🔥 FALHA NO PIPELINE ORION V2:', error);
        if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Funções Auxiliares do Pipeline
async function callArkheon(prompt, base64Image) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                ]
            }]
        });
        const options = getGeminiOptions('gemini-1.5-flash');
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (json.candidates && json.candidates[0].content) {
                        resolve(json.candidates[0].content.parts[0].text);
                    } else { reject(new Error('Arkheon falhou no scan.')); }
                } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function callLexion(systemPrompt, inputData) {
    const fullPrompt = `${systemPrompt}\n\nINPUT PARA ESTRUTURAÇÃO:\n${inputData}`;
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] });
        const options = getGeminiOptions('gemini-1.5-flash');
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (json.candidates && json.candidates[0].content) {
                        resolve(json.candidates[0].content.parts[0].text);
                    } else { reject(new Error('Lexion falhou na estruturação.')); }
                } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function getGeminiOptions(model) {
    const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    return {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${model}:generateContent?key=${config.api_key}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    };
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 NEXUS SELLER V2 - PIPELINE ORION ATIVO NA PORTA ${PORT}`);
});


