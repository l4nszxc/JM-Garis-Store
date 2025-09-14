// Generate initials from username for consistent avatar display
const getInitials = (username) => {
  if (!username) return 'U';
  
  // Clean the username and get meaningful parts
  const cleanName = username.replace(/[_\-\d]/g, ' ').trim();
  const parts = cleanName.split(/\s+/).filter(part => part.length > 0);
  
  if (parts.length === 0) {
    // If no meaningful parts, use first 2 characters of original username
    return username.substring(0, 2).toUpperCase();
  } else if (parts.length === 1) {
    // Single part, use first 2 characters
    return parts[0].substring(0, 2).toUpperCase();
  } else {
    // Multiple parts, use first character of first two parts
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
};

export const getAvatarUrl = (username) => {
  try {
    const initials = getInitials(username || 'User');
    // Use DiceBear API which is more reliable for CORS
    const encodedInitials = encodeURIComponent(initials);
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodedInitials}&backgroundColor=4CAF50&color=ffffff&fontSize=50`;
  } catch (error) {
    // Fallback to a data URL avatar if all else fails
    const initials = getInitials(username || 'User');
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#4CAF50"/>
        <text x="100" y="115" font-family="Arial, sans-serif" font-size="80" font-weight="bold" 
              text-anchor="middle" fill="white">
          ${initials}
        </text>
      </svg>
    `)}`;
  }
};