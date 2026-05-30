// METAS - CRUD

function openGoalModal(id = null) {
            app.editingGoalId = id;
            const form = document.getElementById('goalForm');

            if (id) {
                const goal = app.data.goals.find(g => g.id === id);
                document.getElementById('goalName').value = goal.name;
                document.getElementById('goalTarget').value = goal.target;
                document.getElementById('goalCurrent').value = goal.current;
                document.getElementById('goalDeadline').value = goal.deadline || '';
            } else {
                form.reset();
            }

            openModal('goalModal');
        }

        function saveGoal(e) {
            e.preventDefault();

            const goal = {
                id: app.editingGoalId || generateId(),
                name: document.getElementById('goalName').value,
                target: parseFloat(document.getElementById('goalTarget').value),
                current: parseFloat(document.getElementById('goalCurrent').value),
                deadline: document.getElementById('goalDeadline').value || null
            };

            if (app.editingGoalId) {
                const index = app.data.goals.findIndex(g => g.id === app.editingGoalId);
                app.data.goals[index] = goal;
                showNotification('Meta atualizada com sucesso!');
            } else {
                app.data.goals.push(goal);
                showNotification('Meta adicionada com sucesso!');
            }

            saveData();
            closeModal('goalModal');
            renderGoals();
        }

        function editGoal(id) {
            openGoalModal(id);
        }
