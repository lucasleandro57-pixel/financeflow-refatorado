// PERSISTENCIA

function saveData() {
    localStorage.setItem('financeAppData', JSON.stringify(app.data));
}

function loadData() {
    const saved = localStorage.getItem('financeAppData');
    if (saved) {
        app.data = JSON.parse(saved);
        migrateData();
    } else {
        initializeMockData();
    }
}

function ensureCategories() {
    const defaults = {
        income: ['Salário', 'Freelance', 'Bônus', 'Investimentos', 'Receita Líquida', 'Nota Fiscal Emitida'],
        expense: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Educação', 'Utilidades', 'Impostos', 'Gasto Fixo', 'Cartão de Crédito'],
        investment: ['Ações', 'Criptomoedas', 'Imóvel', 'Renda Fixa', 'Fundos', 'Tesouro Direto']
    };

    defaults.income.push('Rendimento de Investimento', 'Resgate de Investimento');
    defaults.investment.push('Cofrinho PicPay');

    app.data.categories = app.data.categories || {};
    Object.keys(defaults).forEach(type => {
        app.data.categories[type] = app.data.categories[type] || [];
        defaults[type].forEach(category => {
            if (!app.data.categories[type].includes(category)) {
                app.data.categories[type].push(category);
            }
        });
    });
}

function migrateData() {
    ensureCategories();
    app.data.accounts = app.data.accounts || [];
    app.data.budgets = app.data.budgets || [];
    app.data.goals = app.data.goals || [];
    app.data.transactions = app.data.transactions || [];
    app.data.monthlyRecords = app.data.monthlyRecords || [];
    app.data.fixedExpenses = app.data.fixedExpenses || [];
    app.data.creditCards = app.data.creditCards || [];
    app.data.investments = app.data.investments || [];
    app.data.investments.forEach(item => {
        item.assetType = item.assetType || (isLikelyCryptoTicker(item.ticker) ? 'crypto' : 'stock');
        item.targetPrice = item.targetPrice || 0;
        item.quoteHistory = item.quoteHistory || [];
    });
    app.data.attachments = app.data.attachments || [];
    app.data.preferences = app.data.preferences || { currency: 'BRL', theme: 'dark' };
    app.data.preferences.brapiToken = app.data.preferences.brapiToken || '';
    app.data.preferences.openaiApiKey = app.data.preferences.openaiApiKey || '';
    app.data.preferences.openaiModel = app.data.preferences.openaiModel || 'gpt-4o-mini';
    app.data.aiTrainingExamples = app.data.aiTrainingExamples || [];
    saveData();
}

function isLikelyCryptoTicker(ticker) {
    return ['BTC', 'ETH', 'SOL', 'ADA', 'BNB', 'XRP', 'DOGE', 'USDT', 'USDC', 'LTC', 'LINK', 'MATIC', 'AVAX'].includes(String(ticker || '').toUpperCase());
}

function initializeMockData() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const month = String(currentMonth + 1).padStart(2, '0');
    const previousMonth = String(currentMonth).padStart(2, '0');

    ensureCategories();

    app.data.accounts = [
        { id: 1, name: 'Carteira', balance: 1500, initialBalance: 1500 },
        { id: 2, name: 'Conta Corrente', balance: 5200, initialBalance: 5000 },
        { id: 3, name: 'Conta Reserva', balance: 8500, initialBalance: 8000 },
        { id: 4, name: 'Investimento', balance: 12000, initialBalance: 10000 }
    ];

    app.data.transactions = [
        { id: 1, type: 'income', description: 'Receita líquida mensal', value: 6200, category: 'Receita Líquida', account: 2, date: `${currentYear}-${month}-01`, status: 'paid', note: 'Receita operacional liquida do mes' },
        { id: 2, type: 'income', description: 'Freelance - Projeto Web', value: 1200, category: 'Freelance', account: 1, date: `${currentYear}-${month}-05`, status: 'paid', note: 'Projeto concluido' },
        { id: 3, type: 'expense', description: 'Impostos pagos', value: 850, category: 'Impostos', account: 2, date: `${currentYear}-${month}-07`, status: 'paid', note: 'DAS/IR/tributos do mes' },
        { id: 4, type: 'expense', description: 'Aluguel', value: 1500, category: 'Moradia', account: 2, date: `${currentYear}-${month}-05`, status: 'paid', note: 'Gasto fixo mensal' },
        { id: 5, type: 'expense', description: 'Supermercado', value: 450, category: 'Alimentação', account: 1, date: `${currentYear}-${month}-03`, status: 'paid', note: 'Compras semanais' },
        { id: 6, type: 'expense', description: 'Internet', value: 120, category: 'Utilidades', account: 2, date: `${currentYear}-${month}-10`, status: 'paid', note: 'Mensalidade' },
        { id: 7, type: 'expense', description: 'Cartão de crédito', value: 680, category: 'Cartão de Crédito', account: 2, date: `${currentYear}-${month}-28`, status: 'pending', note: 'Fatura parcial' },
        { id: 8, type: 'investment', description: 'Compra de ações', value: 650, category: 'Ações', account: 4, date: `${currentYear}-${month}-15`, status: 'paid', note: 'PETR4.SA' },
        { id: 9, type: 'income', description: 'Receita líquida mensal', value: 5000, category: 'Receita Líquida', account: 2, date: `${currentYear}-${previousMonth}-01`, status: 'paid', note: 'Receita do mes anterior' },
        { id: 10, type: 'expense', description: 'Aluguel', value: 1500, category: 'Moradia', account: 2, date: `${currentYear}-${previousMonth}-05`, status: 'paid', note: 'Aluguel mensal' }
    ];

    app.data.budgets = [
        { id: 1, category: 'Alimentação', limit: 600 },
        { id: 2, category: 'Transporte', limit: 300 },
        { id: 3, category: 'Lazer', limit: 200 },
        { id: 4, category: 'Utilidades', limit: 400 }
    ];

    app.data.goals = [
        { id: 1, name: 'Fundo de Emergência', target: 15000, current: 8500, deadline: '2026-12-31' },
        { id: 2, name: 'Viagem para Europa', target: 20000, current: 5000, deadline: '2027-06-30' },
        { id: 3, name: 'Compra de Carro', target: 50000, current: 12000, deadline: '2027-12-31' }
    ];

    app.data.monthlyRecords = [
        { id: 1, month: `${currentYear}-${month}`, netIncome: 6200, taxesPaid: 850, notes: 'Receita liquida e impostos do mes atual' }
    ];

    app.data.fixedExpenses = [
        { id: 1, name: 'Aluguel', category: 'Moradia', amount: 1500, dueDay: 5, account: 2, active: true },
        { id: 2, name: 'Internet', category: 'Utilidades', amount: 120, dueDay: 10, account: 2, active: true }
    ];

    app.data.creditCards = [
        { id: 1, name: 'Cartao Principal', limit: 6000, closingDay: 20, dueDay: 28, currentBill: 980, paidAmount: 300 }
    ];

    app.data.investments = [
        {
            id: 1,
            ticker: 'PETR4.SA',
            assetType: 'stock',
            name: 'Petrobras PN',
            quantity: 20,
            averagePrice: 32.5,
            currentPrice: 34.1,
            targetPrice: 33,
            lastUpdated: new Date().toISOString(),
            source: 'manual',
            quoteHistory: [
                { date: new Date().toISOString(), price: 34.1 }
            ]
        }
    ];

    app.data.attachments = [];
    saveData();
}
