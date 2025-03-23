import React, { createContext, useContext, useEffect, useState } from "react";

// Define the theme types - keep it minimal
export type ChatTheme = "default" | "compact" | "cozy";

// Define color theme presets
export type ChatColorTheme = "default" | "subtle" | "vibrant" | "clean";

export interface ColorPreset {
  name: string;
  background: string;
  messageCard: string;
  border: string;
  userMessageBg: string;
}

export const COLOR_PRESETS: Record<ChatColorTheme, ColorPreset> = {
  default: {
    name: "Default",
    background: "bg-gray-50 dark:bg-gray-950",
    messageCard: "bg-white dark:bg-gray-900",
    border: "border-gray-200 dark:border-gray-800",
    userMessageBg: "bg-primary text-primary-foreground"
  },
  subtle: {
    name: "Subtle",
    background: "bg-slate-100 dark:bg-slate-950",
    messageCard: "bg-white dark:bg-slate-900",
    border: "border-slate-200 dark:border-slate-800",
    userMessageBg: "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
  },
  vibrant: {
    name: "Vibrant",
    background: "bg-indigo-100 dark:bg-indigo-950",
    messageCard: "bg-white dark:bg-indigo-900",
    border: "border-indigo-200 dark:border-indigo-800",
    userMessageBg: "bg-indigo-200 dark:bg-indigo-700 text-indigo-900 dark:text-indigo-100"
  },
  clean: {
    name: "Clean",
    background: "bg-zinc-100 dark:bg-zinc-950",
    messageCard: "bg-white dark:bg-zinc-900",
    border: "border-zinc-200 dark:border-zinc-800",
    userMessageBg: "bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100"
  }
};

interface ChatThemeContextType {
  chatTheme: ChatTheme;
  setChatTheme: (chatTheme: ChatTheme) => void;
  colorTheme: ChatColorTheme;
  setColorTheme: (colorTheme: ChatColorTheme) => void;
  getCurrentColorPreset: () => ColorPreset;
}

// Create the context with a default undefined value
const ChatThemeContext = createContext<ChatThemeContextType | undefined>(undefined);

// Provider component that wraps your app and makes theme available
export const ChatThemeProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  // Get the chat theme from localStorage if available, otherwise use "default"
  const [chatTheme, setChatTheme] = useState<ChatTheme>(() => {
    const savedTheme = localStorage.getItem("chat-theme") as ChatTheme | null;
    return savedTheme || "default";
  });

  // Get the color theme from localStorage if available, otherwise use "default"
  const [colorTheme, setColorTheme] = useState<ChatColorTheme>(() => {
    const savedColorTheme = localStorage.getItem("chat-color-theme") as ChatColorTheme | null;
    return savedColorTheme || "default";
  });

  // Helper function to get the current color preset
  const getCurrentColorPreset = () => COLOR_PRESETS[colorTheme];

  // Update localStorage when the themes change
  useEffect(() => {
    localStorage.setItem("chat-theme", chatTheme);
  }, [chatTheme]);

  useEffect(() => {
    localStorage.setItem("chat-color-theme", colorTheme);
  }, [colorTheme]);

  // Memo the context value to prevent unnecessary rerenders
  const value = React.useMemo(
    () => ({
      chatTheme,
      setChatTheme,
      colorTheme,
      setColorTheme,
      getCurrentColorPreset
    }),
    [chatTheme, colorTheme]
  );

  return (
    <ChatThemeContext.Provider value={value}>
      {children}
    </ChatThemeContext.Provider>
  );
};

// Hook to use the chat theme context
export const useChatTheme = (): ChatThemeContextType => {
  const context = useContext(ChatThemeContext);
  if (context === undefined) {
    throw new Error("useChatTheme must be used within a ChatThemeProvider");
  }
  return context;
}; 