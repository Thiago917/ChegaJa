import api from "@/services/api";
import socket from "@/services/socket";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type User = {
    id: number;
    name: string;
    mail: string;
    photo: string;
    pushToken: string;
};

type UserContextType = {
    user: User | null;
    loadUser: () => Promise<void>;
    setUser: (id: number, updates: Partial<User>) => Promise<void>;
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
                    photo: res.photo,
                    pushToken: res.pushToken
                });
            }
        } catch (err: any) {
            console.error(`Erro ao carregar dados do usuário: ${err.message || err}`);
            setUserState(null);
        }
    };

    const setUser = async (id: number, updates: Partial<User>) => {
        if(!user) return;
        const prev = user;

        try{
            const response = await api.patch(`/update-user/${id}`, {updates})
            const res = response.data

            if(res.error){
                setUserState(prev)
                console.log(res.message)
                return;
            }
            setUserState(prev => prev? ({...prev, ...updates}) : prev)
        }
        catch(err){
            setUserState(prev)
            console.error(`Erro ao atualizar dados do usuário: ${err}`);
        }

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