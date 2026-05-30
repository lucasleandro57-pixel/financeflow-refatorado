// INVESTIMENTOS E COTACOES

function renderInvestments() {
    renderQuoteSettings();
    renderInvestmentMetrics();
    renderInvestmentsList();
    renderInvestmentsChart();
}

function renderQuoteSettings() {
    const input = document.getElementById('brapiTokenInput');
    const status = document.getElementById('quoteStatusText');
    if (!input || !status) return;

    input.value = app.data.preferences.brapiToken || '';
    status.textContent = app.data.preferences.brapiToken
        ? 'Token salvo. A atualização automática pode consultar ações, FIIs e criptomoedas.'
        : 'Sem token: a brapi só libera algumas ações de teste. Criptomoedas e a maioria dos ativos precisam de token.';
}

function saveQuoteSettings(e) {
    e.preventDefault();
    app.data.preferences.brapiToken = document.getElementById('brapiTokenInput').value.trim();
    saveData();
    renderQuoteSettings();
    refreshInvestmentQuotes({ silent: false });
    showNotification('Token de cotação salvo!');
}

function getInvestmentNumbers(item) {
    const quantity = Number(item.quantity || 0);
    const invested = quantity * Number(item.averagePrice || 0);
    const current = quantity * Number(item.currentPrice || 0);
    const result = current - invested;
    const resultPercent = invested > 0 ? (result / invested) * 100 : 0;
    const targetPrice = Number(item.targetPrice || 0);

    return { quantity, invested, current, result, resultPercent, targetPrice };
}

function getInvestmentSignal(item) {
    const numbers = getInvestmentNumbers(item);

    if (!numbers.targetPrice) {
        return {
            label: numbers.result >= 0 ? 'Lucro' : 'Perda',
            className: numbers.result >= 0 ? 'positive' : 'negative',
            detail: 'Sem preço de decisão'
        };
    }

    if (Number(item.currentPrice || 0) <= numbers.targetPrice) {
        return {
            label: 'Compra',
            className: 'positive',
            detail: `Cotação abaixo de ${formatCurrency(numbers.targetPrice)}`
        };
    }

    return {
        label: numbers.result >= 0 ? 'Venda' : 'Aguardar',
        className: numbers.result >= 0 ? 'warning' : 'negative',
        detail: `Cotação acima de ${formatCurrency(numbers.targetPrice)}`
    };
}

function getInvestmentAssetLabel(item) {
    if (item.assetType === 'crypto') return 'Cripto';
    if (item.assetType === 'fixedIncome') return 'Renda fixa';
    return 'Acao';
}

function getInvestmentQuantityLabel(item) {
    if (item.assetType === 'crypto') return 'moedas';
    if (item.assetType === 'fixedIncome') return 'posicao';
    return 'acoes';
}

function renderInvestmentMetrics() {
    const summary = calculateInvestmentsSummary();
    const result = summary.current - summary.invested;
    const resultPercent = summary.invested > 0 ? (result / summary.invested) * 100 : 0;
    const winners = app.data.investments.filter(item => getInvestmentNumbers(item).result >= 0).length;
    const losers = app.data.investments.filter(item => getInvestmentNumbers(item).result < 0).length;

    document.getElementById('investmentMetrics').innerHTML = `
        <div class="metric-card dashboard-value-card primary">
            <div class="metric-label">Total Investido</div>
            <div class="metric-value">${formatCurrency(summary.invested)}</div>
        </div>
        <div class="metric-card dashboard-value-card primary">
            <div class="metric-label">Valor Atual</div>
            <div class="metric-value">${formatCurrency(summary.current)}</div>
        </div>
        <div class="metric-card dashboard-value-card ${result >= 0 ? 'positive' : 'negative'}">
            <div class="metric-label">Resultado</div>
            <div class="metric-value">${formatCurrency(result)}</div>
            <div class="metric-change ${result >= 0 ? 'positive' : 'negative'}">${resultPercent.toFixed(2)}%</div>
        </div>
        <div class="metric-card dashboard-value-card ${winners >= losers ? 'positive' : 'negative'}">
            <div class="metric-label">Ativos em Lucro</div>
            <div class="metric-value">${winners}/${app.data.investments.length}</div>
        </div>
    `;
}

