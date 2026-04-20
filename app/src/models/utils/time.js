// format unix timestamp to readable time
export function formatTime(unixSec) {
  const d = new Date(unixSec * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// "5 min" or "< 1 min"
export function formatMinutesAway(mins) {
  if (mins <= 0) return 'Now';
  if (mins === 1) return '1 min';
  return `${mins} min`;
}

// format GTFS time string "14:30:00" to "2:30 PM"
export function formatGtfsTime(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  let hrs = parseInt(parts[0]);
  const mins = parts[1];
  // GTFS can have hours > 24 for overnight trips
  if (hrs >= 24) hrs -= 24;
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  const displayHr = hrs % 12 || 12;
  return `${displayHr}:${mins} ${ampm}`;
}
