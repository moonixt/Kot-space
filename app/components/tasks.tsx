import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import { encrypt, decrypt } from "./Encryption"; // Import encryption functions

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  due_date?: string | null;
  priority?: "low" | "medium" | "high";
  description?: string;
}

const Tasks = () => {
  const { t } = useTranslation();
  
  const priorityOptions = [
    { value: "low", label: t("tasks.lowPriority"), color: "bg-green-200" },
    { value: "medium", label: t("tasks.mediumPriority"), color: "bg-yellow-200" },
    { value: "high", label: t("tasks.highPriority"), color: "bg-red-200" },
  ];
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | null>(null);
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskDate, setEditingTaskDate] = useState<Date | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(5);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const newTaskInputRef = useRef<HTMLInputElement>(null);
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

      // Decrypt the task data
      const decryptedTasks =
        data?.map((task) => ({
          ...task,
          title: decrypt(task.title),
          description: task.description ? decrypt(task.description) : null,
        })) || [];

      setTasks(decryptedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;

    try {
      const { error } = await supabase.from("tasks").insert({
        user_id: user?.id,
        title: encrypt(newTask),
        is_completed: false,
        due_date: newTaskDueDate ? newTaskDueDate.toISOString() : null,
        priority: newTaskPriority,
        description: newTaskDescription.trim()
          ? encrypt(newTaskDescription.trim())
          : null,
      });

      if (error) throw error;
      setNewTask("");
      setNewTaskDueDate(null);
      setNewTaskPriority("medium");
      setNewTaskDescription("");
      setIsAddingTask(false);
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

  const updateTask = async (task: Task) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: encrypt(task.title),
          due_date: task.due_date,
          priority: task.priority,
          description: task.description ? encrypt(task.description) : null,
        })
        .eq("id", task.id);
      if (error) throw error;
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
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

  // Handle key press in the add task input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addTask();
    }
  };

  // Get current tasks for the active page
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);

  // // Calculate total pages
  // const totalPages = Math.ceil(tasks.length / tasksPerPage);

  // // Handle page change
  // const handlePageChange = (page: number) => {
  //   setCurrentPage(page);
  // };

  return (
    <div className="mb-8">
      {/* Stylish Tasks Header with Add Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-[var(--foreground)]">
          {t("tasks.myTasks")}{" "}
        </h2>
        <button
          onClick={() => {
            setIsAddingTask(!isAddingTask);
            setTimeout(() => newTaskInputRef.current?.focus(), 100);
          }}
          className="flex items-center rounded-md gap-1 px-3 py-1.5 c bg-gradient-to-r from-[var(--button-theme)] to-[var(--theme2)]/40 border border-[var(--border-theme)]/30 text-[var(--text-theme)] text-[var(--foreground)] hover:opacity-90 transition-all text-sm"
        >
          {isAddingTask ? (
            <>{t("tasks.cancel")}</>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>{t("tasks.newTask")}</span>
            </>
          )}
        </button>
      </div>

      {/* New Task Input - Appears only when adding */}
      {isAddingTask && (
        <div className="mb-5 bg-[var(--container)] rounded-md overflow-hidden shadow-sm transition-all">
          <div className="p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 border border-[var(--foreground)] rounded flex-shrink-0"></div>
              <input
                ref={newTaskInputRef}
                type="text"
                value={newTask}
                maxLength={32}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t("tasks.whatNeedsToBeDone")}
                className="flex-grow bg-transparent p-1 focus:outline-none text-[var(--foreground)] font-medium"
              />
            </div>

            <div className="ml-8 flex flex-col gap-3">
              <textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    addTask();
                  }
                }}
                placeholder={t("tasks.addNotes")}
                className="w-full p-2 bg-[var(--background)]/30 rounded text-sm resize-none focus:outline-none"
                rows={2}
              />

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 text-sm">
                  <button
                    type="button"
                    className="p-1.5 hover:bg-[var(--background)]/50 rounded-md flex items-center gap-1.5"
                    onClick={() => setEditingTaskId("new")}
                  >
                    <svg
                      width="14"
                      height="14"
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
                    {newTaskDueDate ? (
                      <span>{newTaskDueDate.toLocaleDateString()}</span>
                    ) : (
                      <span>{t("tasks.dueDate")}</span>
                    )}
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      className={`p-1.5 hover:bg-[var(--background)]/50 rounded-md flex items-center gap-1.5 ${
                        newTaskPriority === "high"
                          ? "text-red-500"
                          : newTaskPriority === "medium"
                            ? "text-yellow-500"
                            : "text-green-500"
                      }`}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m19 7-7 7-7-7"></path>
                      </svg>
                      <select
                        value={newTaskPriority}
                        onChange={(e) =>
                          setNewTaskPriority(
                            e.target.value as "low" | "medium" | "high",
                          )
                        }
                        className="appearance-none bg-transparent border-none focus:outline-none p-0"
                      >
                        {priorityOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </button>
                  </div>
                </div>

                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={addTask}
                    disabled={!newTask.trim()}
                    className={`px-3 py-1.5 rounded-md ${
                      newTask.trim()
                        ? "bg-[var(--foreground)] text-[var(--background)]"
                        : "bg-[var(--background)]/30 text-[var(--foreground)]/50"
                    } text-sm font-medium transition-colors`}
                  >
                    {t("tasks.add")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date picker modal */}
      {editingTaskId === "new" && (
        <div
          ref={datePickerRef}
          className="fixed inset-0 z-20 flex items-center justify-center"
        >
          <div
            className="absolute inset-0 bg-black bg-opacity-25"
            onClick={() => setEditingTaskId(null)}
          ></div>
          <div className="relative z-30 bg-[var(--background)] rounded-lg shadow-lg p-4">
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
                {t("tasks.clear")}
              </button>
              <button
                type="button"
                onClick={() => setEditingTaskId(null)}
                className="text-xs px-3 py-1.5 bg-[var(--foreground)] text-[var(--background)] rounded"
              >
                {t("tasks.done")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task List - Masonry layout */}
      {tasks.length > 0 ? (
        <div className="columns-1  sm:columns-2 md:columns-2 lg:columns-3 xl:columns-3 gap-4 space-y-4">
          {currentTasks.map((task, index) => {
            // Calculate dynamic height based on content and priority
            const baseHeight = 120;
            const contentHeight = (task.description?.length || 0) * 0.8;
            const priorityHeight = task.priority === "high" ? 20 : task.priority === "medium" ? 10 : 0;
            const varietyHeight = (index % 4) * 30; // Add variety to heights
            
            return (
              <div
                key={task.id}
                className={`break-inside-avoid mb-4 p-4 bg-[var(--container)] hover:bg-[var(--container)]/80 hover:shadow-md transition-all duration-200 rounded-xl border border-[var(--foreground)]/30 hover:border-[var(--border-color)]/50 overflow-hidden backdrop-blur-sm ${
                  task.is_completed ? "opacity-60" : ""
                } ${
                  task.priority === "high" ? "border-r-4 border-r-red-300" :
                  task.priority === "medium" ? "border-r-4 border-r-yellow-400" :
                  task.priority === "low" ? "border-r-4 border-r-green-400" : ""
                }`}
                style={{
                  minHeight: `${baseHeight + contentHeight + priorityHeight + varietyHeight}px`
                }}
              >
              <div className="flex items-start gap-2">
                <button
                  onClick={() =>
                    toggleTaskCompletion(task.id, task.is_completed)
                  }
                  className="flex-shrink-0 mt-1"
                >
                  <div id="checkbox"
                    className={`w-5 h-5 ${
                      task.is_completed
                        ? "bg-[var(--foreground)] border-[var(--foreground)]"
                        : task.priority === "high"
                          ? "border-red-400"
                          : task.priority === "low"
                            ? "border-green-400"
                            : "border-yellow-400"
                    } border flex items-center justify-center transition-colors`}
                  >
                    {task.is_completed && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--background)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                </button>
                <div className="flex-grow break-words overflow-hidden">
                  <span
                    className={`${
                      task.is_completed ? "line-through opacity-70" : ""
                    }`}
                  >
                    <span
                      className="font-medium cursor-pointer hover:underline break-words"
                      onClick={() => setEditingTask(task)}
                    >
                      {task.title}
                    </span>
                  </span>
                  {task.description && (
                    <div className="text-xs mt-1.5 text-[var(--foreground)] opacity-80 break-words overflow-hidden">
                      {task.description}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--foreground)] opacity-60 mt-2">
                    {task.due_date && (
                      <span
                        className={`flex items-center gap-1 ${
                          isOverdue(task.due_date) && !task.is_completed
                            ? "text-red-500 opacity-100"
                            : ""
                        }`}
                      >
                        <svg
                          width="12"
                          height="12"
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
                        {formatDate(task.due_date)}
                      </span>
                    )}
                    {task.priority && (
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          task.priority === "high"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : task.priority === "low"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        {task.priority === "high"
                          ? t("tasks.highPriority")
                          : task.priority === "low"
                            ? t("tasks.lowPriority")
                            : t("tasks.mediumPriority")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className="relative">
                    <button
                      onClick={() => {
                        setEditingTaskId(task.id);
                        setEditingTaskDate(
                          task.due_date ? new Date(task.due_date) : null,
                        );
                      }}
                      className="p-1.5 text-[var(--foreground)] opacity-40 hover:opacity-100 hover:bg-[var(--background)]/30 rounded"
                      title={t("tasks.setDueDate")}
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

                    {editingTaskId === task.id && (
                      <div
                        ref={datePickerRef}
                        className="fixed inset-0 z-20 flex items-center justify-center"
                      >
                        <div
                          className="absolute inset-0 bg-black bg-opacity-25"
                          onClick={() => setEditingTaskId(null)}
                        ></div>
                        <div className="relative z-30 bg-[var(--background)] rounded-lg shadow-lg p-4">
                          <DatePicker
                            selected={editingTaskDate}
                            onChange={(date) =>
                              updateTaskDueDate(task.id, date)
                            }
                            inline
                            className="bg-[var(--background)] text-[var(--foreground)]"
                          />
                          <div className="flex justify-between mt-3">
                            <button
                              type="button"
                              onClick={() => updateTaskDueDate(task.id, null)}
                              className="text-xs px-3 py-1.5 hover:bg-[var(--container)] rounded"
                            >
                              {t("tasks.clear")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTaskId(null)}
                              className="text-xs px-3 py-1.5 bg-[var(--foreground)] text-[var(--background)] rounded"
                            >
                              {t("tasks.done")}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setEditingTask(task)}
                    className="p-1.5 text-[var(--foreground)] opacity-40 hover:opacity-100 hover:bg-[var(--background)]/30 rounded"
                    title={t("tasks.editTask")}
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
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-[var(--foreground)] opacity-40 hover:opacity-100 hover:bg-red-500/20 hover:text-red-500 rounded"
                    title={t("tasks.deleteTask")}
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
          );
          })}
        </div>
      ) : (
        <div className="p-6 border border-dashed border-[var(--border-color)] text-center rounded-lg">
          <div className="flex flex-col items-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-3 opacity-40"
            >
              <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"></path>
              <path d="M15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"></path>
              <path d="M12 13.5v3.5"></path>
            </svg>
            <p className="text-sm opacity-70 mb-2">{t("tasks.noTasksYet")}</p>
            <button
              onClick={() => {
                setIsAddingTask(true);
                setTimeout(() => newTaskInputRef.current?.focus(), 100);
              }}
              className="text-xs px-3 py-1 bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-90"
            >
              {t("tasks.createFirst")}
            </button>
          </div>
        </div>
      )}

      {/* Pagination Controls - Only show if there are 5 or more tasks */}
      {tasks.length >= 5 && (
        <div className="flex flex-col sm:flex-row sm:justify-between items-center text-sm text-[var(--foreground)] opacity-70 mt-4 gap-3">
          <div className="flex text-center sm:text-left">
            {t("tasks.page")} {currentPage} {t("tasks.of")}{" "}
            {Math.ceil(tasks.length / tasksPerPage)}
          </div>
          <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                currentPage === 1
                  ? "bg-[var(--background)]/30 text-[var(--foreground)]/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-[var(--button-theme)] to-[var(--theme2)]/40 border border-[var(--border-theme)]/30 text-[var(--text-theme)]"
              }`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transform rotate-180"
              >
                <path d="M12 4v16m8-8H4"></path>
              </svg>
              {t("tasks.first")}
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                currentPage === 1
                  ? "bg-[var(--background)]/30 text-[var(--foreground)]/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-[var(--button-theme)] to-[var(--theme2)]/40 border border-[var(--border-theme)]/30 text-[var(--text-theme)] "
              }`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 4v16m8-8H4"></path>
              </svg>
              {t("tasks.prev")}
            </button>
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === Math.ceil(tasks.length / tasksPerPage)}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                currentPage === Math.ceil(tasks.length / tasksPerPage)
                  ? "bg-[var(--background)]/30 text-[var(--foreground)]/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-[var(--button-theme)] to-[var(--theme2)]/40 border border-[var(--border-theme)]/30 text-[var(--text-theme)]"
              }`}
            >
              {t("tasks.next")}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 4v16m8-8H4"></path>
              </svg>
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.ceil(tasks.length / tasksPerPage))
              }
              disabled={currentPage === Math.ceil(tasks.length / tasksPerPage)}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                currentPage === Math.ceil(tasks.length / tasksPerPage)
                  ? "bg-[var(--background)]/30 text-[var(--foreground)]/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-[var(--button-theme)] to-[var(--theme2)]/40 border border-[var(--border-theme)]/30 text-[var(--text-theme)]"
              }`}
            >
              {t("tasks.last")}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transform rotate-180"
              >
                <path d="M12 4v16m8-8H4"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Edit Task Modal - Styled version */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-[var(--background)] p-6 rounded-lg shadow-xl w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 p-2 hover:bg-[var(--container)] rounded-full transition-colors"
              onClick={() => setEditingTask(null)}
              aria-label="Close"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h3 className="font-semibold text-lg mb-4">
              {t("tasks.editTask")}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1 opacity-70">
                  {t("tasks.taskTitle")}
                </label>
                <input
                  className="w-full bg-[var(--container)] p-2.5 rounded-md"
                  value={editingTask.title}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
                  }
                  placeholder={t("tasks.taskTitle")}
                />
              </div>

              <div>
                <label className="block text-xs mb-1 opacity-70">
                  {t("tasks.description")}
                </label>
                <textarea
                  className="w-full bg-[var(--container)] p-2.5 rounded-md min-h-[80px]"
                  value={editingTask.description || ""}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      description: e.target.value,
                    })
                  }
                  placeholder={t("tasks.addNotes")}
                />
              </div>

              <div>
                <label className="block text-xs mb-1 opacity-70">
                  {t("tasks.priority")}
                </label>
                <div className="flex gap-3">
                  {["high", "medium", "low"].map((priority) => (
                    <label
                      key={priority}
                      className={`flex items-center gap-2 p-2.5 bg-[var(--container)] rounded-md flex-1 cursor-pointer border ${
                        editingTask.priority === priority
                          ? priority === "high"
                            ? "border-red-400"
                            : priority === "medium"
                              ? "border-yellow-400"
                              : "border-green-400"
                          : "border-transparent"
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        checked={editingTask.priority === priority}
                        onChange={() =>
                          setEditingTask({
                            ...editingTask,
                            priority: priority as "low" | "medium" | "high",
                          })
                        }
                        className="sr-only"
                      />
                      <span
                        className={`w-3 h-3 rounded-full ${
                          priority === "high"
                            ? "bg-red-500"
                            : priority === "medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                      ></span>
                      <span className="text-sm">
                        {priority === "high"
                          ? t("tasks.highPriority")
                          : priority === "medium"
                            ? t("tasks.mediumPriority")
                            : t("tasks.lowPriority")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 bg-[var(--container)] hover:bg-[var(--container-darker)] rounded-md text-sm"
                onClick={() => setEditingTask(null)}
              >
                {t("tasks.cancel")}
              </button>
              <button
                className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md text-sm font-medium"
                onClick={() => updateTask(editingTask)}
              >
                {t("tasks.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