function renderInvestmentsList() {
    const list = document.getElementById('investmentsList');
    if (!app.data.investments.length) {
        list.innerHTML = '<p class="muted-text">Nenhum ativo cadastrado.</p>';
        return;
    }

    list.innerHTML = app.data.investments.map(item => {
        const numbers = getInvestmentNumbers(item);
        const signal = getInvestmentSignal(item);
        const selected = app.selectedInvestmentId === item.id ? ' selected' : '';

        return `
            <div class="metric-card investment-summary-card dashboard-value-card ${signal.className}${selected}" onclick="selectInvestment(${item.id})">
                <div class="metric-label">${getInvestmentAssetLabel(item)} · ${item.ticker}</div>
                <div class="metric-value">${formatCurrency(numbers.current)}</div>
                <div class="metric-change ${numbers.result >= 0 ? 'positive' : 'negative'}">${formatCurrency(numbers.result)} (${numbers.resultPercent.toFixed(2)}%)</div>
                ${app.selectedInvestmentId === item.id ? renderExpandedInvestment(item) : ''}
            </div>
        `;
    }).join('');

    renderExpandedInvestmentCharts();
}

function renderExpandedInvestment(item) {
    const numbers = getInvestmentNumbers(item);
    const signal = getInvestmentSignal(item);
    const updated = item.lastUpdated ? new Date(item.lastUpdated).toLocaleString('pt-BR') : 'manual';

    return `
        <div class="investment-expanded" onclick="event.stopPropagation()">
            <div class="investment-detail-header">
                <div>
                    <div class="investment-detail-ticker">${item.ticker} · ${item.name}</div>
                    <div class="finance-row-meta">${numbers.quantity} ${getInvestmentQuantityLabel(item)} · PM ${formatCurrency(item.averagePrice)} · cotação ${formatCurrency(item.currentPrice)}</div>
                    <div class="finance-row-meta">Atualizado ${updated} · ${item.source || 'manual'}</div>
                </div>
                <span class="badge investment-signal ${signal.className}">${signal.label}</span>
            </div>
            <div class="investment-detail-grid">
                <div>
                    <div class="metric-label">Cotação Atual</div>
                    <div class="metric-value">${formatCurrency(item.currentPrice)}</div>
                </div>
                <div>
                    <div class="metric-label">Preço Médio</div>
                    <div class="metric-value">${formatCurrency(item.averagePrice)}</div>
                </div>
                <div>
                    <div class="metric-label">Preço de Decisão</div>
                    <div class="metric-value">${numbers.targetPrice ? formatCurrency(numbers.targetPrice) : '-'}</div>
                </div>
                <div>
                    <div class="metric-label">Lucro/Perda</div>
                    <div class="metric-value ${numbers.result >= 0 ? 'positive-text' : 'negative-text'}">${formatCurrency(numbers.result)}</div>
                </div>
            </div>
            <div class="investment-advice ${signal.className}">${signal.detail}</div>
            <div class="investment-line-chart">
                <canvas id="investmentLineChart-${item.id}"></canvas>
            </div>
            <div class="investment-detail-actions">
                <button class="btn btn-sm btn-secondary" onclick="openInvestmentModal(${item.id})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="deleteInvestment(${item.id})">Excluir</button>
            </div>
        </div>
    `;
}

