// CÁLCULOS FINANCEIROS

function getMonthTransactions(monthKey) {
            return app.data.transactions.filter(t => getTransactionMonthKey(t.date) === monthKey);
        }

        function calculateMetrics(monthKey) {
            const transactions = getMonthTransactions(monthKey);
            
            let income = 0, expense = 0, investment = 0;
            transactions.forEach(t => {
                if (t.status === 'paid') {
                    if (t.type === 'income') income += t.value;
                    else if (t.type === 'expense') expense += t.value;
                    else if (t.type === 'investment') investment += t.value;
                }
            });

            const netBalance = income - expense - investment;
            const savingsRate = income > 0 ? (netBalance / income) * 100 : 0;
            const expenseRatio = income > 0 ? (expense / income) * 100 : 0;

            return {
                income,
                expense,
                investment,
                netBalance,
                savingsRate,
                expenseRatio
            };
        }

        function calculatePatrimony() {
            let total = 0;
            app.data.accounts.forEach(account => {
                total += account.balance;
            });
            return total;
        }

function getComparison() {
            const current = calculateMetrics(getCurrentMonthKey());
            const previous = calculateMetrics(getPreviousMonthKey());

            return {
                incomeChange: current.income - previous.income,
                expenseChange: current.expense - previous.expense,
                balanceChange: current.netBalance - previous.netBalance
            };
        }

function getCurrentMonthlyRecord() {
    const monthKey = getCurrentMonthKey();
    return app.data.monthlyRecords.find(record => record.month === monthKey);
}

function normalizeFinanceText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[_-]+/g, ' ');
}

function getTransactionText(transaction) {
    return normalizeFinanceText([
        transaction.category,
        transaction.description,
        transaction.source,
        transaction.note
    ].join(' '));
}

function getTransactionValue(transaction) {
    return Number(transaction.value || 0);
}

function isPaidTransaction(transaction) {
    return !transaction.status || transaction.status === 'paid';
}

function isOpenTransaction(transaction) {
    return !['cancelled', 'canceled', 'deleted'].includes(String(transaction.status || '').toLowerCase());
}

function isImportedOrManualTransaction(transaction) {
    const text = getTransactionText(transaction);
    return text.includes('importado') ||
        text.includes('lancamento manual') ||
        text.includes('lan?amento manual') ||
        text.includes('manual rapido');
}

function hasFinanceTerm(text, terms) {
    return terms.some(term => text.includes(term));
}

function sumTransactions(transactions, predicate) {
    return transactions
        .filter(predicate)
        .reduce((sum, transaction) => sum + getTransactionValue(transaction), 0);
}

function calculateControlSummary() {
    const record = getCurrentMonthlyRecord();
    const monthTransactions = getMonthTransactions(getCurrentMonthKey());
    const configuredFixedTotal = app.data.fixedExpenses
        .filter(item => item.active)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const configuredCardTotal = app.data.creditCards
        .reduce((sum, card) => sum + Number(card.currentBill || 0), 0);

    const fixedTerms = ['gasto fixo', 'aluguel', 'internet', 'energia', 'luz', 'telefone', 'condominio', 'mensalidade', 'assinatura'];
    const cardTerms = ['cartao', 'cart?o', 'fatura', 'credito', 'cr?dito'];
    const taxTerms = ['imposto', 'tributo', 'das', 'irpj', 'csll', 'iss', 'inss', 'simples nacional'];

    const netIncomeFromTransactions = sumTransactions(monthTransactions, transaction =>
        transaction.type === 'income' && isPaidTransaction(transaction)
    );
    const taxesFromTransactions = sumTransactions(monthTransactions, transaction => {
        const text = getTransactionText(transaction);
        return transaction.type === 'expense' && isPaidTransaction(transaction) && hasFinanceTerm(text, taxTerms);
    });
    const fixedFromTransactions = sumTransactions(monthTransactions, transaction => {
        const text = getTransactionText(transaction);
        const isFixedCategory = normalizeFinanceText(transaction.category) === 'gasto fixo';
        return transaction.type === 'expense' &&
            isOpenTransaction(transaction) &&
            (isFixedCategory || (isImportedOrManualTransaction(transaction) && hasFinanceTerm(text, fixedTerms)));
    });
    const cardFromTransactions = sumTransactions(monthTransactions, transaction => {
        const text = getTransactionText(transaction);
        const cardCategory = normalizeFinanceText(transaction.category);
        const isCardCategory = cardCategory.includes('cartao') || cardCategory.includes('cart?o') || cardCategory.includes('credito') || cardCategory.includes('cr?dito');
        return transaction.type === 'expense' &&
            isOpenTransaction(transaction) &&
            (isCardCategory || (isImportedOrManualTransaction(transaction) && hasFinanceTerm(text, cardTerms)));
    });

    const netIncome = netIncomeFromTransactions || Number(record?.netIncome || 0);
    const taxesPaid = taxesFromTransactions || Number(record?.taxesPaid || 0);
    const fixedTotal = configuredFixedTotal + (fixedFromTransactions || 0);
    const cardTotal = configuredCardTotal
        ? configuredCardTotal + sumTransactions(monthTransactions, transaction => {
            const text = getTransactionText(transaction);
            return transaction.type === 'expense' &&
                isOpenTransaction(transaction) &&
                isImportedOrManualTransaction(transaction) &&
                hasFinanceTerm(text, cardTerms);
        })
        : cardFromTransactions;
    const committed = fixedTotal + cardTotal + taxesPaid;

    return {
        netIncome,
        taxesPaid,
        fixedTotal,
        cardTotal,
        committed,
        available: netIncome - committed
    };
}

function calculateInvestmentsSummary() {
    return app.data.investments.reduce((summary, item) => {
        const quantity = Number(item.quantity || 0);
        const invested = quantity * Number(item.averagePrice || 0);
        const current = quantity * Number(item.currentPrice || 0);

        summary.invested += invested;
        summary.current += current;
        return summary;
    }, { invested: 0, current: 0 });
}
