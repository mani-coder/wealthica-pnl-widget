module.exports = {
  purge: {
    content: [
      "./src/**/*.svelte",
    ],
    enabled: process.env.NODE_ENV === 'production' // disable purge in dev
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