function renderInvestmentsChart() {
    const ctx = document.getElementById('investmentsChart');
    if (!ctx) return;

    if (app.charts.investments) {
        app.charts.investments.destroy();
    }

    app.charts.investments = new Chart(ctx, {
        type: 'line',
        data: {
            labels: app.data.investments.map(item => item.ticker),
            datasets: [
                {
                    label: 'Investido',
                    data: app.data.investments.map(item => getInvestmentNumbers(item).invested),
                    borderColor: '#9d4edd',
                    backgroundColor: 'rgba(157, 78, 221, 0.12)',
                    borderWidth: 3,
                    tension: 0.35,
                    fill: true,
                    pointRadius: 5
                },
                {
                    label: 'Atual',
                    data: app.data.investments.map(item => getInvestmentNumbers(item).current),
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.08)',
                    borderWidth: 3,
                    tension: 0.35,
                    fill: true,
                    pointRadius: 5
                }
            ]
        },
        options: getChartOptions()
    });
}

function renderSelectedInvestmentDetails() {
    const container = document.getElementById('selectedInvestmentDetails');
    const item = app.data.investments.find(investment => investment.id === app.selectedInvestmentId);

    if (!item) {
        container.closest('.card').style.display = 'none';
        return;
    }

    container.closest('.card').style.display = 'block';
    const numbers = getInvestmentNumbers(item);
    const signal = getInvestmentSignal(item);
    const updated = item.lastUpdated ? new Date(item.lastUpdated).toLocaleString('pt-BR') : 'manual';

    container.innerHTML = `
        <div class="investment-detail-header">
            <div>
                <div class="investment-detail-ticker">${item.ticker} · ${item.name}</div>
                <div class="finance-row-meta">${numbers.quantity} ${getInvestmentQuantityLabel(item)} · PM ${formatCurrency(item.averagePrice)} · cotação ${formatCurrency(item.currentPrice)}</div>
                <div class="finance-row-meta">Atualizado ${updated} · ${item.source || 'manual'}</div>
            </div>
            <span class="badge investment-signal ${signal.className}">${signal.label}</span>
        </div>
        <div class="investment-detail-grid">
            <div>
                <div class="metric-label">Cotação Atual</div>
                <div class="metric-value">${formatCurrency(item.currentPrice)}</div>
            </div>
            <div>
                <div class="metric-label">Preço Médio</div>
                <div class="metric-value">${formatCurrency(item.averagePrice)}</div>
            </div>
            <div>
                <div class="metric-label">Preço de Decisão</div>
                <div class="metric-value">${numbers.targetPrice ? formatCurrency(numbers.targetPrice) : '-'}</div>
            </div>
            <div>
                <div class="metric-label">Lucro/Perda</div>
                <div class="metric-value ${numbers.result >= 0 ? 'positive-text' : 'negative-text'}">${formatCurrency(numbers.result)}</div>
            </div>
        </div>
        <div class="investment-advice ${signal.className}">
            ${signal.detail}
        </div>
        <div class="investment-detail-actions">
            <button class="btn btn-sm btn-secondary" onclick="openInvestmentModal(${item.id})">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="deleteInvestment(${item.id})">Excluir</button>
        </div>
    `;
}

function renderSingleInvestmentChart() {
    const ctx = document.getElementById('singleInvestmentChart');
    if (!ctx) return;

    const item = app.data.investments.find(investment => investment.id === app.selectedInvestmentId);

    if (app.charts.singleInvestment) {
        app.charts.singleInvestment.destroy();
    }

    const card = ctx.closest('.card');
    if (!item) {
        if (card) card.style.display = 'none';
        return;
    }
    if (card) card.style.display = 'block';

    const history = (item.quoteHistory || []).slice(-20);
    const labels = history.length ? history.map(point => new Date(point.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })) : ['Atual'];
    const prices = history.length ? history.map(point => Number(point.price || 0)) : [Number(item.currentPrice || 0)];

    app.charts.singleInvestment = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Cotação',
                    data: prices,
                    borderColor: getInvestmentNumbers(item).result >= 0 ? '#00ff88' : '#ff006e',
                    backgroundColor: 'rgba(157, 78, 221, 0.12)',
                    borderWidth: 3,
                    tension: 0.35,
                    fill: true,
                    pointRadius: 4
                },
                {
                    label: 'Preço médio',
                    data: prices.map(() => Number(item.averagePrice || 0)),
                    borderColor: '#9d4edd',
                    borderWidth: 2,
                    borderDash: [6, 6],
                    pointRadius: 0
                }
            ]
        },
        options: getChartOptions()
    });
}

