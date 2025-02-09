import React, { useState } from 'react';
import { Check, Plus, Trash } from 'lucide-react';
import type { Plan, Task } from '../../../types/plan';

export const PlanManager: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [newTask, setNewTask] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const calculateProgress = (tasks: Task[]) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const addTask = (planId: number) => {
    if (!newTask.trim()) return;

    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        return {
          ...plan,
          tasks: [...plan.tasks, {
            id: Date.now(),
            content: newTask,
            completed: false
          }]
        };
      }
      return plan;
    }));
    setNewTask('');
  };

  const toggleTask = (planId: number, taskId: number) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        return {
          ...plan,
          tasks: plan.tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
        };
      }
      return plan;
    }));
  };

  return (
    <div className="space-y-4">
      {plans.map(plan => (
        <div key={plan.id} className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{plan.title}</h3>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">
                진행률: {calculateProgress(plan.tasks)}%
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${calculateProgress(plan.tasks)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {plan.tasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
              >
                <button
                  onClick={() => toggleTask(plan.id, task.id)}
                  className={`p-1 rounded ${
                    task.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </button>
                <span className={task.completed ? 'line-through text-gray-400' : ''}>
                  {task.content}
                </span>
                {task.dueDate && (
                  <span className="text-xs text-gray-500">
                    ~{task.dueDate}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="새 할 일 추가"
              className="flex-1 p-2 border rounded"
              onKeyPress={(e) => e.key === 'Enter' && addTask(plan.id)}
            />
            <button
              onClick={() => addTask(plan.id)}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}; 