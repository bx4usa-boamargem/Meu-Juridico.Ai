import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: '#1B7AAF',
                    dark: '#1A3A5C',
                    light: '#EBF4FB',
                },
                main: '#F8FAFC',
                white: '#FFFFFF',
                border: {
                    base: '#E2E8F0',
                    mid: '#CBD5E1',
                },
                text: {
                    primary: '#334155',
                    secondary: '#64748B',
                    muted: '#94A3B8',
                },
                status: {
                    green: {
                        DEFAULT: '#065F46',
                        bg: '#DCFCE7',
                    },
                    yellow: {
                        DEFAULT: '#92400E',
                        bg: '#FFFBEB',
                    },
                    red: '#DC2626',
                },
                badge: {
                    licitatorio: {
                        DEFAULT: '#7C3AED',
                        bg: '#EDE9FE',
                    }
                }
            },
            fontFamily: {
                sans: ['Inter', 'Arial', 'sans-serif'],
                mono: ['JetBrains Mono', 'Courier New', 'monospace'],
            },
        },
    },
    plugins: [],
}

export default config