function renderExpandedInvestmentCharts() {
    app.data.investments.forEach(item => {
        if (app.selectedInvestmentId !== item.id) return;

        const ctx = document.getElementById(`investmentLineChart-${item.id}`);
        if (!ctx) return;

        const chartKey = `expandedInvestment-${item.id}`;
        if (app.charts[chartKey]) {
            app.charts[chartKey].destroy();
        }

        const history = (item.quoteHistory || []).slice(-20);
        const labels = history.length ? history.map(point => new Date(point.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })) : ['Atual'];
        const prices = history.length ? history.map(point => Number(point.price || 0)) : [Number(item.currentPrice || 0)];

        app.charts[chartKey] = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Cotação',
                        data: prices,
                        borderColor: getInvestmentNumbers(item).result >= 0 ? '#00ff88' : '#ff006e',
                        backgroundColor: 'rgba(157, 78, 221, 0.12)',
                        borderWidth: 3,
                        tension: 0.35,
                        fill: true,
                        pointRadius: 4
                    },
                    {
                        label: 'Preço médio',
                        data: prices.map(() => Number(item.averagePrice || 0)),
                        borderColor: '#9d4edd',
                        borderWidth: 2,
                        borderDash: [6, 6],
                        pointRadius: 0
                    }
                ]
            },
            options: getChartOptions()
        });
    });
}

function getChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#b0b0b0', font: { size: 12, weight: '600' } }
            }
        },
        scales: {
            x: { ticks: { color: '#808080' }, grid: { display: false } },
            y: { ticks: { color: '#808080' }, grid: { color: 'rgba(157, 78, 221, 0.05)' } }
        }
    };
}

function selectInvestment(id) {
    app.selectedInvestmentId = id;
    renderInvestments();
}

function openInvestmentModal(id = null) {
    app.editingInvestmentId = id;
    const item = app.data.investments.find(investment => investment.id === id);
    document.getElementById('investmentModalTitle').textContent = id ? 'Editar Ativo' : 'Novo Ativo';
    document.getElementById('investmentForm').reset();

    if (item) {
        document.getElementById('investmentAssetType').value = item.assetType || 'stock';
        document.getElementById('investmentTicker').value = item.ticker;
        document.getElementById('investmentName').value = item.name;
        document.getElementById('investmentQuantity').value = item.quantity;
        document.getElementById('investmentAveragePrice').value = item.averagePrice;
        document.getElementById('investmentTargetPrice').value = item.targetPrice || '';
    }

    updateInvestmentFormLabels();
    openModal('investmentModal');
}

function updateInvestmentFormLabels() {
    const isCrypto = document.getElementById('investmentAssetType').value === 'crypto';

    document.getElementById('investmentTickerLabel').textContent = isCrypto ? 'Moeda' : 'Ticker';
    document.getElementById('investmentNameLabel').textContent = isCrypto ? 'Nome da criptomoeda' : 'Nome';
    document.getElementById('investmentQuantityLabel').textContent = isCrypto ? 'Quantidade comprada' : 'Quantidade de ações';
    document.getElementById('investmentAveragePriceLabel').textContent = isCrypto ? 'Valor que paguei por moeda' : 'Preço médio';
    document.getElementById('investmentTargetPriceLabel').textContent = isCrypto ? 'Preço para comprar/vender' : 'Preço de decisão';

    document.getElementById('investmentTicker').placeholder = isCrypto ? 'Ex: BTC, ETH, SOL' : 'Ex: PETR4, ITUB4, MXRF11';
    document.getElementById('investmentName').placeholder = isCrypto ? 'Ex: Bitcoin, Ethereum' : 'Ex: Petrobras PN';
    document.getElementById('investmentQuantity').placeholder = isCrypto ? 'Ex: 0.025' : 'Ex: 100';
    document.getElementById('investmentAveragePrice').placeholder = isCrypto ? 'Ex: 345.292,90' : 'Ex: 32,50';
}

