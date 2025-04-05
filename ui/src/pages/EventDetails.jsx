/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getEventById, getEventActivities, createEventActivity } from '../api/api';
import {containerStyles} from './style';

const EventDetails = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getEventById(eventId), getEventActivities(eventId)])
      .then(([eventData, activitiesData]) => {
        setEvent(eventData);
        setActivities(activitiesData);
      })
      .catch((err) => setError(err.message || 'خطا در بارگذاری'));
  }, [eventId]);

  const handleAddActivity = async () => {
    try {
      const newActivity = await createEventActivity(eventId, { name: 'فعالیت جدید', description: '' });
      setActivities([...activities, newActivity]);
    } catch (err) {
      setError(err.message || 'خطا در افزودن فعالیت');
    }
  };

  if (error) return <div className="text-center text-red-500 mt-20">{error}</div>;
  if (!event) return <div className="text-center mt-20">در حال بارگذاری...</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{event.name}</h1>
          <p className="mt-4 text-gray-600">{event.description || 'بدون توضیحات'}</p>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">فعالیت‌ها</h2>
          <button
            onClick={handleAddActivity}
            className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition"
          >
            افزودن فعالیت
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 text-right">نام</th>
                <th className="p-3 text-right">توضیحات</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{activity.name}</td>
                  <td className="p-3">{activity.description || 'بدون توضیحات'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;