// IMPORTADOR INTELIGENTE DE DADOS

let pendingImportedItems = [];

function renderImports() {
    renderImportPreview();
    renderAttachmentsList();
}

function setupTransactionDropzone() {
    setupDropzone('transactionDropzone');
}

function setupImportDropzone() {
    setupDropzone('importDropzone');
}

function setupDropzone(id) {
    const dropzone = document.getElementById(id);
    if (!dropzone) return;

    dropzone.addEventListener('dragover', event => {
        event.preventDefault();
        dropzone.classList.add('active');
    });

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('active'));
    dropzone.addEventListener('drop', event => {
        event.preventDefault();
        dropzone.classList.remove('active');
        processSmartImportFiles(Array.from(event.dataTransfer.files));
    });
}

function handleSmartImportFiles(event) {
    processSmartImportFiles(Array.from(event.target.files || []));
    event.target.value = '';
}

function renderAISettings() {
    const keyInput = document.getElementById('openaiApiKeyInput');
    const modelInput = document.getElementById('openaiModelInput');
    const status = document.getElementById('aiStatusText');
    if (!keyInput || !modelInput || !status) return;

    keyInput.value = app.data.preferences.openaiApiKey || '';
    modelInput.value = app.data.preferences.openaiModel || 'gpt-4o-mini';
    status.textContent = app.data.preferences.openaiApiKey
        ? 'IA ativa: novos anexos serão interpretados pelo modelo antes das regras locais.'
        : 'Sem chave: o app usa apenas regras locais.';
    renderAITrainingList();
}

function saveAISettings(event) {
    event.preventDefault();
    app.data.preferences.openaiApiKey = document.getElementById('openaiApiKeyInput').value.trim();
    app.data.preferences.openaiModel = document.getElementById('openaiModelInput').value.trim() || 'gpt-4o-mini';
    saveData();
    renderAISettings();
    showNotification('Configuração da IA salva!');
}

function saveAITrainingExample(event) {
    event.preventDefault();
    const text = document.getElementById('aiTrainingText').value.trim();
    const type = document.getElementById('aiTrainingType').value;
    const category = document.getElementById('aiTrainingCategory').value.trim();
    if (!text || !category) {
        showNotification('Preencha o exemplo e a categoria correta.', 'danger');
        return;
    }

    app.data.aiTrainingExamples = app.data.aiTrainingExamples || [];
    app.data.aiTrainingExamples.push({ id: generateId(), text, type, category });
    app.data.aiTrainingExamples = app.data.aiTrainingExamples.slice(-20);
    saveData();
    event.target.reset();
    renderAITrainingList();
    showNotification('Exemplo de treino adicionado!');
}

function deleteAITrainingExample(id) {
    app.data.aiTrainingExamples = (app.data.aiTrainingExamples || []).filter(item => item.id !== id);
    saveData();
    renderAITrainingList();
}

function renderAITrainingList() {
    const list = document.getElementById('aiTrainingList');
    if (!list) return;

    const examples = app.data.aiTrainingExamples || [];
    if (!examples.length) {
        list.innerHTML = '<p class="muted-text">Nenhum exemplo treinado ainda.</p>';
        return;
    }

    list.innerHTML = examples.slice().reverse().map(item => `
        <div class="finance-row">
            <div>
                <div class="finance-row-title">${item.category}</div>
                <div class="finance-row-meta">${item.type} · ${item.text.slice(0, 90)}</div>
            </div>
            <button class="btn btn-sm btn-danger" onclick="deleteAITrainingExample(${item.id})">Excluir</button>
        </div>
    `).join('');
}

