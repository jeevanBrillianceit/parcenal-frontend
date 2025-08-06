import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import io from 'socket.io-client';
import axiosInstance from '../utils/axiosInstance';
import { isTokenValid } from '../utils/auth.helper';
import { useParams, useLocation } from 'react-router-dom';

const ChatPage = () => {
  const socketRef = useRef(null);
  const messagesEndRef = useRef();
  const typingTimeoutRef = useRef();
  const { userId } = useParams();
  const location = useLocation();

  const [users, setUsers] = useState([]);
  const [threadId, setThreadId] = useState(location.state?.threadId || null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionError, setConnectionError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState({});

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const FileIcon = ({ type, fileName }) => {
    const getIcon = () => {
      if (!type && fileName) {
        // Fallback to check file extension if type isn't available
        const extension = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return '🖼️';
        if (extension === 'pdf') return '📄';
        if (['doc', 'docx'].includes(extension)) return '📝';
        if (['xls', 'xlsx'].includes(extension)) return '📊';
      }
      
      if (type) {
        if (type.includes('image')) return '🖼️';
        if (type.includes('pdf')) return '📄';
        if (type.includes('word')) return '📝';
        if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
      }
      
      return '📁'; // Default file icon
    };

    return <span className="text-2xl">{getIcon()}</span>;
  };

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Initialize socket connection with robust error handling
  useEffect(() => {
    if (!isTokenValid()) {
      setConnectionError('Authentication token is invalid');
      return;
    }

    const initializeSocket = () => {
      console.log('Initializing socket connection...');
      
      if (socketRef.current) {
        console.log('Disconnecting existing socket...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      try {
        socketRef.current = io(process.env.REACT_APP_SOCKET_URL, {
          auth: { token: currentUser?.token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          randomizationFactor: 0.5,
          timeout: 20000,
          path: '/socket.io',
          withCredentials: true
        });

        socketRef.current.on('new_message', (msg) => {
          // Update the user list to show new message
          setUsers(prev => prev.map(u => 
            u.user_id === msg.sender_id ? 
            { ...u, lastMessage: msg.content, lastMessageTime: msg.created_at } : 
            u
          ).sort((a, b) => 
            new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)
          ));
          
          // If this message is for the current thread, add it
          if (msg.threadId === threadId) {
            handleMessage(msg);
          }
        });

        // Connection handlers
        socketRef.current.on('connect', () => {
          socketRef.current.emit('joinUser', { userId: currentUser.id });

          console.log('Socket connected with ID:', socketRef.current.id);
          setConnectionStatus('connected');
          setConnectionError(null);
          fetchUsers(); // Refresh user list on reconnect

          if (threadId) {
            socketRef.current.emit('joinThread', { threadId }, (ack) => {
              if (ack?.error) {
                console.error('Failed to rejoin thread on reconnect:', ack.error);
              }
            });
          }
        });

        socketRef.current.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          setConnectionStatus('disconnected');
          if (reason === 'io server disconnect') {
            // The server forcibly disconnected the socket, need to manually reconnect
            setTimeout(initializeSocket, 1000);
          }
        });

        socketRef.current.on('connect_error', (err) => {
          console.error('Socket connection error:', err.message);
          setConnectionStatus('error');
          setConnectionError(err.message);
          setTimeout(initializeSocket, 5000); // Reconnect after 5 seconds
        });

        socketRef.current.on('error', (err) => {
          console.error('Socket error:', err);
          setConnectionError(err.message);
        });

      } catch (err) {
        console.error('Socket initialization error:', err);
        setConnectionError(err.message);
        setTimeout(initializeSocket, 5000);
      }
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection...');
        socketRef.current.disconnect();
      }
    };
  }, [currentUser?.token]);

  // Fetch users list with retry logic
  const fetchUsers = useCallback(async () => {
    try {
      console.log('Fetching user list...');
      const res = await axiosInstance.get('/user/requests');
      
      console.log('Connection requests response:', res.data);

      if (res.data.status === 1) {
        const acceptedConnections = [
          ...res.data.data.sent_requests.filter(r => r.status === 'Accepted' || r.status === 'Completed'),
          ...res.data.data.received_requests.filter(r => r.status === 'Accepted' || r.status === 'Completed')
        ];
        
        console.log('Accepted connections:', acceptedConnections);

        const uniqueUsersMap = {};

        for (const conn of acceptedConnections) {
          const otherUserId = conn.requester_id === currentUser.id 
            ? conn.receiver_id 
            : conn.requester_id;

          if (uniqueUsersMap[otherUserId]) continue;

          const threadRes = await axiosInstance.get(`/chat/thread/${otherUserId}`);
          const threadId = threadRes.data?.data?.id;

          let lastMessage = null;
          if (threadId) {
            const messagesRes = await axiosInstance.get(`/chat/messages/${threadId}?limit=1`);
            lastMessage = messagesRes.data?.data?.[0] || null;
          }

          uniqueUsersMap[otherUserId] = {
            user_id: otherUserId,
            name: conn.requester_id === currentUser.id 
              ? conn.receiver_name 
              : conn.requester_name,
            profile_image: conn.requester_id === currentUser.id 
              ? conn.receiver_image 
              : conn.requester_image,
            lastMessage: lastMessage?.content,
            lastMessageTime: lastMessage?.created_at,
            threadId
          };
        }

        const usersWithMessages = Object.values(uniqueUsersMap).sort(
          (a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)
        );

        setUsers(usersWithMessages);
        
        if (userId) {
          const userToSelect = usersWithMessages.find(u => u.user_id === parseInt(userId));
          if (userToSelect) {
            selectUser(userToSelect);
          }
        }
      } else {
        throw new Error(res.data.response || 'Failed to load connections');
      }
    } catch (err) {
      console.error('Error fetching user list:', err);
      setTimeout(fetchUsers, 5000);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, userId]);

  useEffect(() => {
    if (!isTokenValid()) return;
    fetchUsers();
  }, [fetchUsers]);

  // Enhanced message handler with file upload tracking
  const handleMessage = useCallback((msg) => {
    console.log('Handling incoming message:', msg);
    if (!msg?.content || !msg?.sender_id) {
      console.warn('Invalid message received:', msg);
      return;
    }

    // Remove from uploading files if it was a temp file
    if (msg.tempId && uploadingFiles[msg.tempId]) {
      setUploadingFiles(prev => {
        const newState = {...prev};
        delete newState[msg.tempId];
        return newState;
      });
    }

    setMessages(prev => {
      const existingIndex = prev.findIndex(m => 
        (m.id && m.id === msg.id) || 
        (m.tempId && msg.tempId && m.tempId === msg.tempId)
      );

      if (existingIndex >= 0) {
        const newMessages = [...prev];
        newMessages[existingIndex] = {
          ...newMessages[existingIndex],
          id: msg.id || newMessages[existingIndex].id,
          tempId: undefined,
          content: msg.content,
          message_type: msg.message_type || 'text',
          is_read: msg.is_read || false,
          created_at: msg.created_at || new Date().toISOString(),
          ...(msg.fileInfo && { fileInfo: msg.fileInfo })
        };
        return newMessages;
      } else {
        return [...prev, {
          id: msg.id || `msg-${Date.now()}`,
          tempId: msg.tempId,
          content: msg.content,
          message_type: msg.message_type || 'text',
          sender_id: msg.sender_id,
          created_at: msg.created_at || new Date().toISOString(),
          is_read: msg.is_read || false,
          threadId: msg.threadId,
          ...(msg.fileInfo && { fileInfo: msg.fileInfo })
        }];
      }
    });

    if (msg.sender_id !== currentUser.id) {
      setUsers(prev => prev.map(u => 
        u.user_id === msg.sender_id 
          ? { ...u, lastMessage: msg.content } 
          : u
      ));
    }

    if (msg.threadId === threadId && msg.sender_id !== currentUser.id) {
      console.log('Marking messages as read for thread:', threadId);
      socketRef.current?.emit('markAsRead', { threadId: msg.threadId });
    }
  }, [threadId, currentUser.id, uploadingFiles]);

  // Socket event handlers with cleanup
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    console.log('Setting up socket event handlers...');

    const handleTyping = ({ userId, isTyping: typingStatus, threadId: typingThreadId }) => {
      if (typingThreadId === threadId && userId === selectedUser?.user_id) {
        setIsTyping(typingStatus);
      }
    };

    const handleReadMessages = ({ threadId: tid }) => {
      if (tid === threadId) {
        setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
      }
    };

    const handleUserOnline = ({ userId }) => {
      setOnlineUsers(prev => new Set(prev.add(userId)));
    };

    const handleUserOffline = ({ userId }) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    };

    socket.on('message', handleMessage);
    socket.on('typing', handleTyping);
    socket.on('readMessages', handleReadMessages);
    socket.on('user-online', handleUserOnline);
    socket.on('user-offline', handleUserOffline);

    return () => {
      console.log('Cleaning up socket event handlers...');
      socket.off('message', handleMessage);
      socket.off('typing', handleTyping);
      socket.off('readMessages', handleReadMessages);
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);
    };
  }, [threadId, selectedUser, handleMessage]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    return () => clearTimeout(typingTimeoutRef.current);
  }, [messages, uploadingFiles]);

  // Select user and load thread with proper thread management
  const selectUser = async (user) => {
    try {
      if (selectedUser?.user_id === user.user_id) return;
      
      console.log('Selecting user:', user.user_id);
      setSelectedUser(user);
      setIsTyping(false);

      const res = await axiosInstance.get(`/chat/thread/${user.user_id}`);
      const currentThreadId = res.data?.data?.id;

      if (!currentThreadId) {
        throw new Error('Failed to get thread ID');
      }

      console.log('Thread ID:', currentThreadId);

      if (threadId && socketRef.current) {
        console.log('Leaving previous thread:', threadId);
        await new Promise((resolve) => {
          socketRef.current.emit('leaveThread', { threadId }, () => {
            console.log('Successfully left thread:', threadId);
            resolve();
          });
        });
      }

      setThreadId(currentThreadId);
      setMessages([]);
      
      console.log('Loading messages for thread:', currentThreadId);
      const messagesRes = await axiosInstance.get(`/chat/messages/${currentThreadId}`);
      setMessages(messagesRes.data?.data || []);
      console.log('Loaded messages:', messagesRes.data?.data?.length);

      console.log('Joining thread:', currentThreadId);
      await new Promise((resolve, reject) => {
        socketRef.current?.emit('joinThread', { threadId: currentThreadId }, (ack) => {
          if (ack && ack.error) {
            console.error('Failed to join thread:', ack.error);
            reject(ack.error);
          } else {
            console.log('Successfully joined thread:', currentThreadId);
            resolve();
          }
        });
      });
      
      console.log('Marking messages as read for thread:', currentThreadId);
      socketRef.current?.emit('markAsRead', { threadId: currentThreadId });

    } catch (err) {
      console.error('Error selecting user:', err);
      setTimeout(() => selectUser(user), 2000);
    }
  };

  // Send text message with optimistic updates and error handling
  const sendText = async () => {
    if (!newMsg.trim() || !threadId) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      tempId,
      content: newMsg,
      message_type: 'text',
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      is_read: false,
      threadId,
    };

    console.log('Adding temporary message:', tempMessage);
    setMessages(prev => [...prev, tempMessage]);
    setNewMsg('');

    try {
      console.log('Sending message to server...');
      const response = await axiosInstance.post('/chat/send', {
        threadId,
        content: newMsg,
        messageType: 'text',
        tempId
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        }
      });
      
      console.log('Message sent successfully', response.data);
    } catch (err) {
      console.error('Error sending message:', err);
      
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
        
        if (err.response.status === 400) {
          alert('Invalid request: ' + (err.response.data.message || 'Please check your input'));
        } else if (err.response.status === 401) {
          alert('Session expired. Please log in again.');
        }
      } else if (err.request) {
        console.error('Request:', err.request);
        alert('Network error. Please check your connection.');
      } else {
        console.error('Error:', err.message);
        alert('An error occurred: ' + err.message);
      }
      
      setMessages(prev => prev.filter(m => m.tempId !== tempId));
    }
  };

  // Send file with loading state and progress tracking
  const sendFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !threadId) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      tempId,
      content: file.name,
      message_type: 'file',
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      is_read: false,
      threadId,
    };

    console.log('Adding temporary file message:', tempMessage);
    setMessages(prev => [...prev, tempMessage]);

    // Add to uploading files state
    setUploadingFiles(prev => ({
      ...prev,
      [tempId]: {
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0
      }
    }));

    try {
      console.log('Uploading file...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('threadId', threadId);
      formData.append('tempId', tempId);

      const response = await axiosInstance.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadingFiles(prev => ({
            ...prev,
            [tempId]: {
              ...prev[tempId],
              progress
            }
          }));
        }
      });

      console.log('File uploaded successfully', response.data);
    } catch (err) {
      console.error('Error sending file:', err);
      // Remove temporary message and upload state on error
      setMessages(prev => prev.filter(m => m.tempId !== tempId));
      setUploadingFiles(prev => {
        const newState = {...prev};
        delete newState[tempId];
        return newState;
      });
      alert('Failed to upload file. Please try again.');
    } finally {
      e.target.value = '';
    }
  };

  // Typing indicator with proper debouncing
  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMsg(value);

    if (!threadId) return;

    clearTimeout(typingTimeoutRef.current);

    if (value.trim()) {
      socketRef.current?.emit('typing', {
        threadId,
        isTyping: true,
      });

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', {
          threadId,
          isTyping: false,
        });
      }, 2000);
    } else {
      socketRef.current?.emit('typing', {
        threadId,
        isTyping: false,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 bg-gray-100 border-r overflow-y-auto">
        <div className="p-4 font-semibold border-b flex justify-between items-center">
          <span>Connections</span>
          <div className="flex items-center">
            <span className={`text-xs ${
              connectionStatus === 'connected' ? 'text-green-500' : 
              connectionStatus === 'error' ? 'text-red-500' : 'text-gray-500'
            }`}>
              {connectionStatus === 'connected' ? '● Connected' : 
               connectionStatus === 'error' ? '● Error' : '● Disconnected'}
            </span>
            {connectionError && (
              <span className="ml-2 text-xs text-red-500" title={connectionError}>!</span>
            )}
          </div>
        </div>
        {users.length > 0 ? (
          users.map(u => (
            <div
              key={u.user_id}
              className={`cursor-pointer p-4 hover:bg-gray-200 ${selectedUser?.user_id === u.user_id ? 'bg-gray-300' : ''}`}
              onClick={() => selectUser(u)}
            >
              <div className="flex justify-between items-center">
                <span>{u.name}</span>
                <span className={`text-xs ${onlineUsers.has(u.user_id) ? 'text-green-500' : 'text-gray-400'}`}>
                  {onlineUsers.has(u.user_id) ? '● Online' : '○ Offline'}
                </span>
              </div>
              {u.lastMessage && (
                <div className="text-xs text-gray-500 truncate">
                  {u.lastMessage}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            No active connections found
          </div>
        )}
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b font-semibold bg-white">
          {selectedUser ? (
            <div>
              <div className="flex justify-between items-center">
                <span>{selectedUser.name}</span>
                <span className="text-sm text-gray-500">
                  {onlineUsers.has(selectedUser.user_id) ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {isTyping ? 'Typing...' : ''}
              </div>
            </div>
          ) : (
            'Select a connection to start chatting'
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              {selectedUser ? 'No messages yet. Start the conversation!' : 'Select a connection to start chatting'}
            </div>
          ) : (
            messages.map((m, index) => {
              const isCurrentUser = m.sender_id === currentUser.id;
              const showHeader = index === 0 ||
                messages[index - 1].sender_id !== m.sender_id ||
                new Date(m.created_at) - new Date(messages[index - 1].created_at) > 5 * 60 * 1000;

              // Check if this is an uploading file
              const isUploading = m.tempId && uploadingFiles[m.tempId];

              return (
                <div key={m.id || m.tempId} className="mb-2">
                  {showHeader && !isCurrentUser && (
                    <div className="text-xs text-gray-500 ml-2 mb-1">
                      {users.find(u => u.user_id === m.sender_id)?.name}
                    </div>
                  )}
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${isCurrentUser ? 'bg-blue-600 text-white ml-auto' : 'bg-gray-200 text-gray-900 mr-auto'}`}
                  >
                    {isUploading ? (
                      <div className="flex items-start">
                        <div className="animate-spin mr-2 mt-1">
                          <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{uploadingFiles[m.tempId].name}</div>
                          <div className="text-xs mt-1">
                            Uploading... {uploadingFiles[m.tempId].progress}%
                          </div>
                          <div className="w-full bg-gray-300 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full" 
                              style={{width: `${uploadingFiles[m.tempId].progress}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ) : m.message_type === 'file' ? (
                      <a
                        href={m.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:opacity-80"
                        title={m.fileInfo?.name || m.content.split('/').pop()}
                      >
                        <div className="flex items-center justify-center">
                          <FileIcon 
                            type={m.fileInfo?.type} 
                            fileName={m.fileInfo?.name || m.content.split('/').pop()} 
                          />
                        </div>
                        {m.fileInfo?.size && (
                          <div className={`text-xs text-center mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-600'}`}>
                            {formatFileSize(m.fileInfo.size)}
                          </div>
                        )}
                      </a>
                    ) : (
                      m.content
                    )}
                    <div className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isCurrentUser && <span className="ml-1">{m.is_read ? '✓✓' : '✓'}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-white">
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                onChange={sendFile} 
                className="hidden" 
                id="file-upload" 
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
              <label
                htmlFor="file-upload"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded cursor-pointer"
                title="Attach file"
              >
                📎
              </label>
              <input
                type="text"
                value={newMsg}
                onChange={handleTyping}
                onKeyDown={e => e.key === 'Enter' && sendText()}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendText}
                disabled={!newMsg.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Send
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500">Select a connection to start chatting</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;