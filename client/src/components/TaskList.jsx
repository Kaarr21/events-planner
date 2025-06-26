import React, { useState } from 'react';
import EditTaskForm from './EditTaskForm';
import './TaskList.css';

const TaskList = ({ tasks, taskSummary, onTaskToggle, onTaskUpdate, onTaskDelete, loading }) => {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [processingTasks, setProcessingTasks] = useState(new Set());

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleTaskToggle = async (taskId) => {
    if (processingTasks.has(taskId)) return;
    try {
      setProcessingTasks(prev => new Set(prev).add(taskId));

      const response = await fetch(`http://localhost:5000/tasks/${taskId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const updatedTask = await response.json();
        if (onTaskToggle) onTaskToggle(updatedTask);
        if (onTaskUpdate) onTaskUpdate();
      } else {
        const errorData = await response.json();
        console.error('Failed to toggle task:', errorData.error);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    } finally {
      setProcessingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleEditTask = (taskId) => {
    setEditingTaskId(taskId);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:5000/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (onTaskDelete) onTaskDelete(taskId);
        if (onTaskUpdate) onTaskUpdate();
      } else {
        console.error('Failed to delete task.');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getPriorityIndicator = (priority) => {
    switch (priority) {
      case 'High':
        return { color: '#dc3545', icon: '🔴', text: 'High' };
      case 'Medium':
        return { color: '#ffc107', icon: '🟡', text: 'Medium' };
      case 'Low':
        return { color: '#28a745', icon: '🟢', text: 'Low' };
      default:
        return { color: '#6c757d', icon: '⚪', text: 'Unknown' };
    }
  };

  const isOverdue = (task) => {
    if (!task.due_date || task.completed) return false;
    return new Date(task.due_date) < new Date();
  };

  if (loading) {
    return (
      <div className="task-list-container">
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="task-list-container">
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h4>No Tasks Yet</h4>
          <p>Create your first task to start organizing this event!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-list-container">
      {/* Edit Mode */}
      {editingTaskId && (() => {
        const task = tasks.find(t => t.id === editingTaskId);
        if (!task) return null;
        return (
          <EditTaskForm
            task={task}
            eventId={task.event_id}
            onCancel={handleCancelEdit}
            onTaskUpdate={() => {
              handleCancelEdit();
              onTaskUpdate();
            }}
          />
        );
      })()}

      {/* Task Summary */}
      {!editingTaskId && taskSummary && (
        <div className="task-summary">
          <h3>Task Summary</h3>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-value">{taskSummary.completed}</span>
              <span className="stat-label">✅ Completed</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{taskSummary.pending}</span>
              <span className="stat-label">⏳ Pending</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{taskSummary.high_priority}</span>
              <span className="stat-label">🔴 High Priority</span>
            </div>
            <div className="stat-item total">
              <span className="stat-value">{taskSummary.total}</span>
              <span className="stat-label">Total Tasks</span>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="tasks-list">
        <h3>Tasks ({tasks.length})</h3>
        <div className="tasks-container">
          {tasks.map((task) => {
            const priorityInfo = getPriorityIndicator(task.priority);
            const overdue = isOverdue(task);
            const processing = processingTasks.has(task.id);

            return (
              <div
                key={task.id}
                className={`task-item ${task.completed ? 'completed' : 'pending'} ${overdue ? 'overdue' : ''}`}
              >
                <div className="task-header">
                  <button
                    className={`completion-toggle ${task.completed ? 'checked' : ''}`}
                    onClick={() => handleTaskToggle(task.id)}
                    disabled={processing}
                    title={task.completed ? 'Mark as pending' : 'Mark as completed'}
                  >
                    {processing ? '⏳' : (task.completed ? '✅' : '⭕')}
                  </button>

                  <div className="task-content">
                    <div className="task-description">
                      {task.description}
                    </div>

                    <div className="task-meta">
                      <span className="priority-badge" style={{ color: priorityInfo.color }}>
                        {priorityInfo.icon} {priorityInfo.text}
                      </span>

                      {task.assigned_to && (
                        <span className="assigned-to">👤 {task.assigned_to}</span>
                      )}

                      {task.due_date && (
                        <span className={`due-date ${overdue ? 'overdue' : ''}`}>
                          📅 {formatDate(task.due_date)}
                          {overdue && ' (Overdue)'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="task-actions">
                    <button onClick={() => handleEditTask(task.id)} disabled={processing}>Edit</button>
                    <button onClick={() => handleDeleteTask(task.id)} disabled={processing}>Delete</button>
                  </div>
                </div>

                <div className="task-footer">
                  <span className="created-date">
                    Created: {formatDate(task.created_at)}
                  </span>
                  {task.completed && (
                    <span className="completed-date">
                      Completed: {formatDate(task.updated_at)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TaskList;