function processSmartImportFiles(files) {
    if (!files.length) return;
    pendingImportedItems = [];

    files.forEach(file => {
        if (/\.pdf$/i.test(file.name)) {
            processPdfImport(file);
            return;
        }

        if (isBinaryDocument(file.name)) {
            processImageImport(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = async event => {
            const rows = parseImportedContent(event.target.result, file.name);
            const interpreted = [];
            for (const row of rows) {
                interpreted.push(await interpretFinancialRowWithAI(row, file.name));
            }
            registerImportedFile(file.name, interpreted);
            showNotification(`${file.name} interpretado com ${interpreted.length} item(ns).`);
        };
        reader.readAsText(file);
    });
}

function processPdfImport(file) {
    const reader = new FileReader();
    reader.onload = async event => {
        try {
            const text = await extractPdfText(event.target.result);
            const interpreted = await interpretPdfContent(text, file.name, file.type || 'pdf');
            registerImportedFile(file.name, interpreted);
            showNotification(`${file.name} interpretado pelo conteúdo do PDF.`);
        } catch (error) {
            const interpreted = [await interpretFinancialRowWithAI({ description: file.name, arquivo: file.name, tipo_arquivo: file.type || 'pdf' }, file.name)];
            registerImportedFile(file.name, interpreted);
            showNotification(`${file.name} não pôde ser lido por texto. Use PDF com texto selecionável ou CSV/XML.`, 'danger');
        }
    };
    reader.readAsArrayBuffer(file);
}

async function interpretPdfContent(text, fileName, fileType) {
    const cofrinhoItems = parsePicPayCofrinhoHistory(text, fileName);
    if (cofrinhoItems.length) return cofrinhoItems;

    return [
        await interpretFinancialRowWithAI({
            description: text || fileName,
            arquivo: fileName,
            tipo_arquivo: fileType
        }, fileName)
    ];
}

function parsePicPayCofrinhoHistory(text, fileName) {
    const normalized = normalizeText(`${text} ${fileName}`);
    if (!normalized.includes('picpay') || !normalized.includes('movimentacoes no cofrinho')) {
        return [];
    }

    const cleanText = String(text || '').replace(/\s+/g, ' ').trim();
    const productMatch = cleanText.match(/Movimenta(?:ções|coes)\s+no\s+Cofrinho\s+(.+?)\s+\d{2}\s+de\s+/i);
    const product = productMatch ? productMatch[1].trim() : 'Cofrinho PicPay';
    const source = product.toLowerCase().includes('picpay') ? product : `PicPay ${product}`;
    const account = app.data.accounts[0]?.id || null;
    const items = [];
    const dayRegex = /((?:(?:Guardado|Resgatado|Rendimentos)\s*[+-]\s*R\$\s*[\d.]+,\d{2}\s*)+)\s*Movimenta(?:ções|coes)\s+Valor\s+Saldo\s+ao\s+final\s+do\s+dia:\s*R\$\s*([\d.]+,\d{2})\s+Data:\s*(\d{2}\/[a-zç]{3}\/\d{4})/gi;

    let dayMatch;
    while ((dayMatch = dayRegex.exec(cleanText)) !== null) {
        const movementsText = dayMatch[1];
        const closingBalance = parseCurrency(dayMatch[2]);
        const date = parsePicPayDate(dayMatch[3]);
        const movementRegex = /(Guardado|Resgatado|Rendimentos)\s*([+-])\s*R\$\s*([\d.]+,\d{2})/gi;
        let movementMatch;

        while ((movementMatch = movementRegex.exec(movementsText)) !== null) {
            const movement = movementMatch[1];
            const sign = movementMatch[2];
            const value = parseCurrency(movementMatch[3]);
            const transactionType = getCofrinhoTransactionType(movement);
            const category = getCofrinhoCategory(movement);
            const target = getCofrinhoTarget(movement);

            items.push({
                id: generateId(),
                sourceFile: fileName,
                raw: {
                    movement,
                    sign,
                    closingBalance,
                    date,
                    product
                },
                description: `${source} - ${movement}`,
                value,
                date,
                target,
                confidence: 'alta',
                transaction: {
                    id: generateId(),
                    type: transactionType,
                    description: `${source} - ${movement}`,
                    source,
                    value,
                    category,
                    account,
                    date,
                    status: 'paid',
                    note: `importado:${fileName} | PicPay Cofrinho | saldo do dia ${dayMatch[2]}`
                }
            });
        }
    }

    if (items.length) {
        const latest = items[items.length - 1];
        const totals = items.reduce((summary, item) => {
            summary[item.raw.movement] = (summary[item.raw.movement] || 0) + item.value;
            return summary;
        }, {});

        items.unshift({
            id: generateId(),
            sourceFile: fileName,
            raw: {
                summary: true,
                closingBalance: latest.raw.closingBalance,
                date: latest.date,
                product,
                totals
            },
            description: `${source} - Saldo atual`,
            value: latest.raw.closingBalance,
            date: latest.date,
            target: 'Saldo atual do Cofrinho',
            confidence: 'alta',
            summaryOnly: true,
            investmentSnapshot: true,
            transaction: {
                source
            }
        });
    }

    return items;
}

function parsePicPayDate(value) {
    const months = {
        jan: '01',
        fev: '02',
        mar: '03',
        abr: '04',
        mai: '05',
        jun: '06',
        jul: '07',
        ago: '08',
        set: '09',
        out: '10',
        nov: '11',
        dez: '12'
    };
    const match = String(value || '').toLowerCase().match(/^(\d{2})\/([a-zç]{3})\/(\d{4})$/);
    if (!match) return new Date().toISOString().split('T')[0];
    return `${match[3]}-${months[match[2]] || '01'}-${match[1]}`;
}

function getCofrinhoTransactionType(movement) {
    return movement === 'Guardado' ? 'investment' : 'income';
}

function getCofrinhoCategory(movement) {
    if (movement === 'Guardado') return 'Cofrinho PicPay';
    if (movement === 'Resgatado') return 'Resgate de Investimento';
    return 'Rendimento de Investimento';
}

function getCofrinhoTarget(movement) {
    if (movement === 'Guardado') return 'Investimentos > Cofrinho PicPay';
    if (movement === 'Resgatado') return 'Resgate do Cofrinho';
    return 'Rendimento do Cofrinho';
}

function upsertCofrinhoInvestmentFromImport(item) {
    const totals = item.raw?.totals || {};
    const investedPrincipal = Math.max(Number(totals.Guardado || 0) - Number(totals.Resgatado || 0), 0);
    const currentValue = Number(item.value || 0);
    const existing = app.data.investments.find(investment =>
        investment.isCofrinhoPicPay || investment.ticker === 'COFRINHO-PICPAY'
    );
    const investment = {
        id: existing?.id || generateId(),
        assetType: 'fixedIncome',
        ticker: 'COFRINHO-PICPAY',
        name: item.raw?.product || 'Cofrinho PicPay',
        quantity: 1,
        averagePrice: investedPrincipal || currentValue,
        currentPrice: currentValue,
        targetPrice: existing?.targetPrice || 0,
        lastUpdated: new Date(`${item.date}T12:00:00`).toISOString(),
        source: item.transaction?.source || 'PicPay Cofrinho',
        isCofrinhoPicPay: true,
        cofrinhoTotals: totals,
        quoteHistory: [
            ...(existing?.quoteHistory || []),
            { date: new Date(`${item.date}T12:00:00`).toISOString(), price: currentValue }
        ].slice(-60)
    };

    if (existing) {
        Object.assign(existing, investment);
    } else {
        app.data.investments.push(investment);
    }

    app.selectedInvestmentId = investment.id;
    return investment;
}

function processImageImport(file) {
    const reader = new FileReader();
    reader.onload = async event => {
        const row = {
            description: file.name,
            arquivo: file.name,
            tipo_arquivo: file.type || 'imagem',
            imageDataUrl: event.target.result
        };
        const interpreted = [await interpretFinancialRowWithAI(row, file.name)];
        registerImportedFile(file.name, interpreted);
        showNotification(`${file.name} interpretado${app.data.preferences.openaiApiKey ? ' pela IA' : ' pelo nome do arquivo'}.`);
    };
    reader.readAsDataURL(file);
}

async function extractPdfText(arrayBuffer) {
    if (!window.pdfjsLib) {
        throw new Error('PDF.js indisponível');
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(content.items.map(item => item.str).join(' '));
    }

    return pages.join('\n');
}

function registerImportedFile(fileName, interpreted) {
    pendingImportedItems.push(...interpreted);
    app.data.attachments.push({
        id: generateId(),
        fileName,
        importedAt: new Date().toISOString(),
        rows: interpreted.length
    });

    saveData();
    renderSmartImportPreviews();
}

function isBinaryDocument(fileName) {
    return /\.(pdf|png|jpe?g|webp)$/i.test(fileName);
}

function parseImportedContent(content, fileName) {
    if (fileName.toLowerCase().endsWith('.json')) {
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) return parsed;
            if (Array.isArray(parsed.items)) return parsed.items;
            if (Array.isArray(parsed.transactions)) return parsed.transactions;
            return [parsed];
        } catch (error) {
            return [{ description: content }];
        }
    }

    if (fileName.toLowerCase().endsWith('.csv')) {
        const lines = content.split(/\r?\n/).filter(Boolean);
        if (!lines.length) return [];
        const separator = lines[0].includes(';') ? ';' : ',';
        const headers = splitCsvLine(lines[0], separator).map(header => normalizeKey(header));

        return lines.slice(1).map(line => {
            const values = splitCsvLine(line, separator);
            return headers.reduce((row, header, index) => {
                row[header] = values[index] || '';
                return row;
            }, {});
        });
    }

    return content.split(/\r?\n/).filter(Boolean).map(line => ({ description: line }));
}

