import {
    useState,
    useEffect
} from 'react';

export const usePuter = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initPuter = async () => {
            if (window.puter) {
                try {
                    // Kiểm tra xem user đã đăng nhập chưa
                    const currentUser = await window.puter.auth.getUser();
                    if (currentUser) {
                        setUser(currentUser);
                    }
                } catch (error) {
                    console.log('User chưa đăng nhập');
                }
            }
            setIsLoading(false);
        };

        // Đợi Puter.js load xong
        if (window.puter) {
            initPuter();
        } else {
            const checkPuter = setInterval(() => {
                if (window.puter) {
                    clearInterval(checkPuter);
                    initPuter();
                }
            }, 100);
        }
    }, []);

    const signIn = async () => {
        try {
            const result = await window.puter.auth.signIn();
            setUser(result);
            return result;
        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await window.puter.auth.signOut();
            setUser(null);
        } catch (error) {
            console.error('Lỗi đăng xuất:', error);
            throw error;
        }
    };

    return {
        user,
        signIn,
        signOut,
        isLoading
    };
};