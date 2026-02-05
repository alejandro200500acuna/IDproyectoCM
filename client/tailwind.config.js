/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // We can extend the theme with the custom colors defined in index.css if needed,
                // but for now relying on CSS variables or just utility classes content-layout is priority.
            }
        },
    },
    plugins: [],
}
