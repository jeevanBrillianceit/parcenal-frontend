export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'N/A';

  const options = { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  };
  
  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  const formattedDate = date.toLocaleDateString('en-US', options);
  const formattedTime = date.toLocaleTimeString('en-US', timeOptions).replace(' ', ':');

  return `${formattedDate} ${formattedTime}`;
};