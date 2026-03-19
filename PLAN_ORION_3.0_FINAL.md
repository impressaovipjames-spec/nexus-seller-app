# 🚀 NEXUS SELLER V2 — ARQUITETURA FINAL ORION 3.0

Integração dos núcleos ARKHEON (Visão), LEXION (Copy), SOLARIS (Arte) e POLLINATIONS (Geração) para um sistema 100% autônomo de "Esforço Zero".

## 🧠 Fluxo de Execução (5 Estágios)

1.  **HARKHEON**: Escaneia a imagem do produto e extrai Inteligência Emocional (Dor/Desejo/Público).
2.  **LEXION**: Recebe a análise e gera o prompt de venda mestre para o Gemini.
3.  **SOLARIS**: Recebe a análise e gera a Direção de Arte (Prompt Visual) otimizado para IA.
4.  **POLLINATIONS**: Gera o criativo visual (imagem real) com base no prompt do Solaris.
5.  **GEMINI**: Gera a copy final (Título, Descrição, Bullets, Legenda, CTA).

## Proposed Changes

### Backend (server.js)

#### [MODIFY] [server.js](file:///e:/VIPNEXUSIA/NEXUS%20SELLER/nexus-seller/server.js)
- Implementar os Estágioss 3 (Solaris) e 4 (Pollinations).
- Integrar a chamada à API do Pollinations para gerar a imagem.
- Ajustar a resposta final da API para incluir o link da imagem gerada.

#### [NEW] [solaris_full.txt](file:///e:/VIPNEXUSIA/NEXUS%20SELLER/nexus-seller/prompts/solaris_full.txt)
- Consolidação dos manuais Master Solaris Parte 1 e 2.

### Frontend (User Interface)

#### [MODIFY] [script.js](file:///e:/VIPNEXUSIA/NEXUS%20SELLER/nexus-seller/public/script.js)
- Adicionar lógica para exibir a imagem gerada pelo Pollinations.
- Criar container de exibição do "Criativo Gerado".

#### [MODIFY] [style.css](file:///e:/VIPNEXUSIA/NEXUS%20SELLER/nexus-seller/public/style.css)
- Adicionar estilos para o preview do criativo gerado.

## Verification Plan

### Automated Tests
- Testar a rota `/api/generate-v2` com uma imagem de teste.
- Verificar se o prompt gerado pelo Solaris é enviado corretamente ao Pollinations.
- Validar se a resposta final contém tanto a copy (Gemini) quanto a imagem (Pollinations).

### Visual Verification
- Validar se a imagem gerada corresponde ao produto enviado (via Solaris/Pollinations).
- Verificar se a copy segue os padrões de elite do Lexion.
