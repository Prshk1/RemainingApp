import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextValue {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, "id">) => void;
  hideNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  showNotification: () => {},
  hideNotification: () => {},
  clearAll: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const nextIdRef = useRef(0);

  const showNotification = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<Notification, "id">) => {
      const id = `notification-${nextIdRef.current++}`;
      const notification: Notification = { id, type, title, message, duration };

      setNotifications((prev) => [...prev, notification]);

      if (duration > 0) {
        setTimeout(() => {
          hideNotification(id);
        }, duration);
      }
    },
    []
  );

  const hideNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, showNotification, hideNotification, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
