"use client";

import React, { createContext, useContext, useCallback } from 'react';

interface NotificationContextType {
  refetchNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  refetchNotifications: () => {},
});

export const useNotifications = () => useContext(NotificationContext);
export default NotificationContext;