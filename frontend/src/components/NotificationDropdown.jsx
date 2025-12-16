import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, AlertCircle, Trash2, Check } from 'lucide-react';

const NotificationDropdown = ({
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAllNotifications
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const dropdownRef = useRef(null);

  // Track mobile view
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format timestamp to relative time
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return notificationTime.toLocaleDateString();
  };

  // Get notification icon and colors based on type
  const getNotificationStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600'
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600'
        };
      default: // info
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600'
        };
    }
  };

  // Close dropdown when clicking outside (desktop only)
  useEffect(() => {
    if (!isMobile) {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobile]);

  // Prevent body scroll when mobile modal is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isOpen]);

  // Handle notification click (mark as read)
  const handleNotificationClick = async (notification) => {
    if (!notification.read && onMarkAsRead) {
      await onMarkAsRead(notification.id);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Mobile Full-Screen Modal
  const MobileNotificationModal = () => (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-5 z-50 animate-fade-in"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl z-50 max-h-[85vh] flex flex-col animate-slide-up">
        {/* Handle Bar */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Actions Bar */}
        {(unreadCount > 0 || notifications.length > 0) && (
          <div className="flex items-center justify-end space-x-3 px-4 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={async () => {
                  if (onMarkAllAsRead) {
                    await onMarkAllAsRead();
                  }
                }}
                className="text-sm text-green-600 hover:text-green-800 font-medium flex items-center space-x-1 px-3 py-1.5 bg-white rounded-lg shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Mark all read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  const confirmed = window.confirm('Clear all notifications?');
                  if (confirmed) {
                    if (onClearAllNotifications) {
                      await onClearAllNotifications();
                    }
                    setIsOpen(false);
                  }
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center space-x-1 px-3 py-1.5 bg-white rounded-lg shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear all</span>
              </button>
            )}
          </div>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No notifications yet</p>
              <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const style = getNotificationStyle(notification.type);
                const IconComponent = style.icon;

                return (
                  <div
                    key={notification.id}
                    className={`relative p-4 active:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50 bg-opacity-30' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`p-2.5 rounded-xl ${style.bgColor} flex-shrink-0 shadow-sm`}>
                        <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-start justify-between mb-1">
                          <p className={`text-sm font-semibold ${style.textColor}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2 mt-1" />
                          )}
                        </div>
                        <p className={`text-sm ${style.textColor} opacity-80 leading-relaxed`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const confirmed = window.confirm('Delete this notification?');
                              if (confirmed) {
                                if (onDeleteNotification) {
                                  await onDeleteNotification(notification.id);
                                }
                              }
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Safe area for iPhone notch */}
        <div className="h-6 flex-shrink-0 bg-white"></div>
      </div>
    </>
  );

  // Desktop Dropdown
  const DesktopNotificationDropdown = () => (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={async () => {
                if (onMarkAllAsRead) {
                  await onMarkAllAsRead();
                }
                setIsOpen(false);
              }}
              className="text-sm text-green-600 hover:text-green-800 font-medium flex items-center space-x-1"
            >
              <Check className="w-3 h-3" />
              <span>Mark all read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={async () => {
                if (onClearAllNotifications) {
                  await onClearAllNotifications();
                }
                setIsOpen(false);
              }}
              className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const style = getNotificationStyle(notification.type);
            const IconComponent = style.icon;

            return (
              <div
                key={notification.id}
                className={`relative p-4 border-b border-gray-100 hover:${style.bgColor} cursor-pointer transition-colors`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-full ${style.bgColor} flex-shrink-0`}>
                    <IconComponent className={`w-4 h-4 ${style.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${style.textColor} truncate`}>
                      {notification.title}
                    </p>
                    <p className={`text-sm ${style.textColor} opacity-80 mt-1`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(notification.timestamp)}
                    </p>
                  </div>

                  {/* Unread Indicator */}
                  {!notification.read && (
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2" />
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const confirmed = window.confirm('Delete this notification?');
                      if (confirmed && onDeleteNotification) {
                        await onDeleteNotification(notification.id);
                      }
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 bg-white rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[20px] h-5 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Render Mobile Modal or Desktop Dropdown */}
      {isOpen && (
        isMobile ? <MobileNotificationModal /> : <DesktopNotificationDropdown />
      )}
    </div>
  );
};

// Add custom animations to your CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
`;
document.head.appendChild(style);

export default NotificationDropdown;