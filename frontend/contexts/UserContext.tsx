import api from "@/services/api";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type User = {
    id: string;
    name: string;
    mail: string;
};

type UserContextType = {
    user: User | null;
    loadUser: () => Promise<void>;
    setUser: (updates: Partial<User>) => void;
};

const UserContext = createContext<UserContextType>({} as UserContextType);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUserState] = useState<User | null>(null);

    const loadUser = async () => {
        try {
            const response = await api.get("/me");
            const res = response.data;

            if (res.error) {
                console.error(res.message || "Erro desconhecido");
                setUserState(null);
            } else {
                setUserState({
                    id: res.id,
                    name: res.name,
                    mail: res.email,
                });
            }
        } catch (err: any) {
            console.error(`Erro ao carregar dados do usuário: ${err.message || err}`);
            setUserState(null);
        }
    };

    const setUser = (updates: Partial<User>) => {
        setUserState(prev => prev? ({ ...prev!, ...updates }) : prev);
    };

    useEffect(() => {
        loadUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, loadUser, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);