function splitCsvLine(line, separator) {
    const regex = new RegExp(`${separator}(?=(?:[^"]*"[^"]*")*[^"]*$)`);
    return line.split(regex).map(value => value.replace(/^"|"$/g, '').trim());
}

function normalizeKey(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '_');
}

function interpretFinancialRow(row, fileName) {
    const rawText = Object.values(row).join(' ');
    const text = normalizeText(`${rawText} ${fileName}`);
    const value = extractValue(row, `${rawText} ${fileName}`);
    const date = extractDate(row) || new Date().toISOString().split('T')[0];
    const description = row.descricao || row.description || row.historico || row.nome || rawText.slice(0, 80) || fileName;
    const source = row.fonte || row.source || row.emitente || row.fornecedor || row.cliente || inferSourceFromText(description, fileName);
    const account = app.data.accounts[0]?.id || null;
    const result = {
        id: generateId(),
        sourceFile: fileName,
        raw: row,
        description,
        value,
        date,
        target: 'Transação',
        confidence: 'media',
        transaction: {
            id: generateId(),
            type: 'expense',
            description,
            source,
            value,
            category: 'Utilidades',
            account,
            date,
            status: 'paid',
            note: `importado:${fileName}`
        }
    };

    if (hasAny(text, ['nota fiscal', 'nota fiscal de servicos', 'notafiscal', 'nf e', 'nfe', 'nfse', 'nfs e', 'servico prestado', 'fatura emitida', 'receita liquida', 'valor liquido'])) {
        result.target = 'Receita Líquida';
        result.confidence = 'alta';
        result.transaction.type = 'income';
        result.transaction.category = hasAny(text, ['nota fiscal', 'nota fiscal de servicos', 'notafiscal', 'nf e', 'nfe', 'nfse', 'nfs e']) ? 'Nota Fiscal Emitida' : 'Receita Líquida';
    } else if (hasAny(text, ['imposto', 'das', 'irpj', 'csll', 'iss', 'inss', 'tributo'])) {
        result.target = 'Impostos';
        result.confidence = 'alta';
        result.transaction.type = 'expense';
        result.transaction.category = 'Impostos';
    } else if (hasAny(text, ['cartao', 'cartão', 'fatura', 'credito', 'crédito'])) {
        result.target = 'Cartão de Crédito';
        result.transaction.category = 'Cartão de Crédito';
    } else if (hasAny(text, ['aluguel', 'internet', 'energia', 'telefone', 'assinatura', 'mensalidade'])) {
        result.target = 'Gasto Fixo';
        result.transaction.category = 'Gasto Fixo';
    } else if (hasAny(text, ['acao', 'ação', 'acoes', 'ações', 'ticker', 'tesouro', 'cdb', 'fii', 'cripto', 'bitcoin'])) {
        result.target = 'Investimentos';
        result.transaction.type = 'investment';
        result.transaction.category = 'Ações';
    }

    return result;
}

