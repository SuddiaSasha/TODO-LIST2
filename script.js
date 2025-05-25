const list = document.getElementById('todo-list');
const itemCountSpan = document.getElementById('item-count');
const uncheckedCountSpan = document.getElementById('unchecked-count');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessageDiv = document.getElementById('error-message');
const errorTextSpan = document.getElementById('error-text');

const FIREBASE_BASE_URL = 'https://todolist-c53dd-default-rtdb.europe-west1.firebasedatabase.app/todos';
const FIREBASE_FULL_URL = `${FIREBASE_BASE_URL}.json`; // Для POST та GET всіх todos

let todos = []; 
let nextId = 1;

function showLoading() {
    loadingIndicator.style.display = 'block';
    hideError(); 
}

function hideLoading() {
    loadingIndicator.style.display = 'none';
}

function showError(message) {
    errorTextSpan.textContent = message;
    errorMessageDiv.style.display = 'block';
    hideLoading();
}

function hideError() {
    errorMessageDiv.style.display = 'none';
    errorTextSpan.textContent = '';
}


async function loadTodosFromFirebase() {
    showLoading(); 
    try {
        const response = await fetch(FIREBASE_FULL_URL);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const data = await response.json();

        todos = []; 
        if (data) { 
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    todos.push({
                        id: key,
                        text: data[key].text,
                        checked: data[key].checked
                    });
                }
            }
        }
        console.log('Data loaded from Firevase: ', todos);
        render(); 
        hideError();
    } catch (error) {
        console.error('Error while loading data from Firebase: ', error);
        showError(`Error with loading a task: ${error.message}`); 
    } finally {
        hideLoading(); 
    }
}


async function newTodo() {
    hideError(); 
    const todoText = prompt('Enter new value: ');

    if (todoText !== null && todoText.trim() !== '') {
        const newTodoItemForFirebase = {
            text: todoText.trim(),
            checked: false
        };
        showLoading(); 
        try {
            const response = await fetch(FIREBASE_FULL_URL, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTodoItemForFirebase)
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            const firebaseId = data.name; 

            const newTodoItem = {
                id: firebaseId,
                text: todoText.trim(),
                checked: false
            };
            todos.push(newTodoItem); 

            console.log('Task added to Firebase db:', newTodoItem);
            render(); 
            hideError();
        } catch (error) {
            console.error('Error while adding task to Firebase db: ', error);
            showError(`Error with addign a task: ${error.message}`);
        } finally {
            hideLoading();
        }
    } else {
        alert('Task hasnt added. Please enter valid description.');
    }
}


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


async function deleteTodo(id) {
    hideError();
    showLoading();
    try {
        const deleteUrl = `${FIREBASE_BASE_URL}/${id}.json`;

        const response = await fetch(deleteUrl, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        console.log(`Deleted task with ID: ${id} з Firebase.`);
        todos = todos.filter(todo => todo.id !== id);
        render(); 
        hideError();
    } catch (error) {
        console.error('Error while deleting task from Firebase:', error);
        showError(`Task didnt deleted: ${error.message}`);
    } finally {
        hideLoading();
    }
}


async function checkTodo(id) {
    hideError();
    const todoToToggle = todos.find(todo => todo.id === id);

    if (todoToToggle) {
        todoToToggle.checked = !todoToToggle.checked;
        render(); 

        showLoading();
        try {
            const updateUrl = `${FIREBASE_BASE_URL}/${id}.json`;
            const dataToUpdate = {
                checked: todoToToggle.checked 
            };

            const response = await fetch(updateUrl, {
                method: 'PATCH', 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToUpdate)
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            console.log(`Refreshed status task with ID: ${id} у Firebase.`);
            hideError();
        } catch (error) {
            console.error('Error while refreshing status task in Firebase:', error);
            showError(`Didnt refreshed status of task: ${error.message}`);
            todoToToggle.checked = !todoToToggle.checked;
            render(); 
        } finally {
            hideLoading();
        }
    }
}


function render() {
    list.innerHTML = ''; 

    const todoHtmlArray = todos.map(todo => renderTodo(todo));

    const fullHtml = todoHtmlArray.join('');

    list.innerHTML = fullHtml; 

    updateCounters(); 
}


function updateCounters() {
    itemCountSpan.textContent = todos.length;
    uncheckedCountSpan.textContent = todos.filter(todo => !todo.checked).length;
}


loadTodosFromFirebase();