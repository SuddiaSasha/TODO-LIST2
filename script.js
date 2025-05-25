const list = document.getElementById('todo-list');
const itemCountSpan = document.getElementById('item-count');
const uncheckedCountSpan = document.getElementById('unchecked-count');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessageDiv = document.getElementById('error-message');
const errorTextSpan = document.getElementById('error-text');

// Правильно визначений базовий URL для Firebase. БЕЗ .json в кінці!
const FIREBASE_BASE_URL = 'https://todolist-c53dd-default-rtdb.europe-west1.firebasedatabase.app/todos';
const FIREBASE_FULL_URL = `${FIREBASE_BASE_URL}.json`; // Для POST та GET всіх todos

let todos = []; // Масив для зберігання справ, завантажених з Firebase
// nextId вже не такий критичний, бо Firebase генерує ID, але можна залишити для ініціалізації
let nextId = 1;

// --- Функції для управління UI статусами ---
function showLoading() {
    loadingIndicator.style.display = 'block';
    hideError(); // Ховаємо помилку, якщо завантаження почалося
}

function hideLoading() {
    loadingIndicator.style.display = 'none';
}

function showError(message) {
    errorTextSpan.textContent = message;
    errorMessageDiv.style.display = 'block';
    hideLoading(); // Ховаємо індикатор завантаження, якщо сталася помилка
}

function hideError() {
    errorMessageDiv.style.display = 'none';
    errorTextSpan.textContent = '';
}
// --- Кінець функцій для управління UI статусами ---


/**
 * Завантажує справи з Firebase Realtime Database.
 */
async function loadTodosFromFirebase() {
    showLoading(); // Показуємо індикатор завантаження
    try {
        const response = await fetch(FIREBASE_FULL_URL); // Використовуємо повний URL з .json
        if (!response.ok) {
            throw new Error(`Помилка HTTP: ${response.status}`);
        }
        const data = await response.json();

        todos = []; // Очищаємо масив перед заповненням
        if (data) { // Перевіряємо, чи є дані
            // Перетворюємо об'єкт з Firebase на масив
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    todos.push({
                        id: key, // ID - це ключ, згенерований Firebase
                        text: data[key].text,
                        checked: data[key].checked
                    });
                }
            }
        }
        console.log('Дані завантажено з Firebase:', todos);
        render(); // Відображаємо завантажені справи
        hideError(); // Ховаємо помилку, якщо завантаження успішне
    } catch (error) {
        console.error('Помилка при завантаженні справ з Firebase:', error);
        showError(`Не вдалося завантажити завдання: ${error.message}`); // Показуємо помилку
    } finally {
        hideLoading(); // Завжди ховаємо індикатор завантаження, незалежно від результату
    }
}


async function newTodo() {
    hideError(); // Скидаємо попередні помилки перед новою операцією
    const todoText = prompt('Введіть нове завдання:');

    if (todoText !== null && todoText.trim() !== '') {
        const newTodoItemForFirebase = {
            text: todoText.trim(),
            checked: false
        };
        showLoading(); // Показуємо індикатор завантаження
        try {
            const response = await fetch(FIREBASE_FULL_URL, { // Використовуємо повний URL з .json
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTodoItemForFirebase)
            });

            if (!response.ok) {
                throw new Error(`Помилка HTTP: ${response.status}`);
            }

            const data = await response.json();
            const firebaseId = data.name; // ID, згенерований Firebase

            const newTodoItem = {
                id: firebaseId,
                text: todoText.trim(),
                checked: false
            };
            todos.push(newTodoItem); // Додаємо до локального масиву

            console.log('Справу додано до Firebase:', newTodoItem);
            render(); // Оновлюємо UI
            hideError();
        } catch (error) {
            console.error('Помилка при додаванні справи до Firebase:', error);
            showError(`Не вдалося додати завдання: ${error.message}`);
        } finally {
            hideLoading();
        }
    } else {
        alert('Завдання не було додано. Будь ласка, введіть дійсний опис.');
    }
}


/**
 * Генерує HTML-рядок для одного елемента списку справ (<li>).
 * @param {object} todo - Об'єкт справи, що містить id, text та checked.
 * @returns {string} HTML-рядок для елемента <li>.
 */
