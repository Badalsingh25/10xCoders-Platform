import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Trash2, GripHorizontal, Share2, Loader } from "lucide-react";
import axios from "axios";

const KanbanBoard = () => {
  const [tasks, setTasks] = useState({
    todo: [],
    inProgress: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const { data } = await axios.get("http://localhost:5001/api/todos", config);

      const newTasks = {
        todo: [],
        inProgress: [],
        completed: []
      };

      data.forEach(task => {
        // Map status (or fall back to completed boolean for legacy data)
        let status = task.status || (task.completed ? 'completed' : 'todo');
        if (newTasks[status]) {
          newTasks[status].push({ id: task._id, content: task.text, ...task });
        } else {
          // Fallback for unknown status
          newTasks['todo'].push({ id: task._id, content: task.text, ...task });
        }
      });

      setTasks(newTasks);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const totalTasks = tasks.todo.length + tasks.inProgress.length + tasks.completed.length;
  const completedCount = tasks.completed.length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5001/api/todos/${taskId}`, { status: newStatus }, config);
    } catch (err) {
      console.error("Error updating task:", err);
      // Revert state if needed (not implementing revert here for brevity)
    }
  };

  const advanceTask = (taskId, columnKey) => {
    // Optimistic UI update
    setTasks((prev) => {
      const nextMap = {
        todo: "inProgress",
        inProgress: "completed",
        completed: null,
      };

      const nextColumnKey = nextMap[columnKey];
      if (!nextColumnKey) return prev;

      const sourceTasks = [...prev[columnKey]];
      const taskIndex = sourceTasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return prev;

      const [movedTask] = sourceTasks.splice(taskIndex, 1);
      const updatedTask = { ...movedTask, status: nextColumnKey };
      const destTasks = [...prev[nextColumnKey], updatedTask];

      updateTaskStatus(taskId, nextColumnKey);

      return {
        ...prev,
        [columnKey]: sourceTasks,
        [nextColumnKey]: destTasks,
      };
    });
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Optimistic Update
    const newTasks = { ...tasks };
    const [movedTask] = newTasks[source.droppableId].splice(source.index, 1);

    // Update status locally
    movedTask.status = destination.droppableId;
    newTasks[destination.droppableId].splice(destination.index, 0, movedTask);

    setTasks(newTasks);

    // API Call
    if (source.droppableId !== destination.droppableId) {
      updateTaskStatus(draggableId, destination.droppableId);
    }
  };

  const addTaskToColumn = async (column) => {
    const newTaskContent = prompt(`Enter a new task for the ${column} column:`);
    if (newTaskContent) {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const { data } = await axios.post("http://localhost:5001/api/todos", {
          text: newTaskContent,
          status: column
        }, config);

        const newTaskObj = { id: data._id, content: data.text, ...data };

        setTasks(prev => ({
          ...prev,
          [column]: [...prev[column], newTaskObj]
        }));
      } catch (err) {
        console.error("Error adding task:", err);
        alert("Failed to add task");
      }
    }
  };

  const removeTask = async (taskId, column) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`http://localhost:5001/api/todos/${taskId}`, config);

      setTasks(prev => ({
        ...prev,
        [column]: prev[column].filter(task => task.id !== taskId)
      }));
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task");
    }
  };

  const columnConfig = {
    todo: {
      title: "To Do",
      headerColor: "bg-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200"
    },
    inProgress: {
      title: "In Progress",
      headerColor: "bg-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200"
    },
    completed: {
      title: "Completed",
      headerColor: "bg-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200"
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 text-center">Project Tasks</h1>

        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto bg-gray-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <p className="text-center text-gray-500 dark:text-gray-400 mt-2 font-medium">{progressPercentage}% Completed</p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(columnConfig).map(([columnKey, config]) => (
            <div
              key={columnKey}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700 flex flex-col h-full"
            >
              <div className={`${config.headerColor} px-6 py-4`}>
                <h2 className="text-white font-bold text-lg flex justify-between items-center">
                  {config.title}
                  <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium">
                    {tasks[columnKey].length}
                  </span>
                </h2>
              </div>

              <div className="flex-1 p-4 flex flex-col">
                <Droppable droppableId={columnKey}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[300px] ${config.bgColor} rounded-lg p-3 space-y-3`}
                    >
                      {tasks[columnKey].map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border ${config.borderColor} 
                                p-4 transition-all duration-200 hover:shadow-md
                                ${snapshot.isDragging ? 'shadow-lg ring-2 ring-gray-200 scale-105 z-50' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0"
                                  >
                                    <GripHorizontal size={16} />
                                  </div>
                                  <span className="text-gray-700 dark:text-gray-300 truncate">{task.content}</span>
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  {(columnKey === "todo" || columnKey === "inProgress") && (
                                    <button
                                      onClick={() => advanceTask(task.id, columnKey)}
                                      className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 p-1 rounded-full transition-colors duration-200"
                                      title={columnKey === "todo" ? "Move to In Progress" : "Move to Completed"}
                                    >
                                      <Share2 size={16} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => removeTask(task.id, columnKey)}
                                    className="text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors duration-200"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <button
                  onClick={() => addTaskToColumn(columnKey)}
                  className={`w-full mt-4 p-3 ${config.bgColor} ${config.borderColor} 
                    border rounded-lg flex items-center justify-center
                    text-gray-700 dark:text-gray-300 hover:bg-opacity-75 transition-all duration-200
                    hover:shadow-sm font-medium`}
                >
                  <Plus className="mr-2" size={18} />
                  Add New Task
                </button>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;