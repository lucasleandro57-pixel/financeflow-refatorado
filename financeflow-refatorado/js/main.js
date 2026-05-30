// EVENTOS

document.addEventListener('DOMContentLoaded', function() {
            loadData();

            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', function() {
                    switchView(this.dataset.view);
                });
            });

            document.getElementById('addTransactionBtn').addEventListener('click', () => openTransactionModal());
            document.getElementById('transactionForm').addEventListener('submit', saveTransaction);
            document.getElementById('transactionType').addEventListener('change', updateTransactionCategories);
            document.getElementById('quickTransactionForm').addEventListener('submit', saveQuickTransaction);
            document.getElementById('quickTransactionType').addEventListener('change', updateQuickTransactionCategories);
            document.getElementById('chooseTransactionFilesBtn').addEventListener('click', () => document.getElementById('transactionImportFile').click());
            document.getElementById('transactionImportFile').addEventListener('change', handleSmartImportFiles);
            document.getElementById('aiSettingsForm').addEventListener('submit', saveAISettings);
            document.getElementById('aiTrainingForm').addEventListener('submit', saveAITrainingExample);
            setupTransactionDropzone();
            renderAISettings();

            document.getElementById('addBudgetBtn').addEventListener('click', () => openBudgetModal());
            document.getElementById('budgetForm').addEventListener('submit', saveBudget);

            document.getElementById('addGoalBtn').addEventListener('click', () => openGoalModal());
            document.getElementById('goalForm').addEventListener('submit', saveGoal);

            document.getElementById('addAccountBtn').addEventListener('click', () => openAccountModal());
            document.getElementById('accountForm').addEventListener('submit', saveAccount);

            document.getElementById('monthlyRecordForm').addEventListener('submit', saveMonthlyRecord);
            document.getElementById('monthlyRecordMonth').addEventListener('change', fillMonthlyRecordForm);
            document.getElementById('addFixedExpenseBtn').addEventListener('click', () => openFixedExpenseModal());
            document.getElementById('fixedExpenseForm').addEventListener('submit', saveFixedExpense);
            document.getElementById('addCreditCardBtn').addEventListener('click', () => openCreditCardModal());
            document.getElementById('creditCardForm').addEventListener('submit', saveCreditCard);

            document.getElementById('addInvestmentBtn').addEventListener('click', () => openInvestmentModal());
            document.getElementById('investmentForm').addEventListener('submit', saveInvestment);
            document.getElementById('investmentAssetType').addEventListener('change', updateInvestmentFormLabels);
            document.getElementById('refreshQuotesBtn').addEventListener('click', refreshInvestmentQuotes);
            document.getElementById('quoteSettingsForm').addEventListener('submit', saveQuoteSettings);

            document.getElementById('chooseImportFilesBtn').addEventListener('click', () => document.getElementById('smartImportFile').click());
            document.getElementById('smartImportFile').addEventListener('change', handleSmartImportFiles);
            setupImportDropzone();
            updateQuickTransactionCategories();
            document.getElementById('quickTransactionDate').value = new Date().toISOString().split('T')[0];

            document.getElementById('filterPeriod').addEventListener('change', renderTransactions);
            document.getElementById('filterType').addEventListener('change', () => {
                updateCategoryFilter();
                renderTransactions();
            });
            document.getElementById('filterCategory').addEventListener('change', renderTransactions);
            document.getElementById('filterStatus').addEventListener('change', renderTransactions);
            document.getElementById('searchInput').addEventListener('input', renderTransactions);

            document.getElementById('exportJsonBtn').addEventListener('click', exportJSON);
            document.getElementById('importJsonBtn').addEventListener('click', importJSON);
            document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
            document.getElementById('clearDataBtn').addEventListener('click', clearData);

            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', function(e) {
                    if (e.target === this) {
                        this.classList.remove('active');
                    }
                });
            });

            switchView('dashboard');
        });
