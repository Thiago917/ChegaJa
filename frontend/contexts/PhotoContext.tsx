import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PhotoContextType = {
  photo: string | null;
  setUserPhoto: (url: string) => Promise<void>;
  loadPhoto: () => Promise<void>;
};

const PhotoContext = createContext<PhotoContextType>({} as PhotoContextType);

export const PhotoProvider = ({ children }: { children: React.ReactNode }) => {
  const [photo, setPhoto] = useState<string | null>(null);

  const loadPhoto = async () => {
    const saved = await AsyncStorage.getItem('@chegaja:user_photo');
    if(saved) setPhoto(saved);
  };

  const setUserPhoto = async (url: string) => {
    await AsyncStorage.setItem('@chegaja:user_photo', url);
    setPhoto(url);
  };

  useEffect(() => {
    loadPhoto();
  }, []);

  return (
    <PhotoContext.Provider value={{ photo, setUserPhoto, loadPhoto }}>
      {children}
    </PhotoContext.Provider>
  );
};

export const usePhoto = () => useContext(PhotoContext);