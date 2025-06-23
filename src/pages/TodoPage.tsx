import React, { useEffect, useState } from "react";
import axios from "axios";

type Todo = {
  _id?: string;
  title: string;
  description: string;
  category: string;
  priority: "Low" | "Medium" | "High";
  completed?: boolean;
  createdAt?: string;
};

const defaultCategories = ["Work", "Personal", "Hospital"];

const Home: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [todo, setTodo] = useState<Todo>({
    title: "",
    description: "",
    category: "",
    priority: "Low",
  });
  const [filter, setFilter] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("todo-categories");
    if (stored) {
      setCategories(JSON.parse(stored));
    } else {
      setCategories(defaultCategories);
    }
    fetchTodos();
  }, []);

  const saveCategoriesToStorage = (cats: string[]) => {
    setCategories(cats);
    localStorage.setItem("todo-categories", JSON.stringify(cats));
  };

  const fetchTodos = async () => {
    const res = await axios.get<Todo[]>("http://localhost:5000/api/get-todo");
    setTodos(res.data);
  };

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    const updated = [...categories, trimmed];
    saveCategoriesToStorage(updated);
    setNewCategory("");
  };

  const deleteCategory = (cat: string) => {
    const updated = categories.filter((c) => c !== cat);
    saveCategoriesToStorage(updated);
    if (todo.category === cat) setTodo({ ...todo, category: "" });
    if (filter === cat) setFilter("");
  };

  const handleAddOrUpdateTodo = async () => {
    if (!todo.title || !todo.category) {
      return alert("Title and category are required");
    }

    if (editingId) {
      const res = await axios.put(
        `http://localhost:5000/api/update-todo/${editingId}`,
        todo
      );
      setTodos(todos.map((t) => (t._id === editingId ? res.data : t)));
      setEditingId(null);
    } else {
      const res = await axios.post("http://localhost:5000/api/newtodo", {
        ...todo,
        completed: false,
        createdAt: new Date().toISOString(),
      });
      setTodos([...todos, res.data]);
    }

    setTodo({ title: "", description: "", category: "", priority: "Low" });
  };

  const handleEdit = (todo: Todo) => {
    setTodo({ ...todo, completed: todo.completed ?? false });
    setEditingId(todo._id!);
  };

  const handleDelete = async (id: string) => {
    await axios.delete(`http://localhost:5000/api/delete-todo/${id}`);
    setTodos(todos.filter((t) => t._id !== id));
  };

  const toggleComplete = async (id: string, newStatus: boolean) => {
    setTodos((prev) =>
      prev.map((t) => (t._id === id ? { ...t, completed: newStatus } : t))
    );

    try {
      await axios.put(`http://localhost:5000/api/update-todo/${id}`, {
        ...todos.find((t) => t._id === id)!,
        completed: newStatus,
      });
    } catch (err) {
      setTodos((prev) =>
        prev.map((t) => (t._id === id ? { ...t, completed: !newStatus } : t))
      );
      alert("Failed to update status. Please try again.");
    }
  };

  const filteredTodos = filter ? todos.filter((t) => t.category === filter) : todos;

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-slate-100 p-6 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-center">Task Planner</h1>

      {/* Task Stats */}
      <div className="flex justify-center gap-6 text-center mb-6">
        <div className="bg-white shadow-md px-6 py-4 rounded-lg">
          <p className="text-sm text-gray-500">Total Tasks</p>
          <p className="text-xl font-bold">{todos.length}</p>
        </div>
        <div className="bg-white shadow-md px-6 py-4 rounded-lg">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-xl font-bold">{todos.filter(t => t.completed).length}</p>
        </div>
        <div className="bg-white shadow-md px-6 py-4 rounded-lg">
          <p className="text-sm text-gray-500">Remaining</p>
          <p className="text-xl font-bold">{todos.filter(t => !t.completed).length}</p>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Add Category</h2>
        <div className="flex gap-2 mb-2">
          <input
            className="border p-2 rounded w-full"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New Category"
          />
          <button
            onClick={addCategory}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add
          </button>
        </div>
        <ul className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <li key={cat} className="bg-gray-200 px-3 py-1 rounded flex items-center">
              {cat}
              <button
                onClick={() => deleteCategory(cat)}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{editingId ? "Update" : "Add"} Todo</h2>
        <div className="space-y-2">
          <input
            className="border p-2 w-full rounded"
            value={todo.title}
            onChange={(e) => setTodo({ ...todo, title: e.target.value })}
            placeholder="Title"
          />
          <textarea
            className="border p-2 w-full rounded"
            value={todo.description}
            onChange={(e) => setTodo({ ...todo, description: e.target.value })}
            placeholder="Description"
          />
          <select
            className="border p-2 w-full rounded"
            value={todo.category}
            onChange={(e) => setTodo({ ...todo, category: e.target.value })}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            className="border p-2 w-full rounded"
            value={todo.priority}
            onChange={(e) => setTodo({ ...todo, priority: e.target.value as "Low" | "Medium" | "High" })}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
          <button
            onClick={handleAddOrUpdateTodo}
            className={`${editingId ? "bg-green-500" : "bg-purple-600"} text-white px-4 py-2 rounded hover:opacity-90`}
          >
            {editingId ? "Update Task" : "Add Task"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Todos</h2>
        <div className="mb-4">
          <label className="mr-2">Filter by Category:</label>
          <select
            className="border p-2 rounded"
            onChange={(e) => setFilter(e.target.value)}
            value={filter}
          >
            <option value="">All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        {filteredTodos.length === 0 ? (
          <p className="text-center text-gray-500">No tasks yet</p>
        ) : (
        <ul className="space-y-4">
          {filteredTodos.map((t) => (
            <li
              key={t._id}
              className={`border p-4 rounded-lg shadow-md flex justify-between items-start transition-all duration-300 ${
                t.completed ? "bg-green-50 border-green-400" : "bg-white"
              }`}
            >
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={!!t.completed}
                  onChange={() => toggleComplete(t._id!, !t.completed)}
                  className="mr-3 mt-1 accent-green-600 w-5 h-5"
                />
                <div>
                  <h3 className={`text-lg font-semibold ${t.completed ? "line-through text-gray-500" : ""}`}>{t.title}</h3>
                  <p className="text-sm text-gray-600">{t.description}</p>
                  <p className="text-xs text-gray-400">Created: {t.createdAt ? formatDate(t.createdAt) : "Unknown"}</p>
                  <span className="text-xs inline-block mt-1 bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
                    {t.category} • <span className="font-semibold">{t.priority}</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <button
                  onClick={() => handleEdit(t)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(t._id!)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>

        )}
      </section>
    </div>
  );
};

export default Home;
