import React from 'react';
import { CalendarView } from './CalendarView';
import { useMenuStore } from '../hooks/useMenuModal';

export const CalendarModal: React.FC = () => {
  const isOpen = useMenuStore((state) => state.isCalendarOpen);
  const closeCalendar = useMenuStore((state) => state.closeCalendar);
  return <CalendarView isOpen={isOpen} onClose={closeCalendar} />;
};
