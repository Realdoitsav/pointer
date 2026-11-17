(() => {
  const KEY = "taskline:v1";
  const $ = (sel) => document.querySelector(sel);
  const form = $("#add-form");
  const input = $("#new-task");
  const list = $("#list");
  const empty = $("#empty");
  const remaining = $("#remaining");
  const remainingLabel = $("#remaining-label");
  const fill = $("#bar-fill");
  const track = $("#track");
  const clearBtn = $("#clear-done");
  const filterBtns = document.querySelectorAll("[data-filter]");

  let tasks = load();
  let filter = "all";

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(tasks));
    } catch {
      /* storage unavailable: the app still works for this session */
    }
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function el(tag, props = {}, ...children) {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
  }

  function render() {
    const left = tasks.filter((t) => !t.done).length;
    const pct = tasks.length ? Math.round(((tasks.length - left) / tasks.length) * 100) : 0;

    remaining.textContent = left;
    remainingLabel.textContent = left === 1 ? "task left" : "tasks left";
    fill.style.width = pct + "%";
    track.setAttribute("aria-valuenow", pct);
    clearBtn.hidden = tasks.every((t) => !t.done);

    filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === filter)));

    const visible = tasks.filter((t) =>
      filter === "all" ? true : filter === "done" ? t.done : !t.done
    );

    list.replaceChildren(...visible.map(renderItem));

    const messages = {
      all: "No tasks yet. Add your first one above.",
      active: "Nothing left to do.",
      done: "No finished tasks yet.",
    };
    empty.hidden = visible.length > 0;
    empty.textContent = messages[filter];
  }

  function renderItem(task) {
    const checkbox = el("input", { type: "checkbox", checked: task.done });
    checkbox.setAttribute("aria-label", "Mark “" + task.text + "” as done");
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      save();
      render();
    });

    const text = el("span", { className: "text" }, task.text);
    text.addEventListener("dblclick", () => startEdit(task, li));

    const editBtn = el("button", { type: "button", className: "icon-btn", textContent: "Edit" });
    editBtn.addEventListener("click", () => startEdit(task, li));

    const delBtn = el("button", { type: "button", className: "icon-btn delete", textContent: "Delete" });
    delBtn.setAttribute("aria-label", "Delete “" + task.text + "”");
    delBtn.addEventListener("click", () => {
      tasks = tasks.filter((t) => t.id !== task.id);
      save();
      render();
    });

    const li = el("li", { className: "item" + (task.done ? " done" : "") }, checkbox, text, editBtn, delBtn);
    return li;
  }

  function startEdit(task, li) {
    const field = el("input", { type: "text", className: "edit-input", value: task.text, maxLength: 200 });
    field.setAttribute("aria-label", "Edit task");
    li.replaceChildren(field);
    field.focus();
    field.select();

    let finished = false;
    const finish = (commit) => {
      if (finished) return;
      finished = true;
      const value = field.value.trim();
      if (commit && value) {
        task.text = value;
        save();
      }
      render();
    };
    field.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finish(true);
      if (e.key === "Escape") finish(false);
    });
    field.addEventListener("blur", () => finish(true));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    tasks.unshift({ id: uid(), text: value, done: false });
    input.value = "";
    save();
    render();
    input.focus();
  });

  filterBtns.forEach((b) =>
    b.addEventListener("click", () => {
      filter = b.dataset.filter;
      render();
    })
  );

  clearBtn.addEventListener("click", () => {
    tasks = tasks.filter((t) => !t.done);
    save();
    render();
  });

  render();
})();
