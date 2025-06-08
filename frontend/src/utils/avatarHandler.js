export const getAvatarUrl = (username) => {
  try {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username || 'User')}`;
  } catch (error) {
    return `/img/default-avatar.png`;
  }
};