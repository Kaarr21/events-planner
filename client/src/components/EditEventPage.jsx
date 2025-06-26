// components/EditEventPage.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EditEventForm from './EditEventForm';

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleUpdated = () => {
    navigate(`/events/${id}`);
  };

  const handleCancel = () => {
    navigate(`/events/${id}`);
  };

  return (
    <div className="container">
      <EditEventForm eventId={id} onEventUpdated={handleUpdated} onCancel={handleCancel} />
    </div>
  );
};

export default EditEventPage;
