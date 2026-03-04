import { useState } from "react";
import { AppSettings } from "../models/AppSettings";
import { defaultSettings } from "../data/defaultSettings";

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  return { settings, setSettings };
};