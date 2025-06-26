import React, { useState } from 'react';
import './RSVPForm.css';

/**
 * RSVPForm Component
 * 
 * This component allows users to RSVP to an event.
 * It uses React hooks for state management and form handling.
 * 
 * Props:
 * - eventId: The ID of the event to RSVP to
 * - onRSVPSuccess: Callback function called when RSVP is successful
 * - onRSVPUpdate: Callback function to update parent component state
 * 
 * How it works:
 * 1. Uses useState to manage form data, loading states, and error messages
 * 2. Handles form submission with client-side validation
 * 3. Makes POST request to /rsvps endpoint
 * 4. Displays success/error messages
 * 5. Calls parent callback on successful submission
 */

const RSVPForm = ({ eventId, onRSVPSuccess, onRSVPUpdate }) => {
  // Form state management
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    rsvp_status: '',
    note_to_host: ''
  });
  
  // UI state management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  /**
   * Handle input changes
   * Updates form data state when user types in form fields
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Client-side form validation
   * Validates form data before submission
   */
  const validateForm = () => {
    const errors = {};
    
    // Validate guest name
    if (!formData.guest_name.trim()) {
      errors.guest_name = 'Name is required';
    } else if (formData.guest_name.trim().length < 2) {
      errors.guest_name = 'Name must be at least 2 characters';
    }
    
    // Validate email
    if (!formData.guest_email.trim()) {
      errors.guest_email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.guest_email.trim())) {
        errors.guest_email = 'Please enter a valid email address';
      }
    }
    
    // Validate RSVP status
    if (!formData.rsvp_status) {
      errors.rsvp_status = 'Please select your RSVP status';
    }
    
    // Validate note length (optional field)
    if (formData.note_to_host && formData.note_to_host.length > 500) {
      errors.note_to_host = 'Note must be less than 500 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   * Processes the RSVP form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset previous states
    setSubmitError(null);
    setSubmitSuccess(false);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data for API
      const rsvpData = {
        event_id: eventId,
        guest_name: formData.guest_name.trim(),
        guest_email: formData.guest_email.trim().toLowerCase(),
        rsvp_status: formData.rsvp_status,
        note_to_host: formData.note_to_host.trim()
      };
      
      // Make API call
      const response = await fetch('http://localhost:5000/rsvps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rsvpData)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        // Handle different types of errors
        if (response.status === 409) {
          setSubmitError('You have already RSVP\'d to this event. Each email can only RSVP once.');
        } else if (response.status === 404) {
          setSubmitError('Event not found. Please try again.');
        } else {
          setSubmitError(responseData.error || 'Failed to submit RSVP. Please try again.');
        }
        return;
      }
      
      // Success!
      setSubmitSuccess(true);
      setFormData({
        guest_name: '',
        guest_email: '',
        rsvp_status: '',
        note_to_host: ''
      });
      
      // Call parent callbacks
      if (onRSVPSuccess) {
        onRSVPSuccess(responseData);
      }
      
      if (onRSVPUpdate) {
        onRSVPUpdate();
      }
      
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset form to initial state
   */
  const handleReset = () => {
    setFormData({
      guest_name: '',
      guest_email: '',
      rsvp_status: '',
      note_to_host: ''
    });
    setValidationErrors({});
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  return (
    <div className="rsvp-form-container">
      <div className="rsvp-form-header">
        <h3>RSVP to This Event</h3>
        <p>Let us know if you'll be attending!</p>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="success-message">
          <div className="success-icon">✅</div>
          <div>
            <strong>RSVP Submitted Successfully!</strong>
            <p>Thank you for your response. We look forward to seeing you at the event!</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="error-message">
          <div className="error-icon">❌</div>
          <div>
            <strong>Error</strong>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      {/* RSVP Form */}
      <form onSubmit={handleSubmit} className="rsvp-form">
        {/* Guest Name Field */}
        <div className="form-group">
          <label htmlFor="guest_name">
            Your Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="guest_name"
            name="guest_name"
            value={formData.guest_name}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            className={validationErrors.guest_name ? 'error' : ''}
            disabled={isSubmitting || submitSuccess}
          />
          {validationErrors.guest_name && (
            <div className="field-error">{validationErrors.guest_name}</div>
          )}
        </div>

        {/* Guest Email Field */}
        <div className="form-group">
          <label htmlFor="guest_email">
            Email Address <span className="required">*</span>
          </label>
          <input
            type="email"
            id="guest_email"
            name="guest_email"
            value={formData.guest_email}
            onChange={handleInputChange}
            placeholder="Enter your email address"
            className={validationErrors.guest_email ? 'error' : ''}
            disabled={isSubmitting || submitSuccess}
          />
          {validationErrors.guest_email && (
            <div className="field-error">{validationErrors.guest_email}</div>
          )}
        </div>

        {/* RSVP Status Field */}
        <div className="form-group">
          <label htmlFor="rsvp_status">
            Will you attend? <span className="required">*</span>
          </label>
          <div className="rsvp-options">
            {['Yes', 'No', 'Maybe'].map((option) => (
              <label key={option} className="radio-option">
                <input
                  type="radio"
                  name="rsvp_status"
                  value={option}
                  checked={formData.rsvp_status === option}
                  onChange={handleInputChange}
                  disabled={isSubmitting || submitSuccess}
                />
                <span className={`radio-label ${option.toLowerCase()}`}>
                  {option === 'Yes' && '✅'} 
                  {option === 'No' && '❌'} 
                  {option === 'Maybe' && '🤔'} 
                  {option}
                </span>
              </label>
            ))}
          </div>
          {validationErrors.rsvp_status && (
            <div className="field-error">{validationErrors.rsvp_status}</div>
          )}
        </div>

        {/* Note to Host Field */}
        <div className="form-group">
          <label htmlFor="note_to_host">
            Note to Host (Optional)
          </label>
          <textarea
            id="note_to_host"
            name="note_to_host"
            value={formData.note_to_host}
            onChange={handleInputChange}
            placeholder="Any special requests, dietary restrictions, or messages..."
            rows="3"
            maxLength="500"
            className={validationErrors.note_to_host ? 'error' : ''}
            disabled={isSubmitting || submitSuccess}
          />
          <div className="character-count">
            {formData.note_to_host.length}/500
          </div>
          {validationErrors.note_to_host && (
            <div className="field-error">{validationErrors.note_to_host}</div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          {!submitSuccess ? (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Reset
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary"
            >
              Submit Another RSVP
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default RSVPForm;