function saveInvestment(e) {
    e.preventDefault();
    const existing = app.data.investments.find(investment => investment.id === app.editingInvestmentId);
    const averagePrice = parseLocalizedNumber(document.getElementById('investmentAveragePrice').value);
    const targetPrice = parseLocalizedNumber(document.getElementById('investmentTargetPrice').value);
    const currentPrice = existing?.currentPrice || averagePrice;
    const item = {
        id: app.editingInvestmentId || generateId(),
        assetType: document.getElementById('investmentAssetType').value,
        ticker: document.getElementById('investmentTicker').value.trim().toUpperCase(),
        name: document.getElementById('investmentName').value,
        quantity: parseFloat(document.getElementById('investmentQuantity').value) || 0,
        averagePrice,
        currentPrice,
        targetPrice,
        lastUpdated: new Date().toISOString(),
        source: existing?.source || 'manual',
        quoteHistory: existing?.quoteHistory || []
    };

    if (app.editingInvestmentId) {
        const index = app.data.investments.findIndex(investment => investment.id === app.editingInvestmentId);
        app.data.investments[index] = item;
    } else {
        app.data.investments.push(item);
        app.selectedInvestmentId = item.id;
    }

    saveData();
    closeModal('investmentModal');
    renderInvestments();
    renderDashboard();
    refreshInvestmentQuotes({ silent: true });
    showNotification('Ativo salvo!');
}

function parseLocalizedNumber(value) {
    const text = String(value || '').trim();
    if (!text) return 0;

    const normalized = text
        .replace(/[^\d,.-]/g, '')
        .replace(/\.(?=\d{3}(?:\D|$))/g, '')
        .replace(',', '.');

    return parseFloat(normalized) || 0;
}

function deleteInvestment(id) {
    if (!confirm('Excluir este ativo?')) return;
    app.data.investments = app.data.investments.filter(item => item.id !== id);
    if (app.selectedInvestmentId === id) {
        app.selectedInvestmentId = app.data.investments[0]?.id || null;
    }
    saveData();
    renderInvestments();
}

function addQuoteHistoryPoint(item, price) {
    item.quoteHistory = item.quoteHistory || [];
    if (!price) return;

    item.quoteHistory.push({
        date: new Date().toISOString(),
        price: Number(price)
    });
    item.quoteHistory = item.quoteHistory.slice(-60);
}

async function refreshInvestmentQuotes(options = {}) {
    if (!app.data.investments.length) return;

    try {
        const quotes = await fetchInvestmentQuotes(app.data.investments);
        let updated = 0;

        app.data.investments.forEach(item => {
            const quote = quotes[item.ticker] || quotes[normalizeBrapiTicker(item.ticker)] || quotes[normalizeCryptoTicker(item.ticker)];
            if (!quote?.price) return;

            item.currentPrice = Number(quote.price);
            item.name = item.name || quote.name || item.ticker;
            item.lastUpdated = new Date().toISOString();
            item.source = quote.source;
            addQuoteHistoryPoint(item, item.currentPrice);
            updated += 1;
        });

        saveData();
        renderInvestments();
        renderDashboard();
        if (!options.silent) {
            showNotification(updated ? `${updated} cotação(ões) atualizada(s)!` : 'Nenhuma cotação foi atualizada. Configure o token da brapi para esses ativos.', updated ? 'success' : 'danger');
        }
    } catch (error) {
        if (!options.silent) {
            showNotification('Não foi possível atualizar automaticamente. Verifique o token da brapi ou edite manualmente.', 'danger');
        }
    }
}

