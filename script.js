document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const todoInput = document.getElementById("todoInput");
  const addBtn = document.getElementById("addBtn");
  const todoList = document.getElementById("todoList");
  const emptyState = document.getElementById("emptyState");
  const totalCount = document.getElementById("totalCount");
  const completedCount = document.getElementById("completedCount");
  const filterBtns = document.querySelectorAll(".filter-btn");

  // Current filter state
  let currentFilter = "all";

  // Initialize the app
  loadTodos();
  updateCounters();

  // Event Listeners
  addBtn.addEventListener("click", addTodo);
  todoInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") addTodo();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      filterBtns.forEach((b) =>
        b.classList.remove("bg-indigo-300", "font-medium")
      );
      this.classList.add("bg-indigo-300", "font-medium");
      currentFilter = this.dataset.filter;
      filterTodos(currentFilter);
    });
  });

  // Functions
  function addTodo() {
    const text = todoInput.value.trim();
    if (text === "") {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Please enter a task before adding!",
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    const todo = {
      id: Date.now(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // Add to UI
    renderTodo(todo);

    // Add to localStorage
    const todos = getTodos();
    todos.push(todo);
    saveTodos(todos);

    // Clear input
    todoInput.value = "";

    // Update counters
    updateCounters();

    // Hide empty state if needed
    if (emptyState.style.display !== "none") {
      emptyState.style.display = "none";
    }
  }

  function renderTodo(todo) {
    if (currentFilter === "completed" && !todo.completed) return;
    if (currentFilter === "active" && todo.completed) return;

    const li = document.createElement("li");
    li.className = "todo-item p-4 hover:bg-gray-50 flex items-center group";
    li.dataset.id = todo.id;

    li.innerHTML = `
              <div class="flex items-center flex-grow">
                  <input 
                      type="checkbox" 
                      class="custom-checkbox mr-3" 
                      ${todo.completed ? "checked" : ""}
                  >
                  <span class="${
                    todo.completed
                      ? "line-through text-gray-400"
                      : "text-gray-800"
                  } flex-grow">
                      ${todo.text}
                  </span>
                  <button class="delete-btn opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 rounded-full transition-opacity">
                      <i class="fas fa-trash-alt"></i>
                  </button>
              </div>
          `;

    // Add event listeners to the new elements
    const checkbox = li.querySelector('input[type="checkbox"]');
    const deleteBtn = li.querySelector(".delete-btn");

    checkbox.addEventListener("change", function () {
      toggleTodoComplete(todo.id, this.checked);
    });

    deleteBtn.addEventListener("click", function () {
      deleteTodo(todo.id);
    });

    // Add double-click for editing
    li.querySelector("span").addEventListener("dblclick", function () {
      editTodo(todo.id, this);
    });

    // Add drag and drop functionality
    li.draggable = true;
    li.addEventListener("dragstart", handleDragStart);
    li.addEventListener("dragover", handleDragOver);
    li.addEventListener("drop", handleDrop);
    li.addEventListener("dragend", handleDragEnd);

    todoList.appendChild(li);
  }

  function toggleTodoComplete(id, isCompleted) {
    const todos = getTodos();
    const todoIndex = todos.findIndex((todo) => todo.id == id);

    if (todoIndex !== -1) {
      todos[todoIndex].completed = isCompleted;
      saveTodos(todos);

      // Update UI
      const todoItem = document.querySelector(`li[data-id="${id}"]`);
      if (todoItem) {
        const textSpan = todoItem.querySelector("span");
        if (isCompleted) {
          textSpan.classList.add("line-through", "text-gray-400");
        } else {
          textSpan.classList.remove("line-through", "text-gray-400");
        }
      }

      // Update counters
      updateCounters();

      // Re-filter if needed
      if (currentFilter !== "all") {
        filterTodos(currentFilter);
      }
    }
  }

  function deleteTodo(id) {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        // Remove from localStorage
        const todos = getTodos().filter((todo) => todo.id != id);
        saveTodos(todos);

        // Remove from UI
        const todoItem = document.querySelector(`li[data-id="${id}"]`);
        if (todoItem) {
          todoItem.classList.add("opacity-0", "h-0", "py-0", "border-0");
          setTimeout(() => {
            todoItem.remove();

            // Show empty state if no todos left
            if (todoList.children.length === 1 && emptyState) {
              emptyState.style.display = "block";
            }

            // Update counters
            updateCounters();

            Swal.fire("Deleted!", "Your task has been deleted.", "success");
          }, 300);
        }
      }
    });
  }

  function editTodo(id, element) {
    const currentText = element.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentText;
    input.className =
      "border-b border-indigo-500 px-1 py-1 flex-grow focus:outline-none";

    element.replaceWith(input);
    input.focus();

    function saveEdit() {
      const newText = input.value.trim();
      if (newText === "") {
        deleteTodo(id);
        return;
      }

      // Update localStorage
      const todos = getTodos();
      const todoIndex = todos.findIndex((todo) => todo.id == id);

      if (todoIndex !== -1) {
        todos[todoIndex].text = newText;
        saveTodos(todos);

        // Update UI
        const span = document.createElement("span");
        span.className = element.className;
        span.textContent = newText;

        // Add double-click event for future edits
        span.addEventListener("dblclick", function () {
          editTodo(id, this);
        });

        input.replaceWith(span);
      }
    }

    input.addEventListener("blur", saveEdit);
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") saveEdit();
    });
  }

  function loadTodos() {
    const todos = getTodos();

    if (todos.length > 0) {
      emptyState.style.display = "none";
      todos.forEach((todo) => renderTodo(todo));
    }
  }

  function filterTodos(filter) {
    const todos = getTodos();
    currentFilter = filter;

    // Clear current list
    while (todoList.children.length > 1) {
      todoList.removeChild(todoList.lastChild);
    }

    if (todos.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    // Render filtered todos
    todos.forEach((todo) => {
      if (
        filter === "all" ||
        (filter === "completed" && todo.completed) ||
        (filter === "active" && !todo.completed)
      ) {
        renderTodo(todo);
      }
    });
  }

  function updateCounters() {
    const todos = getTodos();
    const total = todos.length;
    const completed = todos.filter((todo) => todo.completed).length;

    totalCount.textContent = total;
    completedCount.textContent = completed;
  }

  // LocalStorage helpers
  function getTodos() {
    return JSON.parse(localStorage.getItem("todos")) || [];
  }

  function saveTodos(todos) {
    localStorage.setItem("todos", JSON.stringify(todos));
  }

  // Drag and Drop functionality
  let draggedItem = null;

  function handleDragStart(e) {
    draggedItem = this;
    e.dataTransfer.effectAllowed = "move";
    this.classList.add(
      "opacity-50",
      "border-dashed",
      "border-2",
      "border-indigo-300"
    );
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    this.classList.add("border-t-2", "border-indigo-500");
  }

  function handleDrop(e) {
    e.preventDefault();
    if (draggedItem !== this) {
      const todos = getTodos();
      const draggedId = parseInt(draggedItem.dataset.id);
      const targetId = parseInt(this.dataset.id);

      // Find indexes
      const draggedIndex = todos.findIndex((todo) => todo.id === draggedId);
      const targetIndex = todos.findIndex((todo) => todo.id === targetId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Reorder array
        const [removed] = todos.splice(draggedIndex, 1);
        todos.splice(targetIndex, 0, removed);

        // Save new order
        saveTodos(todos);

        // Re-render list
        todoList.innerHTML = "";
        if (todos.length > 0) {
          emptyState.style.display = "none";
          todos.forEach((todo) => renderTodo(todo));
        } else {
          emptyState.style.display = "block";
        }
      }
    }
  }

  function handleDragEnd() {
    this.classList.remove(
      "opacity-50",
      "border-dashed",
      "border-2",
      "border-indigo-300"
    );
    document.querySelectorAll(".todo-item").forEach((item) => {
      item.classList.remove("border-t-2", "border-indigo-500");
    });
  }
});
