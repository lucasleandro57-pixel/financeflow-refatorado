// ESTADO GLOBAL

const app = {
    currentView: 'dashboard',
    currentMonth: new Date(),
    editingTransactionId: null,
    editingBudgetId: null,
    editingGoalId: null,
    editingAccountId: null,
    editingFixedExpenseId: null,
    editingCreditCardId: null,
    editingInvestmentId: null,
    selectedInvestmentId: null,
    quoteRefreshTimer: null,
    charts: {},
    data: {
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
        preferences: {
            currency: 'BRL',
            theme: 'dark',
            openaiApiKey: '',
            openaiModel: 'gpt-4o-mini'
        }
    }
};
