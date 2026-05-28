import React, { useState } from 'react';
import { ProjectTask } from '../types.js';
import { Plus, ArrowRight, ArrowLeft, Tag, Calendar, AlertTriangle } from 'lucide-react';

interface KanbanBoardProps {
  tasks: ProjectTask[];
  onUpdateTaskStatus: (taskId: string, status: ProjectTask['status']) => void;
  onCreateTask: (task: { title: string; description: string; priority: ProjectTask['priority']; category: string }) => void;
}

export default function KanbanBoard({ tasks, onUpdateTaskStatus, onCreateTask }: KanbanBoardProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ProjectTask['priority']>('Medium');
  const [category, setCategory] = useState('');

  const columns: ProjectTask['status'][] = ['Backlog', 'In Progress', 'Review', 'Done'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateTask({
      title,
      description,
      priority,
      category: category || 'General'
    });
    // Reset form
    setTitle('');
    setDescription('');
    setPriority('Medium');
    setCategory('');
    setShowForm(false);
  };

  const getPriorityColor = (p: ProjectTask['priority']) => {
    switch (p) {
      case 'High': return 'bg-rose-500/15 text-rose-400 border border-rose-500/20';
      case 'Medium': return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
      case 'Low': return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    }
  };

  const getNextStatus = (current: ProjectTask['status']): ProjectTask['status'] | null => {
    const idx = columns.indexOf(current);
    if (idx < columns.length - 1) return columns[idx + 1];
    return null;
  };

  const getPrevStatus = (current: ProjectTask['status']): ProjectTask['status'] | null => {
    const idx = columns.indexOf(current);
    if (idx > 0) return columns[idx - 1];
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Kanban Navigation Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-medium text-white tracking-tight">Project Backlog Board</h2>
          <p className="text-xs text-gray-400">Manage sprint timelines, verify deliverables, and assign active categories instantly.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs uppercase tracking-wider rounded transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Quick Add Task Form Overlay */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#0d0d0d] border border-white/5 p-6 rounded-xl space-y-4 shadow-2xl max-w-2xl">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Create Sprint Log</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 font-sans">
              <label className="text-[10px] text-gray-500 font-mono tracking-wider">TASK TITLE</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Scaffold routing profiles"
                className="w-full bg-[#0a0a0a] border border-white/5 rounded p-2 text-gray-300 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5 pointer-events-auto">
              <label className="text-[10px] text-gray-500 font-mono tracking-wider">PRIORITY LEVEL</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as ProjectTask['priority'])}
                className="w-full bg-[#0a0a0a] border border-white/5 rounded p-2 text-gray-300 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-500 font-mono tracking-wider">CATEGORY LABEL</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g., Code Review, UI Layout"
                className="w-full bg-[#0a0a0a] border border-white/5 rounded p-2 text-gray-300 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] text-gray-500 font-mono tracking-wider">DESCRIPTION</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Explain the issue logic, expected outcomes or parameters..."
                rows={3}
                className="w-full bg-[#0a0a0a] border border-white/5 rounded p-2 text-gray-300 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-xs font-semibold transition"
            >
              Add Backlog Item
            </button>
          </div>
        </form>
      )}

      {/* Grid of Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(status => {
          const statusTasks = tasks.filter(t => t.status === status);
          
          return (
            <div key={status} className="bg-[#0d0d0d] rounded-xl border border-white/5 p-4 space-y-4">
              {/* Target column header */}
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-gray-300 font-mono">{status}</span>
                <span className="text-[10px] bg-[#1a1a1a] border border-white/5 text-gray-400 font-mono px-2.5 py-0.5 rounded-full">
                  {statusTasks.length}
                </span>
              </div>

              {/* Task Cards Stack */}
              <div className="space-y-3 min-h-[350px]">
                {statusTasks.length === 0 ? (
                  <div className="flex items-center justify-center py-12 border border-dashed border-white/5 rounded">
                    <span className="text-[10px] text-gray-600 font-mono">Columns clear</span>
                  </div>
                ) : (
                  statusTasks.map(task => {
                    const nextStatus = getNextStatus(task.status);
                    const prevStatus = getPrevStatus(task.status);
                    
                    return (
                      <div key={task.id} className="bg-[#0a0a0a] rounded border border-white/5 p-4 space-y-3 hover:border-white/10 transition">
                        {/* Priority Badge */}
                        <div className="flex justify-between items-start gap-2">
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-[9px] font-mono text-gray-500 uppercase flex items-center gap-1 font-semibold">
                            <Tag className="w-3 h-3 text-blue-400 shrink-0" />
                            {task.category}
                          </span>
                        </div>

                        {/* Title and description */}
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-white tracking-tight leading-tight">{task.title}</h4>
                          <p className="text-[11px] text-gray-400 leading-relaxed font-sans mt-1">
                            {task.description}
                          </p>
                        </div>

                        {/* Layout Footer Actions */}
                        <div className="flex justify-between items-center pt-3 border-t border-white/5">
                          {/* Created date representation */}
                          <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1 font-semibold">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {new Date(task.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                          </span>

                          <div className="flex gap-1">
                            {prevStatus && (
                              <button
                                onClick={() => onUpdateTaskStatus(task.id, prevStatus)}
                                className="p-1 text-gray-500 hover:text-white hover:bg-white/5 rounded transition"
                                title={`Move to ${prevStatus}`}
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {nextStatus && (
                              <button
                                onClick={() => onUpdateTaskStatus(task.id, nextStatus)}
                                className="p-1 text-gray-500 hover:text-white hover:bg-white/5 rounded transition"
                                title={`Move to ${nextStatus}`}
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
