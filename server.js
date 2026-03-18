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

const app = express();
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const PORT = process.env.PORT || config.port || 8080;
console.log(`🔥 SERVER ATIVO NA PORTA ${PORT}`);

// Configurações
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const inputDir = path.resolve(__dirname, config.input_dir);
const outputDir = path.resolve(__dirname, config.output_dir);
const metricsPath = path.join(__dirname, 'metrics', 'metrics.json');

/**
 * API: Salvar novo produto para processamento
 */
app.post('/api/generate', (req, res) => {
    try {
        const productData = req.body;
        if (!productData.nome_produto) {
            return res.status(400).json({ error: 'Nome do produto é obrigatório' });
        }

        const fileName = `${Date.now()}_input.json`;
        fs.writeFileSync(path.join(inputDir, fileName), JSON.stringify(productData, null, 2));
        
        res.json({ success: true, message: 'Produto enviado para o motor com sucesso', fileName });
    } catch (error) {
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 SERVER REALMENTE ATIVO NA PORTA ${PORT}`);
});
