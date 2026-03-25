import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "USER_PROGRESS";

export const saveProgress = async (progress: any) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(progress));
};

export const loadProgress = async () => {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : null;
};