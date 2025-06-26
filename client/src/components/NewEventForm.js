import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

/**
 * NewEventForm component for creating new events
 * 
 * Key concepts:
 * - Formik: Popular form library for React that handles form state, validation, and submission
 * - Yup: Schema validation library that works well with Formik
 * - useNavigate: React Router hook for programmatic navigation
 */
const NewEventForm = () => {
  const navigate = useNavigate();                  // Hook for navigation
  const [submitError, setSubmitError] = useState(null);  // Track submission errors

  /**
   * Initial form values
   * Formik uses this object to initialize form fields
   */
  const initialValues = {
    title: '',
    description: '',
    location: '',
    date: '',
  };

  /**
   * Yup validation schema
   * Defines validation rules for each form field
   */
  const validationSchema = Yup.object({
    title: Yup.string()
      .required('Title is required')
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title must be less than 200 characters'),
    
    description: Yup.string()
      .max(1000, 'Description must be less than 1000 characters'),
    
    location: Yup.string()
      .max(300, 'Location must be less than 300 characters'),
    
    date: Yup.date()
      .required('Date is required')
      .min(new Date(), 'Date must be in the future')
      .typeError('Please enter a valid date'),
  });

  /**
   * Handle form submission
   * This function is called when form is valid and submitted
   */
  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      setSubmitError(null);
      
      // Prepare data for API
      const eventData = {
        title: values.title,
        description: values.description,
        location: values.location,
        date: new Date(values.date).toISOString(), // Convert to ISO format
      };
      
      // Make POST request to Flask API
      const response = await fetch('http://localhost:5000/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        // Handle HTTP errors
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }
      
      // Success - parse response and navigate
      const createdEvent = await response.json();
      console.log('Event created successfully:', createdEvent);
      
      // Navigate back to events list
      navigate('/', { 
        state: { 
          message: 'Event created successfully!',
          type: 'success'
        }
      });
      
    } catch (error) {
      console.error('Error creating event:', error);
      
      // Set error for display
      setSubmitError(error.message || 'Failed to create event. Please try again.');
      
      // Handle specific field errors if provided by API
      if (error.message.includes('title')) {
        setFieldError('title', error.message);
      } else if (error.message.includes('date')) {
        setFieldError('date', error.message);
      }
      
    } finally {
      setSubmitting(false); // Re-enable submit button
    }
  };

  return (
    <div className="new-event-form-page">
      <div className="form-container">
        <div className="form-header">
          <h1>Create New Event</h1>
          <p>Fill in the details below to create your event</p>
        </div>

        {/* Formik component wraps the entire form */}
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, touched, errors }) => (
            <Form className="event-form">
              {/* Display general submission error */}
              {submitError && (
                <div className="error-banner">
                  <strong>Error:</strong> {submitError}
                </div>
              )}

              {/* Title Field */}
              <div className="form-group">
                <label htmlFor="title">
                  Event Title <span className="required">*</span>
                </label>
                <Field
                  type="text"
                  id="title"
                  name="title"
                  placeholder="Enter event title"
                  className={`form-control ${
                    touched.title && errors.title ? 'error' : ''
                  }`}
                />
                <ErrorMessage name="title" component="div" className="field-error" />
              </div>

              {/* Description Field */}
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <Field
                  as="textarea"
                  id="description"
                  name="description"
                  placeholder="Describe your event (optional)"
                  rows="4"
                  className={`form-control ${
                    touched.description && errors.description ? 'error' : ''
                  }`}
                />
                <ErrorMessage name="description" component="div" className="field-error" />
              </div>

              {/* Location Field */}
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <Field
                  type="text"
                  id="location"
                  name="location"
                  placeholder="Where will the event take place?"
                  className={`form-control ${
                    touched.location && errors.location ? 'error' : ''
                  }`}
                />
                <ErrorMessage name="location" component="div" className="field-error" />
              </div>

              {/* Date Field */}
              <div className="form-group">
                <label htmlFor="date">
                  Event Date & Time <span className="required">*</span>
                </label>
                <Field
                  type="datetime-local"
                  id="date"
                  name="date"
                  className={`form-control ${
                    touched.date && errors.date ? 'error' : ''
                  }`}
                />
                <ErrorMessage name="date" component="div" className="field-error" />
                <small className="field-help">
                  Select when your event will take place
                </small>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => navigate('/')}
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
                  {isSubmitting ? 'Creating Event...' : 'Create Event'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default NewEventForm;
