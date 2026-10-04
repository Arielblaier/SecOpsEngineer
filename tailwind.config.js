/** Same theme the original page passed to the Tailwind CDN build. */
export default {
  // Tailwind only ships classes it can find as text in these files.
  content: ['./src/index.html', './src/partials/**/*.html', './src/js/**/*.js'],
  // Class names that are assembled at runtime (e.g. 'tn-' + color) are not
  // Tailwind utilities here, but if you ever build a utility name from pieces,
  // list it below so it is not dropped.
  safelist: [],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)', panel: 'rgb(var(--panel) / <alpha-value>)', panel2: 'rgb(var(--panel2) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)', line: 'rgb(var(--line) / <alpha-value>)', line2: 'rgb(var(--line2) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)', ink2: 'rgb(var(--ink2) / <alpha-value>)', ink3: 'rgb(var(--ink3) / <alpha-value>)',
        ink4: 'rgb(var(--ink4) / <alpha-value>)', sunk: 'rgb(var(--sunk) / <alpha-value>)', hov: 'rgb(var(--hov) / <alpha-value>)',
        code: 'rgb(var(--code) / <alpha-value>)', cx: { DEFAULT: '#00c389', dark: '#00a574' }
      },
      fontFamily: {
        sans: ['Lato', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
      }
    }
  }
};
