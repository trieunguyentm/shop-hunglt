import type { Config } from 'tailwindcss';

/**
 * Design system — "Editorial Fashion"
 * Triết lý: tối giản cao cấp, nhiều khoảng trắng, tương phản ink/ivory,
 * điểm nhấn "clay" (đất nung) sang trọng. Tránh palette tím-xanh "đại trà".
 * Tham khảo chi tiết: .claude/skills/fashion-ui-design/SKILL.md
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Nền & mực
        ivory: '#F7F4EF', // nền chủ đạo (trắng ngà)
        bone: '#EFEAE2', // nền phụ
        ink: '#1A1714', // chữ chính (gần đen, ấm)
        graphite: '#4A463F', // chữ phụ
        mist: '#8C857A', // chữ mờ / placeholder
        line: '#E2DBD0', // đường viền

        // Điểm nhấn
        clay: {
          DEFAULT: '#B25C3C', // đất nung — màu thương hiệu
          dark: '#8F4729',
          light: '#D98E6E',
        },
        sage: '#7C8471', // phụ trợ (xanh rêu nhạt)
        gold: '#C9A24B', // nhấn sang (badge, sale)
      },
      fontFamily: {
        // Gán qua biến CSS của next/font ở layout.tsx
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Thang typography editorial (clamp để responsive mượt)
        'display-xl': ['clamp(3rem, 8vw, 7rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.0', letterSpacing: '-0.01em' }],
        'display-md': ['clamp(2rem, 3vw, 3rem)', { lineHeight: '1.1' }],
      },
      letterSpacing: {
        widest2: '0.25em', // dùng cho eyebrow / nhãn nhỏ in hoa
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      transitionTimingFunction: {
        // Easing "vải lụa" — chuyển động mềm
        silk: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s cubic-bezier(0.22,1,0.36,1) both',
        marquee: 'marquee 28s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
