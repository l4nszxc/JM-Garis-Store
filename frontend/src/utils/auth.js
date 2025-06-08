export const checkTokenExpiration = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = decoded.exp * 1000; // Convert to milliseconds
        
        if (Date.now() >= expirationTime) {
            localStorage.removeItem('token');
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error checking token expiration:', error);
        localStorage.removeItem('token');
        return false;
    }
};

export const setupInactivityTimer = (router) => {
    let inactivityTimeout;
    const INACTIVITY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    const resetTimer = () => {
        if (inactivityTimeout) clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(() => {
            localStorage.removeItem('token');
            router.push('/login');
        }, INACTIVITY_TIME);
    };

    // Rest of the code remains the same
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
        document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
        if (inactivityTimeout) clearTimeout(inactivityTimeout);
        activityEvents.forEach(event => {
            document.removeEventListener(event, resetTimer);
        });
    };
};