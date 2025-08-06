import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import ReviewModal from '../components/ReviewModal';

const ConnectionRequests = () => {
  const [requests, setRequests] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState({ open: false, userId: null });
  const [loadingRequests, setLoadingRequests] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/user/requests');
      if (res.data.status === 1) {
        // Sort received requests by rating descending
        const sortedReceived = res.data.data.received_requests.map(req => ({
          ...req,
          rating: parseFloat(req.rating) || 0
        })).sort((a, b) => b.rating - a.rating);
        
        // Sort sent requests by rating descending
        const sortedSent = res.data.data.sent_requests.map(req => ({
          ...req,
          rating: parseFloat(req.rating) || 0
        })).sort((a, b) => b.rating - a.rating);
        
        setRequests({
          sent: sortedSent,
          received: sortedReceived
        });
      } else {
        toast.error(res.data.response || 'Failed to load connection requests');
      }
    } catch (err) {
      toast.error(err.response?.data?.response || 'API Error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId, action, index, type) => {
    try {
      // Set loading state for this specific request
      setLoadingRequests(prev => ({
        ...prev,
        [`${type}-${index}`]: action
      }));

      const res = await axiosInstance.post('/user/update-request', {
        request_id: requestId,
        status: action
      });

      if (res.data.status === 1) {
        toast.success(res.data.response || 'Request updated successfully');
        fetchRequests();
      } else {
        toast.error(res.data.response || 'Failed to update request');
      }
    } catch (err) {
      toast.error(err.response?.data?.response || 'API Error');
    } finally {
      // Clear loading state after 500ms to allow animation to complete
      setTimeout(() => {
        setLoadingRequests(prev => {
          const newState = {...prev};
          delete newState[`${type}-${index}`];
          return newState;
        });
      }, 500);
    }
  };

  const handleCompleteRequest = async (requestId, index, type) => {
    try {
      // Set loading state for this specific request
      setLoadingRequests(prev => ({
        ...prev,
        [`${type}-${index}`]: 'Completing'
      }));

      const res = await axiosInstance.post('/user/update-request', {
        request_id: requestId,
        status: 'Completed'
      });

      if (res.data.status === 1) {
        toast.success('Connection marked as completed');
        fetchRequests();
      } else {
        toast.error(res.data.response || 'Failed to complete request');
      }
    } catch (err) {
      toast.error(err.response?.data?.response || 'API Error');
    } finally {
      // Clear loading state after 500ms to allow animation to complete
      setTimeout(() => {
        setLoadingRequests(prev => {
          const newState = {...prev};
          delete newState[`${type}-${index}`];
          return newState;
        });
      }, 500);
    }
  };

  const handleReviewSubmit = async ({ rating, comment }) => {
    try {
      const res = await axiosInstance.post('/user/submit-review', {
        user_id: reviewModal.userId,
        connection_request_id: reviewModal.connectionRequestId,
        rating,
        comment
      });

      if (res.data.status === 1) {
        toast.success('Review submitted');

        // Update local state to hide the button
        setRequests(prev => {
          const updatedSent = prev.sent.map(req =>
            req.id === reviewModal.connectionRequestId
              ? { ...req, reviewSubmittedByMe: true }
              : req
          );

          const updatedReceived = prev.received.map(req =>
            req.id === reviewModal.connectionRequestId
              ? { ...req, reviewSubmittedByMe: true }
              : req
          );

          return {
            sent: updatedSent,
            received: updatedReceived
          };
        });

        setReviewModal({ open: false, userId: null, connectionRequestId: null });
      } else {
        toast.error(res.data.response || 'Failed to submit review');
      }
    } catch (err) {
      toast.error(err.response?.data?.response || 'API Error');
    }
  };

  const handleStartChat = async (otherUserId) => {
    try {
      const threadRes = await axiosInstance.get(`/chat/thread/${otherUserId}`);
      if (threadRes.data.status === 1 && threadRes.data.data) {
        navigate(`/chat/${otherUserId}`, {
          state: { threadId: threadRes.data.data.id }
        });
      } else {
        const createRes = await axiosInstance.post('/chat/create-thread', {
          participant_id: otherUserId
        });

        if (createRes.data.status === 1) {
          navigate(`/chat/${otherUserId}`, {
            state: { threadId: createRes.data.data.id }
          });
        } else {
          throw new Error(createRes.data.response || 'Failed to create chat thread');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to start chat');
    }
  };

  const renderRequestItem = (request, type, index) => {
    const isSent = type === 'sent';
    const otherUser = isSent ? request.receiver_name : request.requester_name;
    const otherUserImage = isSent ? request.receiver_image : request.requester_image;
    const otherUserId = isSent ? request.receiver_id : request.requester_id;
    const loadingKey = `${type}-${index}`;
    const currentAction = loadingRequests[loadingKey];

    return (
      <div key={request.id} className="bg-white shadow rounded p-4 mb-4">
        <div className="flex items-center gap-4">
          <img
            src={otherUserImage || '/default-avatar.png'}
            alt="Profile"
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h4 className="font-bold">{otherUser}</h4>
            <p className="text-sm text-gray-600">
              Status:{' '}
              <span
                className={`font-semibold ${
                  request.status === 'Accepted'
                    ? 'text-green-600'
                    : request.status === 'Rejected'
                    ? 'text-red-600'
                    : request.status === 'Completed'
                    ? 'text-blue-600'
                    : 'text-yellow-600'
                }`}
              >
                {request.status}
              </span>
            </p>
            <p className="text-xs text-gray-500">
              {new Date(request.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {isSent && request.status === 'Pending' && (
            <button
              onClick={() => handleRequestAction(request.id, 'Cancelled', index, type)}
              disabled={!!currentAction}
              className={`bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 ${
                currentAction ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {currentAction === 'Cancelled' ? 'Cancelling...' : 'Cancel Request'}
            </button>
          )}

          {!isSent && request.status === 'Pending' && (
            <>
              <button
                onClick={() => handleRequestAction(request.id, 'Accepted', index, type)}
                disabled={!!currentAction}
                className={`bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 ${
                  currentAction ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {currentAction === 'Accepted' ? 'Accepting...' : 'Accept'}
              </button>
              <button
                onClick={() => handleRequestAction(request.id, 'Rejected', index, type)}
                disabled={!!currentAction}
                className={`bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 ${
                  currentAction ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {currentAction === 'Rejected' ? 'Rejecting...' : 'Reject'}
              </button>
            </>
          )}

          {request.status === 'Accepted' && (
            <>
              <button
                onClick={() => handleStartChat(otherUserId)}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                Chat
              </button>
              <button
                onClick={() => handleCompleteRequest(request.id, index, type)}
                disabled={!!currentAction}
                className={`bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 ${
                  currentAction ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {currentAction === 'Completing' ? 'Completing...' : 'Close Request'}
              </button>
            </>
          )}

          {request.status === 'Completed' && !request.reviewSubmittedByMe && (
            <button
              onClick={() =>
                setReviewModal({
                  open: true,
                  userId: otherUserId,
                  connectionRequestId: request.id
                })
              }
              className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
            >
              Review
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Connection Requests</h1>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Received Requests ({requests.received.length})</h2>
              {requests.received.length > 0 ? (
                requests.received.map((request, index) => 
                  renderRequestItem(request, 'received', index)
                )
              ) : (
                <p className="text-gray-500">No received requests</p>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Sent Requests ({requests.sent.length})</h2>
              {requests.sent.length > 0 ? (
                requests.sent.map((request, index) => 
                  renderRequestItem(request, 'sent', index)
                )
              ) : (
                <p className="text-gray-500">No sent requests</p>
              )}
            </div>
          </div>
        )}
      </div>

      <ReviewModal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ open: false, userId: null })}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
};

export default ConnectionRequests;