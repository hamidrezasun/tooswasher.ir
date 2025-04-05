/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getEvents, createEvent, createEventActivity, getUserProfile, getAllUsers } from '../api/api';
import { isAuthenticated } from '../api/auth';
import { containerStyles } from './style';
import moment from 'jalali-moment';

const popupStyles = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const popupContentStyles = css`
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 500px;
  direction: rtl;
`;

const Events = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    priority: '',
    deadline: '',
    status: true,
    special: '',
    attach: '',
    staff_ids: [],
    viewer_ids: [],
  });
  const [users, setUsers] = useState([]); // Only populated for admins
  const [staffSearch, setStaffSearch] = useState('');
  const [viewerSearch, setViewerSearch] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isAuthenticated()) throw new Error('لطفاً وارد شوید');
        
        const user = await getUserProfile();
        setCurrentUser(user);

        const eventsData = await getEvents();
        setEvents(eventsData || []);

        // Fetch users only if admin
        if (user.role === 'admin') {
          const allUsers = await getAllUsers();
          setUsers(allUsers || []);
        }
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری داده‌ها');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddEvent = async () => {
    if (currentUser?.role !== 'admin') {
      setError('فقط مدیران می‌توانند رویداد اضافه کنند.');
      return;
    }
    try {
      let gregorianDeadline = null;
      if (formData.deadline) {
        const shamsiDate = moment(formData.deadline, 'jYYYY-jMM-jDD');
        if (!shamsiDate.isValid()) throw new Error('فرمت تاریخ شمسی نامعتبر است (مثال: 1403-12-20)');
        gregorianDeadline = shamsiDate.format('YYYY-MM-DD');
      }

      const preparedData = {
        subject: formData.subject,
        priority: parseInt(formData.priority),
        deadline: gregorianDeadline,
        status: formData.status,
        special: formData.special || null,
        attach: formData.attach || null,
        staff_ids: formData.staff_ids.map(Number),
        viewer_ids: formData.viewer_ids.map(Number),
      };
      const newEvent = await createEvent(preparedData);
      setEvents([...events, newEvent]);
      setShowAddPopup(false);
      setFormData({
        subject: '',
        priority: '',
        deadline: '',
        status: true,
        special: '',
        attach: '',
        staff_ids: [],
        viewer_ids: [],
      });
      setError(null);
    } catch (err) {
      if (err.response?.status === 422) {
        const validationErrors = err.response.data.detail;
        const errorMessage = validationErrors
          .map((e) => `خطا در ${e.loc.join(' -> ')}: ${e.msg}`)
          .join(', ');
        setError(errorMessage || 'خطا در افزودن رویداد: داده‌ها نامعتبر است');
      } else {
        setError(err.message || 'خطا در افزودن رویداد');
      }
    }
  };

  const handleEventActivity = async (eventId) => {
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) throw new Error('رویداد یافت نشد');

      if (currentUser?.role === 'staff') {
        const isStaff = event.staff?.some(s => s.id === currentUser.id);
        const isViewer = event.viewers?.some(v => v.id === currentUser.id);
        if (!isStaff && !isViewer) {
          setError('شما فقط در صورتی می‌توانید فعالیت اضافه کنید که کارمند یا ناظر این رویداد باشید.');
          return;
        }
      }

      await createEventActivity(eventId, { content: 'فعالیت جدید', important: false });
      const updatedEvents = await getEvents();
      setEvents(updatedEvents);
      setError(null);
    } catch (err) {
      setError(err.message || 'خطا در افزودن فعالیت به رویداد');
    }
  };

  const filteredStaffUsers = users
    .filter(user => user.role === 'staff' && user.username.toLowerCase().includes(staffSearch.toLowerCase()));

  const filteredViewerUsers = users
    .filter(user => ['staff', 'admin'].includes(user.role) && user.username.toLowerCase().includes(viewerSearch.toLowerCase()));

  if (loading) return <div css={containerStyles}>در حال بارگذاری...</div>;
  if (error && !showAddPopup) return <div css={containerStyles} className="text-red-500 text-center mt-20">{error}</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">رویدادها</h1>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setShowAddPopup(true)}
              className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition"
            >
              افزودن رویداد
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 text-right">موضوع</th>
                <th className="p-3 text-right">اولویت</th>
                <th className="p-3 text-right">اقدامات</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-3">{event.subject || 'بدون عنوان'}</td>
                  <td className="p-3">{event.priority || 'بدون اولویت'}</td>
                  <td className="p-3">
                    {(currentUser?.role === 'admin' || 
                      (currentUser?.role === 'staff' && 
                        (event.staff?.some(s => s.id === currentUser.id) || 
                         event.viewers?.some(v => v.id === currentUser.id)))) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventActivity(event.id);
                        }}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        افزودن فعالیت
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showAddPopup && currentUser?.role === 'admin' && (
        <div css={popupStyles} onClick={() => { setShowAddPopup(false); setError(null); }}>
          <div css={popupContentStyles} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">افزودن رویداد جدید</h3>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <form onSubmit={(e) => { e.preventDefault(); handleAddEvent(); }}>
              <input
                type="text"
                placeholder="موضوع"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
                required
              />
              <input
                type="number"
                placeholder="اولویت (عدد)"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
                min="1"
                required
              />
              <input
                type="text"
                placeholder="مهلت (اختیاری، به فرمت شمسی: 1403-12-20)"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value === 'true' })}
                className="w-full p-2 mb-4 border rounded"
              >
                <option value="true">فعال</option>
                <option value="false">غیرفعال</option>
              </select>
              <input
                type="text"
                placeholder="ویژه (اختیاری)"
                value={formData.special}
                onChange={(e) => setFormData({ ...formData, special: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
              />
              <input
                type="text"
                placeholder="پیوست (اختیاری، URL یا متن)"
                value={formData.attach}
                onChange={(e) => setFormData({ ...formData, attach: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
              />
              <input
                type="text"
                placeholder="جستجوی کارکنان..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="w-full p-2 mb-2 border rounded"
              />
              <select
                multiple
                value={formData.staff_ids}
                onChange={(e) => setFormData({ ...formData, staff_ids: Array.from(e.target.selectedOptions, option => parseInt(option.value)) })}
                className="w-full p-2 mb-4 border rounded"
              >
                {filteredStaffUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="جستجوی بازدیدکنندگان..."
                value={viewerSearch}
                onChange={(e) => setViewerSearch(e.target.value)}
                className="w-full p-2 mb-2 border rounded"
              />
              <select
                multiple
                value={formData.viewer_ids}
                onChange={(e) => setFormData({ ...formData, viewer_ids: Array.from(e.target.selectedOptions, option => parseInt(option.value)) })}
                className="w-full p-2 mb-4 border rounded"
              >
                {filteredViewerUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role})
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  ذخیره
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddPopup(false); setError(null); }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  لغو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;