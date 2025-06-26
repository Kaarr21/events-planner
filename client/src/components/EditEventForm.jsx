import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

/**
 * EditEventForm component for editing existing events
 * 
 * Key concepts:
 * - Formik: Popular form library for React that handles form state, validation, and submission
 * - Yup: Schema validation library that works well with Formik
 * - Accepts eventId as a prop and onEventUpdated callback for parent component communication
 */
const EditEventForm = ({ eventId, onEventUpdated, onCancel }) => {
  const [submitError, setSubmitError] = useState(null);  // Track submission errors
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    // Fetch existing event details
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/events/${eventId}`);
        if (response.ok) {
          const eventData = await response.json();
          setInitialValues({
            title: eventData.title,
            description: eventData.description,
            location: eventData.location,
            date: new Date(eventData.date).toISOString().slice(0, 16),
          });
        } else {
          throw new Error('Failed to fetch event details');
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        setSubmitError('Failed to load event data.');
      }
    };
    fetchEventDetails();
  }, [eventId]);

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

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      setSubmitError(null);
      const eventData = {
        title: values.title,
        description: values.description,
        location: values.location,
        date: new Date(values.date).toISOString(),
      };

      const response = await fetch(`http://localhost:5000/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event');
      }

      const updatedEvent = await response.json();
      console.log('Event updated successfully:', updatedEvent);

      // Call the callback to notify parent component
      if (onEventUpdated) {
        onEventUpdated(updatedEvent);
      }

    } catch (error) {
      console.error('Error updating event:', error);
      setSubmitError(error.message || 'Failed to update event. Please try again.');
      if (error.message.includes('title')) {
        setFieldError('title', error.message);
      } else if (error.message.includes('date')) {
        setFieldError('date', error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!initialValues) return <div>Loading event data...</div>;

  return (
    <div className="edit-event-form-page">
      <div className="form-container">
        <div className="form-header">
          <h1>Edit Event</h1>
          <p>Modify the details below to update your event</p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, touched, errors }) => (
            <Form className="event-form">
              {submitError && (
                <div className="error-banner">
                  <strong>Error:</strong> {submitError}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="title">
                  Event Title <span className="required">*</span>
                </label>
                <Field
                  type="text"
                  id="title"
                  name="title"
                  placeholder="Enter event title"
                  className={`form-control ${touched.title && errors.title ? 'error' : ''}`}
                />
                <ErrorMessage name="title" component="div" className="field-error" />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <Field
                  as="textarea"
                  id="description"
                  name="description"
                  placeholder="Describe your event (optional)"
                  rows="4"
                  className={`form-control ${touched.description && errors.description ? 'error' : ''}`}
                />
                <ErrorMessage name="description" component="div" className="field-error" />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <Field
                  type="text"
                  id="location"
                  name="location"
                  placeholder="Where will the event take place?"
                  className={`form-control ${touched.location && errors.location ? 'error' : ''}`}
                />
                <ErrorMessage name="location" component="div" className="field-error" />
              </div>

              <div className="form-group">
                <label htmlFor="date">
                  Event Date & Time <span className="required">*</span>
                </label>
                <Field
                  type="datetime-local"
                  id="date"
                  name="date"
                  className={`form-control ${touched.date && errors.date ? 'error' : ''}`}
                />
                <ErrorMessage name="date" component="div" className="field-error" />
                <small className="field-help">
                  Select when your event will take place
                </small>
              </div>

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
                  {isSubmitting ? 'Updating Event...' : 'Update Event'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default EditEventForm;
