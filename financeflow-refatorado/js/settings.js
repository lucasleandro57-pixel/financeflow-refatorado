// IMPORTACAO E EXPORTACAO

function exportJSON() {
    const dataStr = JSON.stringify(app.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financeflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showNotification('Dados exportados com sucesso!');
}

function importJSON() {
    document.getElementById('importFile').click();
}

document.getElementById('importFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const imported = JSON.parse(event.target.result);
            app.data = imported;
            migrateData();
            showNotification('Dados importados com sucesso!');
            switchView('dashboard');
        } catch (error) {
            showNotification('Erro ao importar arquivo!', 'danger');
        }
    };
    reader.readAsText(file);
});

function exportCSV() {
    const transactions = app.data.transactions;
    let csv = 'Data,Descricao,Tipo,Categoria,Conta,Valor,Status,Observacao\n';

    transactions.forEach(t => {
        const account = app.data.accounts.find(a => a.id === t.account);
        csv += `"${t.date}","${t.description}","${t.type}","${t.category}","${account?.name || 'N/A'}","${t.value}","${t.status}","${t.note}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financeflow-transacoes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showNotification('Transações exportadas em CSV!');
}

function clearData() {
    if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita!')) {
        localStorage.removeItem('financeAppData');
        app.data = {
            transactions: [],
            categories: {
                income: ['Salário', 'Freelance', 'Bônus', 'Investimentos', 'Receita Líquida', 'Nota Fiscal Emitida'],
                expense: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Educação', 'Utilidades', 'Impostos', 'Gasto Fixo', 'Cartão de Crédito'],
                investment: ['Ações', 'Criptomoedas', 'Imóvel', 'Renda Fixa', 'Fundos', 'Tesouro Direto']
            },
            accounts: [],
            budgets: [],
            goals: [],
            monthlyRecords: [],
            fixedExpenses: [],
            creditCards: [],
            investments: [],
            attachments: [],
            aiTrainingExamples: [],
            preferences: { currency: 'BRL', theme: 'dark', openaiApiKey: '', openaiModel: 'gpt-4o-mini', brapiToken: '' }
        };
        ensureCategories();
        saveData();
        showNotification('Todos os dados foram limpos!');
        switchView('dashboard');
    }
}
