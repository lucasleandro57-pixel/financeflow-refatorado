// ORÇAMENTO - CRUD

function openBudgetModal(id = null) {
            app.editingBudgetId = id;
            const form = document.getElementById('budgetForm');

            if (id) {
                const budget = app.data.budgets.find(b => b.id === id);
                document.getElementById('budgetCategory').value = budget.category;
                document.getElementById('budgetLimit').value = budget.limit;
            } else {
                form.reset();
            }

            updateBudgetCategories();
            openModal('budgetModal');
        }

        function updateBudgetCategories() {
            const select = document.getElementById('budgetCategory');
            select.innerHTML = '';
            app.data.categories.expense.forEach(cat => {
                select.innerHTML += `<option value="${cat}">${cat}</option>`;
            });
        }

        function saveBudget(e) {
            e.preventDefault();

            const budget = {
                id: app.editingBudgetId || generateId(),
                category: document.getElementById('budgetCategory').value,
                limit: parseFloat(document.getElementById('budgetLimit').value)
            };

            if (app.editingBudgetId) {
                const index = app.data.budgets.findIndex(b => b.id === app.editingBudgetId);
                app.data.budgets[index] = budget;
                showNotification('Orçamento atualizado com sucesso!');
            } else {
                app.data.budgets.push(budget);
                showNotification('Orçamento adicionado com sucesso!');
            }

            saveData();
            closeModal('budgetModal');
            renderBudgets();
        }

        function editBudget(id) {
            openBudgetModal(id);
        }
