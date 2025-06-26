import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import './EditTaskForm.css';



/**
 * EditTaskForm Component
 * 
 * This component provides a form for editing existing tasks.
 * It's pre-populated with the current task data and sends updates to the backend.
 * 
 * Props:
 * - task: The task object to edit
 * - eventId: ID of the event this task belongs to
 * - onTaskUpdate: Callback function called when task is successfully updated
 * - onCancel: Callback function called when editing is cancelled
 * 
 * How it works:
 * 1. Pre-populates form fields with existing task data
 * 2. Validates form data using Yup schema
 * 3. Sends PATCH request to backend API on form submission
 * 4. Calls onTaskUpdate callback on successful update
 * 5. Handles errors and provides user feedback
 */

// Validation schema


const validationSchema = Yup.object({
  description: Yup.string()
    .required('Task description is required')
    .min(3, 'Description must be at least 3 characters')
    .max(500, 'Description must be less than 500 characters'),
  priority: Yup.string()
    .required('Priority is required')
    .oneOf(['Low', 'Medium', 'High'], 'Priority must be Low, Medium, or High'),
  assigned_to: Yup.string()
    .max(100, 'Assigned to must be less than 100 characters'),
  due_date: Yup.date()
    .nullable()
    .min(new Date(), 'Due date cannot be in the past')
});


const EditTaskForm = ({ task, eventId, onTaskUpdate, onCancel }) => {
  /**
   * Format date for input field (YYYY-MM-DDTHH:MM format)
   */
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // Format as YYYY-MM-DDTHH:MM for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      return '';
    }
  };

  /**
   * Initial form values from existing task
   */
  const initialValues = {
    description: task.description || '',
    priority: task.priority || 'Medium',
    assigned_to: task.assigned_to || '',
    due_date: formatDateForInput(task.due_date)
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      setStatus(null);
      
      // Prepare the data to send
      const taskData = {
        description: values.description.trim(),
        priority: values.priority,
        assigned_to: values.assigned_to.trim() || null,
        due_date: values.due_date || null,
        event_id: eventId
      };

      // Send PATCH request to update the task
      const response = await fetch(`http://localhost:5000/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        const updatedTask = await response.json();
        
        // Call the callback to update parent component
        if (onTaskUpdate) {
          onTaskUpdate(updatedTask);
        }
        
        setStatus({ type: 'success', message: 'Task updated successfully!' });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setStatus({ 
        type: 'error', 
        message: error.message || 'Failed to update task. Please try again.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="edit-task-form">
      <div className="form-header">
        <h4>Edit Task</h4>
        <button 
          type="button" 
          className="close-button"
          onClick={onCancel}
          title="Cancel editing"
        >
          ✕
        </button>
      </div>
      
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {({ isSubmitting, status }) => (
          <Form className="task-form">
            {/* Status Messages */}
            {status && (
              <div className={`status-message ${status.type}`}>
                {status.message}
              </div>
            )}

            {/* Task Description */}
            <div className="form-group">
              <label htmlFor="description">Task Description *</label>
              <Field
                as="textarea"
                id="description"
                name="description"
                placeholder="What needs to be done?"
                rows={3}
                className="form-control"
              />
              <ErrorMessage name="description" component="div" className="error-message" />
            </div>

            {/* Priority */}
            <div className="form-group">
              <label htmlFor="priority">Priority *</label>
              <Field
                as="select"
                id="priority"
                name="priority"
                className="form-control"
              >
                <option value="Low">🟢 Low</option>
                <option value="Medium">🟡 Medium</option>
                <option value="High">🔴 High</option>
              </Field>
              <ErrorMessage name="priority" component="div" className="error-message" />
            </div>

            {/* Assigned To */}
            <div className="form-group">
              <label htmlFor="assigned_to">Assigned To</label>
              <Field
                type="text"
                id="assigned_to"
                name="assigned_to"
                placeholder="Who is responsible for this task?"
                className="form-control"
              />
              <ErrorMessage name="assigned_to" component="div" className="error-message" />
            </div>

            {/* Due Date */}
            <div className="form-group">
              <label htmlFor="due_date">Due Date</label>
              <Field
                type="datetime-local"
                id="due_date"
                name="due_date"
                className="form-control"
              />
              <ErrorMessage name="due_date" component="div" className="error-message" />
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Task'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EditTaskForm;
