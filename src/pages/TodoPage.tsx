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

// Color palette for categories
const categoryColors = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", 
  "#10b981", "#06b6d4", "#84cc16", "#f97316", "#6b7280"
];

const getCategoryColor = (category: string, categories: string[]) => {
  const index = categories.indexOf(category);
  return categoryColors[index % categoryColors.length];
};

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
    const res = await axios.get("http://localhost:5000/api/get-todo");
    const data = Array.isArray(res.data) ? res.data : res.data.data;
    if (Array.isArray(data)) {
      setTodos(data);
    } else {
      console.error("Invalid data format:", res.data);
      setTodos([]);
    }
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800 border-red-200";
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            ✨ Task Planner
          </h1>
          <p className="text-gray-600 text-lg">Organize your life, one task at a time</p>
        </div>

        {/* Task Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 px-6 py-4 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm text-gray-500 font-medium">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-800">{todos.length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 px-6 py-4 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm text-gray-500 font-medium">Completed</p>
            <p className="text-2xl font-bold text-green-600">{todos.filter(t => t.completed).length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 px-6 py-4 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
            <div className="text-3xl mb-2">⏳</div>
            <p className="text-sm text-gray-500 font-medium">Remaining</p>
            <p className="text-2xl font-bold text-orange-600">{todos.filter(t => !t.completed).length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Categories and Add Todo */}
          <div className="space-y-6">
            {/* Categories Section */}
            <section className="bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🏷️</span>
                Manage Categories
              </h2>
              <div className="flex gap-2 mb-4">
                <input
                  className="border-2 border-gray-200 p-3 rounded-xl w-full focus:border-indigo-500 focus:outline-none transition-colors"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New Category"
                />
                <button
                  onClick={addCategory}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Add
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center gap-2 bg-white shadow-md px-4 py-2 rounded-full border border-gray-100 hover:shadow-lg transition-shadow">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(cat, categories) }}
                    ></div>
                    <span className="font-medium text-gray-700">{cat}</span>
                    <button
                      onClick={() => deleteCategory(cat)}
                      className="ml-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Add Todo Section */}
            <section className="bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">{editingId ? "✏️" : "➕"}</span>
                {editingId ? "Update Task" : "Add New Task"}
              </h2>
              <div className="space-y-4">
                <input
                  className="border-2 border-gray-200 p-3 w-full rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                  value={todo.title}
                  onChange={(e) => setTodo({ ...todo, title: e.target.value })}
                  placeholder="Task Title"
                />
                <textarea
                  className="border-2 border-gray-200 p-3 w-full rounded-xl focus:border-indigo-500 focus:outline-none transition-colors min-h-[100px] resize-none"
                  value={todo.description}
                  onChange={(e) => setTodo({ ...todo, description: e.target.value })}
                  placeholder="Task Description"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select
                    className="border-2 border-gray-200 p-3 w-full rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                    value={todo.category}
                    onChange={(e) => setTodo({ ...todo, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                    className="border-2 border-gray-200 p-3 w-full rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                    value={todo.priority}
                    onChange={(e) => setTodo({ ...todo, priority: e.target.value as "Low" | "Medium" | "High" })}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <button
                  onClick={handleAddOrUpdateTodo}
                  className={`w-full text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                    editingId 
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700" 
                      : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  }`}
                >
                  {editingId ? "Update Task" : "Add Task"}
                </button>
              </div>
            </section>
          </div>

          {/* Right Column - Todos */}
          <div>
            <section className="bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  Your Tasks
                </h2>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-600">Filter:</label>
                  <select
                    className="border-2 border-gray-200 p-2 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                    onChange={(e) => setFilter(e.target.value)}
                    value={filter}
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredTodos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-gray-500 text-lg">No tasks yet</p>
                  <p className="text-gray-400 text-sm">Add your first task to get started!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {filteredTodos.map((t) => (
                    <div
                      key={t._id}
                      className={`border-2 p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] ${
                        t.completed 
                          ? "bg-green-50 border-green-200 opacity-75" 
                          : "bg-white border-gray-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={!!t.completed}
                          onChange={() => toggleComplete(t._id!, !t.completed)}
                          className="mt-1 accent-indigo-600 w-5 h-5 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className={`text-lg font-semibold mb-1 ${
                                t.completed ? "line-through text-gray-500" : "text-gray-800"
                              }`}>
                                {t.title}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{t.description}</p>
                              <p className="text-xs text-gray-400 mb-2">
                                📅 {t.createdAt ? formatDate(t.createdAt) : "Unknown"}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm border">
                                  <div 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: getCategoryColor(t.category, categories) }}
                                  ></div>
                                  <span className="text-xs font-medium text-gray-700">{t.category}</span>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getPriorityColor(t.priority)}`}>
                                  {t.priority}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleEdit(t)}
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(t._id!)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;