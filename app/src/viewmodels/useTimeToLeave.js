import { useState, useEffect, useRef } from 'react';
import { fireNotification } from '../services/notificationService';

export function useTimeToLeave() {
  const [activeTimer, setActiveTimer] = useState(null);
  const intervalRef = useRef(null);

  function startTimer(stopName, routeName, minutesUntilLeave) {
    // Implementation removed for public release.
    // Sets up an interval-based countdown that fires a push notification
    // when the timer reaches zero.
  }

  function cancelTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveTimer(null);
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { activeTimer, startTimer, cancelTimer };
}
