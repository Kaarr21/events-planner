import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import './NewTaskForm.css';

/**
 * NewTaskForm Component
 * 
 * This component allows users to create new tasks for an event.
 * It uses Formik for form management and Yup for validation.
 * 
 * Props:
 * - eventId: The ID of the event to create task for
 * - onTaskCreated: Callback function called when task is successfully created
 * - onCancel: Callback function called when user cancels task creation
 * 
 * How it works:
 * 1. Uses Formik for form state management and validation
 * 2. Validates required fields and field constraints
 * 3. Makes POST request to /tasks endpoint
 * 4. Displays success/error messages
 * 5. Calls parent callback on successful submission
 */

// Validation schema using Yup
const TaskValidationSchema = Yup.object().shape({
  description: Yup.string()
    .min(5, 'Description must be at least 5 characters')
    .max(500, 'Description must be less than 500 characters')
    .required('Description is required'),
  assigned_to: Yup.string()
    .max(100, 'Assigned to must be less than 100 characters'),
  priority: Yup.string()
    .oneOf(['High', 'Medium', 'Low'], 'Priority must be High, Medium, or Low')
    .required('Priority is required'),
  due_date: Yup.date()
    .min(new Date(), 'Due date must be in the future')
    .nullable()
});

const NewTaskForm = ({ eventId, onTaskCreated, onCancel }) => {
  // Initial form values
  const initialValues = {
    description: '',
    assigned_to: '',
    priority: 'Medium',
    due_date: '',
    completed: false
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (values, { setSubmitting, setStatus, resetForm }) => {
    try {
      setStatus(null);
      
      // Prepare data for API
      const taskData = {
        event_id: eventId,
        description: values.description.trim(),
        assigned_to: values.assigned_to.trim(),
        priority: values.priority,
        completed: values.completed
      };
      
      // Add due_date if provided
      if (values.due_date) {
        taskData.due_date = new Date(values.due_date).toISOString();
      }
      
      // Make API call
      const response = await fetch('http://localhost:5000/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        setStatus({ type: 'error', message: responseData.error || 'Failed to create task' });
        return;
      }
      
      // Success!
      setStatus({ type: 'success', message: 'Task created successfully!' });
      resetForm();
      
      // Call parent callback
      if (onTaskCreated) {
        onTaskCreated(responseData);
      }
      
    } catch (error) {
      console.error('Error creating task:', error);
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="new-task-form-container">
      <div className="form-header">
        <h3>Create New Task</h3>
        <p>Add a task to help organize this event</p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={TaskValidationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, status, values }) => (
          <Form className="new-task-form">
            {/* Status Messages */}
            {status && (
              <div className={`status-message ${status.type}`}>
                {status.type === 'success' && <span className="status-icon">✅</span>}
                {status.type === 'error' && <span className="status-icon">❌</span>}
                <span>{status.message}</span>
              </div>
            )}

            {/* Task Description */}
            <div className="form-group">
              <label htmlFor="description">
                Task Description <span className="required">*</span>
              </label>
              <Field
                as="textarea"
                id="description"
                name="description"
                placeholder="Describe what needs to be done..."
                rows="3"
                maxLength="500"
                disabled={isSubmitting}
              />
              <div className="character-count">
                {values.description.length}/500
              </div>
              <ErrorMessage name="description" component="div" className="field-error" />
            </div>

            {/* Assigned To */}
            <div className="form-group">
              <label htmlFor="assigned_to">
                Assigned To (Optional)
              </label>
              <Field
                type="text"
                id="assigned_to"
                name="assigned_to"
                placeholder="Who is responsible for this task?"
                maxLength="100"
                disabled={isSubmitting}
              />
              <ErrorMessage name="assigned_to" component="div" className="field-error" />
            </div>

            {/* Priority and Due Date Row */}
            <div className="form-row">
              {/* Priority */}
              <div className="form-group">
                <label htmlFor="priority">
                  Priority <span className="required">*</span>
                </label>
                <Field
                  as="select"
                  id="priority"
                  name="priority"
                  disabled={isSubmitting}
                >
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </Field>
                <ErrorMessage name="priority" component="div" className="field-error" />
              </div>

              {/* Due Date */}
              <div className="form-group">
                <label htmlFor="due_date">
                  Due Date (Optional)
                </label>
                <Field
                  type="datetime-local"
                  id="due_date"
                  name="due_date"
                  disabled={isSubmitting}
                />
                <ErrorMessage name="due_date" component="div" className="field-error" />
              </div>
            </div>

            {/* Completed Checkbox */}
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <Field
                  type="checkbox"
                  name="completed"
                  disabled={isSubmitting}
                />
                <span className="checkbox-text">Mark as completed</span>
              </label>
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
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default NewTaskForm;
