import type { Config } from 'tailwindcss';

/**
 * Design system — "MAISON Fresh"
 * Trẻ trung, hiện đại: nền sáng sạch, chữ đen đậm, điểm nhấn coral năng động + lime nổi bật.
 * Font Montserrat; thang cỡ chữ theo hocthongminh.com (12 · 14 · 16 · 18 · 20 · 24 · 30 · 36 …).
 * Chi tiết & quy tắc dùng: .claude/skills/fashion-ui-design/SKILL.md
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Nền
        canvas: '#FAFAF7', // nền trang
        surface: '#FFFFFF', // card, popover
        muted: '#F2F2EE', // nền phụ, ô skeleton, section xen kẽ

        // Chữ (đậm → nhạt)
        ink: {
          DEFAULT: '#111113', // chữ chính, nút primary
          2: '#3F3F46', // chữ phụ / mô tả
          3: '#6B6B73', // meta, placeholder (đạt AA trên canvas)
          4: '#A1A1AA', // icon mờ, disabled
        },

        // Viền
        line: {
          DEFAULT: '#E7E7E2',
          strong: '#D4D4CE',
        },

        // Màu thương hiệu — coral
        brand: {
          50: '#FFF1EC',
          100: '#FFE0D6',
          200: '#FFC2AF',
          500: '#FF4D2E', // nhấn trang trí, chấm, viền
          600: '#DB3A16', // chữ màu brand & nền có chữ trắng (AA)
          700: '#B32E10',
        },

        // Điểm nhấn phụ — lime (luôn đi với chữ ink)
        lime: {
          100: '#F4FFCC',
          300: '#E6FF85',
          400: '#D7FF3D',
          600: '#7A9900',
        },

        // Trạng thái
        success: { DEFAULT: '#15803D', soft: '#DCFCE7' },
        warning: { DEFAULT: '#B45309', soft: '#FEF3C7' },
        danger: { DEFAULT: '#DC2626', dark: '#B91C1C', soft: '#FEE2E2' },
        star: '#FFB020', // sao đánh giá
        info: { DEFAULT: '#1D4ED8', soft: '#DBEAFE' },
      },
      fontFamily: {
        // Gán qua biến CSS của next/font ở app/layout.tsx
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      // Thang cỡ chữ (px) bám theo hocthongminh.com
      fontSize: {
        '2xs': ['11px', { lineHeight: '14px' }],
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '38px' }],
        '4xl': ['36px', { lineHeight: '44px' }],
        '5xl': ['48px', { lineHeight: '54px' }],
        '6xl': ['60px', { lineHeight: '64px' }],
        '7xl': ['80px', { lineHeight: '84px' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(17,17,19,0.04), 0 4px 16px -4px rgba(17,17,19,0.08)',
        pop: '0 2px 4px rgba(17,17,19,0.04), 0 16px 40px -8px rgba(17,17,19,0.18)',
        ring: '0 0 0 4px rgba(255,77,46,0.18)',
      },
      transitionTimingFunction: {
        silk: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.2s ease-out both',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.22,1,0.36,1) both',
        'slide-in-right': 'slide-in-right 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'slide-in-left': 'slide-in-left 0.35s cubic-bezier(0.22,1,0.36,1) both',
        shimmer: 'shimmer 1.6s infinite',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
