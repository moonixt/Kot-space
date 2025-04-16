import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  due_date?: string | null;
}

const Tasks = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskDate, setEditingTaskDate] = useState<Date | null>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchTasks();

    // Close date picker when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setEditingTaskId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [user]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user?.id)
        .order("is_completed")
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const { error } = await supabase.from("tasks").insert({
        user_id: user?.id,
        title: newTask,
        is_completed: false,
        due_date: newTaskDueDate ? newTaskDueDate.toISOString() : null,
      });

      if (error) throw error;
      setNewTask("");
      setNewTaskDueDate(null);
      fetchTasks();
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const toggleTaskCompletion = async (
    taskId: string,
    currentStatus: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ is_completed: !currentStatus })
        .eq("id", taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error("Error toggling task completion:", error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const updateTaskDueDate = async (taskId: string, date: Date | null) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ due_date: date ? date.toISOString() : null })
        .eq("id", taskId);

      if (error) throw error;
      await fetchTasks();
      setEditingTaskId(null);
      setEditingTaskDate(null);
    } catch (error) {
      console.error("Error updating task due date:", error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Check if date is in the past
  const isOverdue = (dateString: string) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  return (
    <div className="mb-8">
    
      <form onSubmit={addTask} className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-grow flex gap-2">
            {/* Calendar button moved before input */}
            <div className="relative">
              <button
                type="button"
                className="h-full px-3 bg-[var(--container)]  flex items-center justify-center"
                title={t('tasks.setDueDate')}
                onClick={() => setEditingTaskId("new")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {newTaskDueDate && (
                  <span className="ml-2 text-xs">
                    {newTaskDueDate.toLocaleDateString()}
                  </span>
                )}
              </button>

              {/* Date picker modal appears below the button */}
              {editingTaskId === "new" && (
                <div
                  ref={datePickerRef}
                  className="fixed inset-0 z-20 flex items-center justify-center"
                >
                  <div
                    className="absolute inset-0 bg-black bg-opacity-25"
                    onClick={() => setEditingTaskId(null)}
                  ></div>
                  <div className="relative z-30 bg-[var(--background)]  rounded shadow-lg p-4">
                    <DatePicker
                      selected={newTaskDueDate}
                      onChange={(date) => setNewTaskDueDate(date)}
                      inline
                      className="bg-[var(--background)] text-[var(--foreground)]"
                    />
                    <div className="flex justify-between mt-3">
                      <button
                        type="button"
                        onClick={() => setNewTaskDueDate(null)}
                        className="text-xs px-3 py-1.5 hover:bg-[var(--container)] rounded"
                      >
                        {t('tasks.clear')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTaskId(null)}
                        className="text-xs px-3 py-1.5 bg-[var(--foreground)] text-[var(--background)] rounded"
                      >
                        {t('tasks.done')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <input
              type="text"
              value={newTask}
              maxLength={32}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder={t('tasks.addNew')}
              className="flex-grow  p-2 bg-[var(--container)]  focus:outline-none focus:ring-1 focus:ring-[var(--foreground)]"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] hover:bg-opacity-80 transition-colors"
          >
            {t('tasks.add')}
          </button>
        </div>
      </form>

      {tasks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 bg-[var(--container)] hover:bg-opacity-60 transition-all border-l-2 ${
                task.is_completed
                  ? "border-green-500 opacity-60"
                  : task.due_date && isOverdue(task.due_date)
                    ? "border-red-500"
                    : "border-[var(--foreground)]"
              }`}
            >
              <div className="flex items-start gap-2">
                <button
                  onClick={() =>
                    toggleTaskCompletion(task.id, task.is_completed)
                  }
                  className="flex-shrink-0 mt-1"
                >
                  <div
                    className={`w-5 h-5 border ${
                      task.is_completed
                        ? "bg-green-500 border-green-500"
                        : "border-[var(--foreground)]"
                    } rounded flex items-center justify-center`}
                  >
                    {task.is_completed && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                </button>

                <div className="flex-grow">
                  <span
                    className={
                      task.is_completed ? "line-through opacity-70" : ""
                    }
                  >
                    <span className="">{task.title}</span>
                  </span>

                  <div className="flex flex-wrap gap-x-3 text-xs text-[var(--foreground)] opacity-50 mt-1">
                    <span>{t('tasks.created')}: {formatDate(task.created_at)}</span>

                    {task.due_date && (
                      <span
                        className={
                          isOverdue(task.due_date) && !task.is_completed
                            ? "text-red-500 opacity-100"
                            : ""
                        }
                      >
                        {t('tasks.due')}: {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1">
                  {/* Calendar button for existing task */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setEditingTaskId(task.id);
                        setEditingTaskDate(
                          task.due_date ? new Date(task.due_date) : null,
                        );
                      }}
                      className="p-1 text-[var(--foreground)] opacity-40 hover:opacity-100"
                      title={t('tasks.setDueDate')}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        ></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </button>

                    {/* DatePicker for existing task */}
                    {editingTaskId === task.id && (
                      <div
                        ref={datePickerRef}
                        className="absolute z-10 top-full right-0 mt-1 bg-[var(--background)]  rounded shadow-lg p-2"
                      >
                        <DatePicker
                          selected={editingTaskDate}
                          onChange={(date) => updateTaskDueDate(task.id, date)}
                          inline
                          className="bg-[var(--background)] text-[var(--foreground)]"
                        />
                        <button
                          type="button"
                          onClick={() => updateTaskDueDate(task.id, null)}
                          className="w-full text-xs text-left px-2 py-1 mt-1 hover:bg-[var(--container)]"
                        >
                          {t('tasks.clear')}
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                    title={t('tasks.deleteTask')}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 border border-dashed border-[var(--border-color)] text-center">
          <p className="text-sm opacity-70">
            {t('tasks.noTasksYet')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Tasks;