async function fetchInvestmentQuotes(investments) {
    const quotes = {};
    const token = app.data.preferences.brapiToken || '';
    const stockTickers = investments
        .filter(item => (item.assetType || 'stock') === 'stock' && isBrazilianTicker(item.ticker))
        .map(item => normalizeBrapiTicker(item.ticker));
    const cryptoTickers = investments
        .filter(item => item.assetType === 'crypto')
        .map(item => normalizeCryptoTicker(item.ticker));

    if (stockTickers.length) {
        try {
            const response = await fetch(`https://brapi.dev/api/quote/${stockTickers.map(encodeURIComponent).join(',')}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (response.ok) {
                const payload = await response.json();
                (payload.results || []).forEach(quote => {
                    quotes[quote.symbol] = {
                        price: quote.regularMarketPrice,
                        name: quote.longName || quote.shortName,
                        source: 'brapi'
                    };
                    quotes[`${quote.symbol}.SA`] = quotes[quote.symbol];
                });
            }
        } catch (error) {
            return quotes;
        }
    }

    if (cryptoTickers.length && token) {
        try {
            const response = await fetch(`https://brapi.dev/api/v2/crypto?coin=${cryptoTickers.map(encodeURIComponent).join(',')}&currency=BRL`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const payload = await response.json();
                (payload.coins || []).forEach(coin => {
                    quotes[coin.coin] = {
                        price: coin.regularMarketPrice,
                        name: coin.coinName || coin.coin,
                        source: 'brapi crypto'
                    };
                });
            }
        } catch (error) {
            return quotes;
        }
    }

    const missingCryptoTickers = cryptoTickers.filter(ticker => !quotes[ticker]);
    if (missingCryptoTickers.length) {
        try {
            const geckoIds = missingCryptoTickers
                .map(ticker => ({ ticker, id: getCoinGeckoId(ticker) }))
                .filter(item => item.id);

            if (geckoIds.length) {
                const ids = geckoIds.map(item => item.id).join(',');
                const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=brl`);
                if (response.ok) {
                    const payload = await response.json();
                    geckoIds.forEach(item => {
                        if (payload[item.id]?.brl) {
                            quotes[item.ticker] = {
                                price: payload[item.id].brl,
                                name: item.ticker,
                                source: 'CoinGecko'
                            };
                        }
                    });
                }
            }
        } catch (error) {
            return quotes;
        }
    }

    return quotes;
}

function isBrazilianTicker(ticker) {
    return /^[A-Z]{4}\d{1,2}(\.SA)?$/.test(normalizeBrapiTicker(ticker));
}

function normalizeBrapiTicker(ticker) {
    const value = String(ticker || '').toUpperCase().replace('.SA', '');
    const aliases = {
        ITAUSA4: 'ITSA4',
        ITAUSA: 'ITSA4'
    };
    return aliases[value] || value;
}

function normalizeCryptoTicker(ticker) {
    return String(ticker || '').toUpperCase().replace('-BRL', '').replace('-USD', '');
}

function getCoinGeckoId(ticker) {
    const ids = {
        BTC: 'bitcoin',
        ETH: 'ethereum',
        SOL: 'solana',
        ADA: 'cardano',
        BNB: 'binancecoin',
        XRP: 'ripple',
        DOGE: 'dogecoin',
        USDT: 'tether',
        USDC: 'usd-coin',
        LTC: 'litecoin',
        LINK: 'chainlink',
        MATIC: 'matic-network',
        AVAX: 'avalanche-2',
        DOT: 'polkadot',
        TRX: 'tron',
        SHIB: 'shiba-inu'
    };

    return ids[normalizeCryptoTicker(ticker)] || null;
}

function startQuoteAutoRefresh() {
    stopQuoteAutoRefresh();
    refreshInvestmentQuotes({ silent: true });
    app.quoteRefreshTimer = setInterval(() => {
        if (app.currentView === 'investments') {
            refreshInvestmentQuotes({ silent: true });
        }
    }, 60000);
}

function stopQuoteAutoRefresh() {
    if (app.quoteRefreshTimer) {
        clearInterval(app.quoteRefreshTimer);
        app.quoteRefreshTimer = null;
    }
}