async function interpretFinancialRowWithAI(row, fileName) {
    const fallback = interpretFinancialRow(row, fileName);
    if (!app.data.preferences.openaiApiKey) return fallback;

    try {
        const ai = await classifyFinancialDocumentWithAI(row, fileName);
        if (!ai) return fallback;

        return buildImportedItemFromAI(ai, row, fileName, fallback);
    } catch (error) {
        console.warn('AI classification failed, using local rules', error);
        return fallback;
    }
}

async function classifyFinancialDocumentWithAI(row, fileName) {
    const apiKey = app.data.preferences.openaiApiKey;
    const model = app.data.preferences.openaiModel || 'gpt-4o-mini';
    const rawText = String(row.description || Object.values(row).join(' ')).slice(0, 18000);
    const examples = (app.data.aiTrainingExamples || []).slice(-12).map(item => ({
        text: item.text,
        type: item.type,
        category: item.category
    }));

    const content = [
        {
            type: 'input_text',
            text: [
                'Interprete este documento financeiro brasileiro e retorne somente JSON conforme o schema.',
                'Regras principais:',
                '- Nota fiscal emitida pelo usuário/prestador deve ser income, categoria Nota Fiscal Emitida ou Receita Líquida.',
                '- Valor líquido, valor serviços ou total da nota deve ser usado como value.',
                '- Comprovante de aluguel/internet/energia/assinatura deve ser expense, categoria Gasto Fixo.',
                '- Fatura ou compra de cartão deve ser expense, categoria Cartão de Crédito.',
                '- Impostos/DAS/ISS/IR/INSS devem ser expense, categoria Impostos.',
                '- Compra/aporte em ação/cripto deve ser investment.',
                `Arquivo: ${fileName}`,
                `Exemplos treinados: ${JSON.stringify(examples)}`,
                `Texto extraído: ${rawText}`
            ].join('\n')
        }
    ];

    if (row.imageDataUrl) {
        content.push({ type: 'input_image', image_url: row.imageDataUrl });
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model,
            input: [
                {
                    role: 'user',
                    content
                }
            ],
            text: {
                format: {
                    type: 'json_schema',
                    name: 'financial_document_classification',
                    strict: true,
                    schema: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            type: { type: 'string', enum: ['income', 'expense', 'investment'] },
                            category: { type: 'string' },
                            target: { type: 'string' },
                            description: { type: 'string' },
                            source: { type: 'string' },
                            value: { type: 'number' },
                            date: { type: 'string' },
                            confidence: { type: 'string', enum: ['alta', 'media', 'baixa'] },
                            reason: { type: 'string' }
                        },
                        required: ['type', 'category', 'target', 'description', 'source', 'value', 'date', 'confidence', 'reason']
                    }
                }
            }
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI ${response.status}`);
    }

    const payload = await response.json();
    const text = payload.output_text || payload.output?.flatMap(item => item.content || []).find(part => part.type === 'output_text')?.text;
    return text ? JSON.parse(text) : null;
}

function buildImportedItemFromAI(ai, row, fileName, fallback) {
    const account = app.data.accounts[0]?.id || null;
    const value = Number(ai.value || 0) || fallback.value || 0;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(ai.date) ? ai.date : fallback.date;

    return {
        id: generateId(),
        sourceFile: fileName,
        raw: row,
        description: ai.description || fallback.description,
        value,
        date,
        target: ai.target || ai.category || fallback.target,
        confidence: ai.confidence || 'media',
        transaction: {
            id: generateId(),
            type: ai.type || fallback.transaction.type,
            description: ai.description || fallback.transaction.description,
            source: ai.source || fallback.transaction.source,
            value,
            category: ai.category || fallback.transaction.category,
            account,
            date,
            status: 'paid',
            note: `importado:${fileName} · IA: ${ai.reason || 'classificado'}`
        }
    };
}

function hasAny(text, terms) {
    return terms.some(term => text.includes(term));
}

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[_-]+/g, ' ');
}

function inferSourceFromText(description, fileName) {
    const text = String(description || fileName || '').replace(/\.[a-z0-9]+$/i, '');
    return text.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Arquivo importado';
}

function extractValue(row, text) {
    const keys = ['valor_liquido', 'valorliquido', 'valor_servico', 'valor_nota', 'valor_total', 'valor', 'value', 'amount', 'total', 'preco', 'price'];
    for (const key of keys) {
        if (row[key]) return parseCurrency(row[key]);
    }

    const raw = String(text || '');
    const normalized = raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');

    const labeledPatterns = [
        /valor\s+liquido\s*r?\$?\s*(-?\d{1,3}(?:\.\d{3})*,\d{2})/i,
        /valor\s+servicos?\s*r?\$?\s*(-?\d{1,3}(?:\.\d{3})*,\d{2})/i,
        /valor\s+total\s*r?\$?\s*(-?\d{1,3}(?:\.\d{3})*,\d{2})/i,
        /total\s+r?\$?\s*(-?\d{1,3}(?:\.\d{3})*,\d{2})/i
    ];

    for (const pattern of labeledPatterns) {
        const match = normalized.match(pattern);
        if (match) return parseCurrency(match[1]);
    }

    const moneyWithSymbol = raw.match(/r\$\s*(-?\d{1,3}(?:\.\d{3})*,\d{2})/gi);
    if (moneyWithSymbol?.length) {
        return Math.max(...moneyWithSymbol.map(parseCurrency));
    }

    const matches = raw.match(/-?\d{1,3}(?:\.\d{3})*,\d{2}/g);
    if (!matches?.length) return 0;

    return Math.max(...matches.map(parseCurrency));
}

function parseCurrency(value) {
    const normalized = String(value)
        .replace(/[^\d,.-]/g, '')
        .replace(/\.(?=\d{3}(?:\D|$))/g, '')
        .replace(',', '.');
    return Math.abs(parseFloat(normalized) || 0);
}

function extractDate(row) {
    const value = row.data || row.date || row.emissao || row.vencimento;
    if (!value) return null;
    const text = String(value).trim();
    const br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) return `${br[3]}-${br[2]}-${br[1]}`;
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return iso ? iso[0] : null;
}

function renderImportPreview() {
    renderPreviewInto('importPreview');
    renderPreviewInto('transactionImportPreview');
}

function renderPreviewInto(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!pendingImportedItems.length) {
        if (containerId === 'transactionImportPreview') {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }
        container.style.display = 'block';
        container.innerHTML = '<p class="muted-text">Nenhum item pendente. Anexe um arquivo para ver a interpretação.</p>';
        return;
    }

    container.style.display = 'block';
    if (containerId === 'transactionImportPreview') {
        container.innerHTML = `
            <div class="transaction-import-list">
                ${pendingImportedItems.map(item => `
                    <div class="transaction-import-item">
                        <div>
                            <div class="finance-row-title">${item.description}</div>
                            <div class="finance-row-meta">${item.transaction?.source || item.sourceFile}</div>
                            <div class="finance-row-meta">${item.target}</div>
                        </div>
                        <div class="transaction-import-side">
                            <div class="finance-row-value">${formatCurrency(item.value)}</div>
                            <span class="badge ${item.confidence === 'alta' ? 'badge-success' : 'badge-warning'}">${item.confidence}</span>
                            ${item.investmentSnapshot
                                ? `<button class="btn btn-sm btn-primary" onclick="confirmImportedItem(${item.id})">Atualizar investimento</button>`
                                : item.summaryOnly
                                    ? '<span class="badge badge-primary">Resumo</span>'
                                    : `<button class="btn btn-sm btn-primary" onclick="confirmImportedItem(${item.id})">Criar lancamento</button>`}
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-primary transaction-confirm-all" onclick="confirmAllImportedItems()">Criar Todos</button>
        `;
        return;
    }
    container.innerHTML = `
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Fonte</th>
                        <th>Ligação</th>
                        <th>Valor</th>
                        <th>Confiança</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
                    ${pendingImportedItems.map(item => `
                        <tr>
                            <td>${item.description}</td>
                            <td>${item.transaction?.source || item.sourceFile}</td>
                            <td>${item.target}</td>
                            <td>${formatCurrency(item.value)}</td>
                            <td><span class="badge ${item.confidence === 'alta' ? 'badge-success' : 'badge-warning'}">${item.confidence}</span></td>
                            <td><button class="btn btn-sm btn-primary" onclick="confirmImportedItem(${item.id})">Criar lançamento</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <button class="btn btn-primary" onclick="confirmAllImportedItems()" style="margin-top: 16px;">Criar Todos</button>
    `;
    container.querySelectorAll('tbody tr').forEach((row, index) => {
        const item = pendingImportedItems[index];
        if (item?.investmentSnapshot) {
            row.querySelector('td:last-child').innerHTML = `<button class="btn btn-sm btn-primary" onclick="confirmImportedItem(${item.id})">Atualizar investimento</button>`;
        } else if (item?.summaryOnly) {
            row.querySelector('td:last-child').innerHTML = '<span class="badge badge-primary">Resumo</span>';
        }
    });
}

function renderSmartImportPreviews() {
    renderImportPreview();
    renderAttachmentsList();
    if (app.currentView === 'transactions') {
        renderTransactions();
    }
}

function confirmImportedItem(id) {
    const item = pendingImportedItems.find(entry => entry.id === id);
    if (!item) return;
    if (item.investmentSnapshot) {
        upsertCofrinhoInvestmentFromImport(item);
        pendingImportedItems = pendingImportedItems.filter(entry => entry.id !== id);
        saveData();
        renderSmartImportPreviews();
        refreshFinancialViews();
        if (app.currentView === 'investments' && typeof renderInvestments === 'function') renderInvestments();
        showNotification('Cofrinho atualizado nos investimentos!');
        return;
    }
    if (item.summaryOnly) {
        showNotification('Resumo do anexo, sem lancamento para criar.', 'danger');
        return;
    }
    app.data.transactions.push(item.transaction);
    pendingImportedItems = pendingImportedItems.filter(entry => entry.id !== id);
    updateAccountBalances();
    saveData();
    renderSmartImportPreviews();
    refreshFinancialViews();
    if (app.currentView === 'investments' && typeof renderInvestments === 'function') renderInvestments();
    showNotification('Lançamento criado a partir do anexo!');
}

function confirmAllImportedItems() {
    pendingImportedItems
        .filter(item => item.investmentSnapshot)
        .forEach(item => upsertCofrinhoInvestmentFromImport(item));
    pendingImportedItems
        .filter(item => !item.summaryOnly && !item.investmentSnapshot)
        .forEach(item => app.data.transactions.push(item.transaction));
    pendingImportedItems = [];
    updateAccountBalances();
    saveData();
    renderSmartImportPreviews();
    refreshFinancialViews();
    showNotification('Todos os itens interpretados foram lançados!');
}

function renderAttachmentsList() {
    const container = document.getElementById('attachmentsList');
    if (!container) return;

    if (!app.data.attachments.length) {
        container.innerHTML = '<p class="muted-text">Nenhum anexo importado ainda.</p>';
        return;
    }

    container.innerHTML = app.data.attachments.slice().reverse().map(file => `
        <div class="finance-row">
            <div>
                <div class="finance-row-title">${file.fileName}</div>
                <div class="finance-row-meta">${file.rows} item(ns) · ${new Date(file.importedAt).toLocaleString('pt-BR')}</div>
            </div>
        </div>
    `).join('');
}