function renderTodo(todo) {
    const textClasses = todo.checked
        ? 'text-success text-decoration-line-through'
        : '';

    const isChecked = todo.checked ? 'checked' : '';

    return `
        <li class="list-group-item">
            <input type="checkbox" class="form-check-input me-2" id="${todo.id}" ${isChecked} onchange="checkTodo('${todo.id}')" />
            <label for="${todo.id}"><span class="${textClasses}">${todo.text}</span></label>
            <button class="btn btn-danger btn-sm float-end" onclick="deleteTodo('${todo.id}')">delete</button>
        </li>
    `;
}


/**
 * Видаляє справу з масиву todos (локально) та з Firebase за її ID.
 * @param {string} id - Унікальний ідентифікатор справи, яку потрібно видалити (ID від Firebase).
 */
async function deleteTodo(id) {
    hideError();
    showLoading();
    try {
        // URL для видалення конкретного елемента
        const deleteUrl = `${FIREBASE_BASE_URL}/${id}.json`;

        const response = await fetch(deleteUrl, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Помилка HTTP: ${response.status}`);
        }

        console.log(`Видалено справу з ID: ${id} з Firebase.`);
        // Оновлюємо локальний масив
        todos = todos.filter(todo => todo.id !== id);
        render(); // Оновлюємо відображення
        hideError();
    } catch (error) {
        console.error('Помилка при видаленні справи з Firebase:', error);
        showError(`Не вдалося видалити завдання: ${error.message}`);
    } finally {
        hideLoading();
    }
}


/**
 * Перемикає статус 'checked' для справи за її ID (локально) та оновлює в Firebase.
 * @param {string} id - Унікальний ідентифікатор справи, статус якої потрібно змінити (ID від Firebase).
 */
async function checkTodo(id) {
    hideError();
    const todoToToggle = todos.find(todo => todo.id === id);

    if (todoToToggle) {
        // Локальне оновлення для швидкого відгуку UI
        todoToToggle.checked = !todoToToggle.checked;
        render(); // Оновлюємо UI негайно

        showLoading();
        try {
            // URL для оновлення конкретного елемента
            const updateUrl = `${FIREBASE_BASE_URL}/${id}.json`;
            const dataToUpdate = {
                checked: todoToToggle.checked // Відправляємо тільки змінене поле
            };

            const response = await fetch(updateUrl, {
                method: 'PATCH', // Використовуємо PATCH для часткового оновлення
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToUpdate)
            });

            if (!response.ok) {
                throw new Error(`Помилка HTTP: ${response.status}`);
            }

            console.log(`Оновлено статус справи з ID: ${id} у Firebase.`);
            hideError();
        } catch (error) {
            console.error('Помилка при оновленні статусу справи у Firebase:', error);
            showError(`Не вдалося оновити статус завдання: ${error.message}`);
            // Відкочуємо локальні зміни, якщо оновлення в БД не вдалося
            todoToToggle.checked = !todoToToggle.checked;
            render(); // Перерендеруємо з відкоченими даними
        } finally {
            hideLoading();
        }
    }
}


/**
 * Відображає всі справи з масиву 'todos' на веб-сторінці.
 */
function render() {
    list.innerHTML = ''; // Очищаємо список

    // Перетворюємо масив об'єктів todos на масив HTML-рядків
    const todoHtmlArray = todos.map(todo => renderTodo(todo));

    // Об'єднуємо всі HTML-рядки в один великий
    const fullHtml = todoHtmlArray.join('');

    list.innerHTML = fullHtml; // Вставляємо розмітку

    updateCounters(); // Оновлюємо лічильники
}


/**
 * Оновлює лічильники кількості справ.
 */
function updateCounters() {
    itemCountSpan.textContent = todos.length;
    uncheckedCountSpan.textContent = todos.filter(todo => !todo.checked).length;
}


// --- Початкове завантаження даних при старті додатку ---
// Викликаємо функцію для завантаження з Firebase.
// render() викликається всередині loadTodosFromFirebase() після успішного завантаження.
loadTodosFromFirebase();