import { createContext, useContext, useEffect, useState } from "react"
import { DateTime } from "luxon"

export type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
    )

    const [hour, setHour] = useState(() => DateTime.now().hour)

    useEffect(() => {
        const timer = setInterval(() => {
            setHour(DateTime.now().hour)
        }, 60000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark")

        let effectiveTheme = theme
        if (theme === "system") {
            const isNight = hour >= 18 || hour < 6
            effectiveTheme = isNight ? "dark" : "light"
        }

        root.classList.add(effectiveTheme)
    }, [theme, hour])

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
