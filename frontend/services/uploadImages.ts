import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebaseConfig"; 
import AsyncStorage from "@react-native-async-storage/async-storage";

export const uploadImageAsync = async(uri: string, userId: string, name: string) => {
    
    try{

        const response = await fetch(uri);
        const blob = await response.blob()
        
        const fileRef = ref(storage, `image/${name}-${userId}.jpg`);
        
        await uploadBytes(fileRef, blob)
        const url = await getDownloadURL(fileRef)
        
        await AsyncStorage.setItem('@userPhoto', url)
        return {url: url, error: false}
    }
    catch(err){
        return {error: true, description: `Erro ao fazer upload da imagem: ${err}`}
    }
}