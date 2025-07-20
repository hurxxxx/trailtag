import { createTheme } from '@mui/material/styles';

// 2025 soft and modern color palette - soft tone combination
const colors = {
  // Main color: Soft blue (calm and trustworthy feeling)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main soft blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  // Secondary color: Soft lavender (elegant and modern feeling)
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a78bfa', // Main soft lavender
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  // Accent color: Soft mint (fresh and calm feeling)
  accent: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#06b6d4', // Main soft mint
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },
  // Soft success color: Soft green
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#10b981', // Softer green
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  // Soft warning color: Soft amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Softer amber
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  // Soft error color: Soft rose
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#f43f5e', // Softer rose
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },
  grey: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  }
};

// 2025 iOS style glassmorphism mixins
const commonStyles = {
  // Pure glassmorphism card effect (iOS style)
  glassCard: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    borderRadius: 20,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    '&:hover': {
      transform: 'translateY(-2px)',
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(25px) saturate(200%)',
      WebkitBackdropFilter: 'blur(25px) saturate(200%)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
    },
  },

  // iOS style card hover effect
  cardHover: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(15px) saturate(180%)',
    WebkitBackdropFilter: 'blur(15px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    '&:hover': {
      transform: 'translateY(-3px) scale(1.01)',
      background: 'rgba(255, 255, 255, 0.18)',
      backdropFilter: 'blur(20px) saturate(200%)',
      WebkitBackdropFilter: 'blur(20px) saturate(200%)',
      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
    },
  },

  // iOS style search field
  searchField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 12,
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(15px) saturate(180%)',
      WebkitBackdropFilter: 'blur(15px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      '&:hover': {
        background: 'rgba(255, 255, 255, 0.9)',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
      '&.Mui-focused': {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px) saturate(200%)',
        WebkitBackdropFilter: 'blur(20px) saturate(200%)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 107, 107, 0.3)',
      },
    },
  },

  // iOS style glass button
  modernButton: {
    borderRadius: 12,
    textTransform: 'none',
    fontWeight: 600,
    padding: '12px 24px',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(15px) saturate(180%)',
    WebkitBackdropFilter: 'blur(15px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    '&:hover': {
      transform: 'translateY(-1px)',
      background: 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(20px) saturate(200%)',
      WebkitBackdropFilter: 'blur(20px) saturate(200%)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
    },
  },

  // iOS style glass modal
  modernDialog: {
    borderRadius: 20,
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(30px) saturate(200%)',
    WebkitBackdropFilter: 'blur(30px) saturate(200%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
  },
};

// 다크모드 지원을 위한 테마 생성 함수
// 성능 최적화: 테마 생성 비용을 줄이기 위해 메모이제이션 고려
const createAppTheme = (mode = 'light') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.primary[500], // 소프트 블루
        light: colors.primary[300],
        dark: colors.primary[700],
        contrastText: '#ffffff',
      },
      secondary: {
        main: colors.secondary[500], // 소프트 라벤더
        light: colors.secondary[300],
        dark: colors.secondary[700],
        contrastText: '#ffffff',
      },
      // 새로운 액센트 컬러 추가
      accent: {
        main: colors.accent[500], // 딥 퍼플
        light: colors.accent[300],
        dark: colors.accent[700],
        contrastText: '#ffffff',
      },
      success: {
        main: colors.success[500],
        light: colors.success[300],
        dark: colors.success[700],
      },
      warning: {
        main: colors.warning[500],
        light: colors.warning[300],
        dark: colors.warning[700],
      },
      error: {
        main: colors.error[500],
        light: colors.error[300],
        dark: colors.error[700],
      },
      grey: colors.grey,
      background: {
        default: isDark ? colors.grey[900] : '#f8fafc',
        paper: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      },
      text: {
        primary: isDark ? colors.grey[100] : colors.grey[900],
        secondary: isDark ? colors.grey[400] : colors.grey[600],
      },
    },
    // 반응형 브레이크포인트 설정
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
    typography: {
      // 2025년 트렌드 한글 폰트 Pretendard 적용
      fontFamily: [
        'Pretendard',
        '-apple-system',
        'BlinkMacSystemFont',
        'system-ui',
        'Roboto',
        '"Helvetica Neue"',
        '"Segoe UI"',
        '"Apple SD Gothic Neo"',
        '"Noto Sans KR"',
        '"Malgun Gothic"',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
        'sans-serif',
      ].join(','),
      // iOS 스타일 타이포그래피 - 깔끔하고 읽기 쉬운 스타일
      h1: {
        fontSize: '3rem',
        fontWeight: 700,
        lineHeight: 1.1,
        letterSpacing: '-0.025em',
        color: colors.grey[900],
      },
      h2: {
        fontSize: '2.25rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
        color: colors.grey[800],
      },
      h3: {
        fontSize: '1.875rem',
        fontWeight: 700,
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
        color: colors.grey[800],
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
        color: colors.grey[700],
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.5,
        color: colors.grey[700],
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.5,
        color: colors.grey[700],
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.7,
        fontWeight: 400,
        color: colors.grey[700],
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
        fontWeight: 400,
        color: colors.grey[600],
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 600,
        textTransform: 'none',
        letterSpacing: '0.025em',
      },
    },
    shape: {
      borderRadius: 20, // 더 부드러운 모서리
    },
    // 2025년 모던 그림자 시스템
    shadows: [
      'none',
      '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.1)',
      '0px 4px 8px rgba(0, 0, 0, 0.08), 0px 2px 4px rgba(0, 0, 0, 0.12)',
      '0px 8px 16px rgba(0, 0, 0, 0.1), 0px 4px 8px rgba(0, 0, 0, 0.15)',
      '0px 12px 24px rgba(0, 0, 0, 0.12), 0px 6px 12px rgba(0, 0, 0, 0.18)',
      '0px 16px 32px rgba(0, 0, 0, 0.15), 0px 8px 16px rgba(0, 0, 0, 0.2)',
      '0px 20px 40px rgba(0, 0, 0, 0.18), 0px 10px 20px rgba(0, 0, 0, 0.22)',
      '0px 24px 48px rgba(0, 0, 0, 0.2), 0px 12px 24px rgba(0, 0, 0, 0.25)',
      // 글래스모피즘 효과를 위한 부드러운 그림자들
      '0px 8px 32px rgba(31, 38, 135, 0.37)',
      '0px 12px 40px rgba(31, 38, 135, 0.5)',
      '0px 16px 48px rgba(31, 38, 135, 0.6)',
      '0px 20px 56px rgba(31, 38, 135, 0.7)',
      '0px 24px 64px rgba(31, 38, 135, 0.8)',
      '0px 28px 72px rgba(31, 38, 135, 0.85)',
      '0px 32px 80px rgba(31, 38, 135, 0.9)',
      '0px 36px 88px rgba(31, 38, 135, 0.95)',
      '0px 40px 96px rgba(31, 38, 135, 1)',
      '0px 44px 104px rgba(31, 38, 135, 1)',
      '0px 48px 112px rgba(31, 38, 135, 1)',
      '0px 52px 120px rgba(31, 38, 135, 1)',
      '0px 56px 128px rgba(31, 38, 135, 1)',
      '0px 60px 136px rgba(31, 38, 135, 1)',
      '0px 64px 144px rgba(31, 38, 135, 1)',
      '0px 68px 152px rgba(31, 38, 135, 1)',
      '0px 72px 160px rgba(31, 38, 135, 1)',
    ],
    components: {
      // iOS 스타일 글래스모피즘 버튼
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '12px 24px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 'none',
            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fontFamily: 'Pretendard, sans-serif',
          },
          contained: {
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(15px) saturate(180%)',
            WebkitBackdropFilter: 'blur(15px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: colors.grey[800],
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px) saturate(200%)',
              WebkitBackdropFilter: 'blur(20px) saturate(200%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            },
            '&.MuiButton-containedPrimary': {
              background: 'rgba(14, 165, 233, 0.15)',
              color: colors.primary[700],
              border: '1px solid rgba(14, 165, 233, 0.2)',
              '&:hover': {
                background: 'rgba(14, 165, 233, 0.25)',
              },
            },
          },
          outlined: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px) saturate(180%)',
            WebkitBackdropFilter: 'blur(10px) saturate(180%)',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            color: colors.primary[600],
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(15px) saturate(200%)',
              WebkitBackdropFilter: 'blur(15px) saturate(200%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            },
          },
          text: {
            color: colors.grey[700],
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            },
          },
        },
      },
      // iOS 스타일 글래스모피즘 카드
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.125)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            '&:hover': {
              transform: 'translateY(-2px)',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(25px) saturate(200%)',
              WebkitBackdropFilter: 'blur(25px) saturate(200%)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            },
          },
        },
      },
      // iOS 스타일 글래스모피즘 TextField
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(15px) saturate(180%)',
              WebkitBackdropFilter: 'blur(15px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              fontFamily: 'Pretendard, sans-serif',

              // 기본 상태
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },

              // 호버 상태
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.9)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              },

              // 포커스 상태
              '&.Mui-focused': {
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px) saturate(200%)',
                WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                outline: 'none !important',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(14, 165, 233, 0.3)',
              },

              // 에러 상태
              '&.Mui-error': {
                boxShadow: '0 0 0 1px rgba(244, 63, 94, 0.3)',
                '&.Mui-focused': {
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(244, 63, 94, 0.5)',
                },
              },
            },

            // Input 요소 스타일
            '& .MuiOutlinedInput-input': {
              padding: '14px 16px',
              fontSize: '0.875rem',
              fontWeight: 400,
              color: colors.grey[800],
              '&:focus': {
                outline: 'none !important',
                boxShadow: 'none !important',
              },
              '&::placeholder': {
                color: colors.grey[400],
                opacity: 1,
              },
            },

            // 라벨 스타일
            '& .MuiInputLabel-root': {
              fontSize: '0.875rem',
              fontWeight: 500,
              color: colors.grey[600],
              fontFamily: 'Pretendard, sans-serif',
              '&.Mui-focused': {
                color: colors.primary[500],
              },
            },

            // 헬퍼 텍스트 스타일
            '& .MuiFormHelperText-root': {
              marginTop: 8,
              fontSize: '0.75rem',
              fontWeight: 400,
              color: colors.grey[500],
              fontFamily: 'Pretendard, sans-serif',
              '&.Mui-error': {
                color: colors.error[500],
              },
            },
          },
        },
      },
      // 글래스모피즘 다이얼로그
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 24,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          },
        },
      },
      // iOS 스타일 글래스 칩
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            fontWeight: 500,
            fontFamily: 'Pretendard, sans-serif',
            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px) saturate(180%)',
            WebkitBackdropFilter: 'blur(10px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            '&:hover': {
              transform: 'translateY(-1px)',
              background: 'rgba(255, 255, 255, 0.25)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            },
          },
          filled: {
            background: 'rgba(14, 165, 233, 0.2)',
            color: colors.primary[700],
            border: '1px solid rgba(14, 165, 233, 0.3)',
          },
          outlined: {
            border: '1px solid rgba(14, 165, 233, 0.3)',
            color: colors.primary[600],
            background: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
      // 글래스모피즘 앱바
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: 'none',
            boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)',
            color: colors.grey[800],
          },
        },
      },
      // 글래스모피즘 드로어
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: 'none',
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
          },
        },
      },

      // Input 관련 컴포넌트 스타일 통합
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontFamily: 'Pretendard, sans-serif',
            '&.Mui-focused': {
              outline: 'none !important',
              boxShadow: 'none !important',
            },
          },
          input: {
            '&:focus': {
              outline: 'none !important',
              boxShadow: 'none !important',
            },
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            fontFamily: 'Pretendard, sans-serif',
            '&.Mui-focused': {
              outline: 'none !important',
              boxShadow: 'none !important',
            },
          },
          input: {
            '&:focus': {
              outline: 'none !important',
              boxShadow: 'none !important',
            },
          },
        },
      },

      // 모던 InputAdornment 스타일
      MuiInputAdornment: {
        styleOverrides: {
          root: {
            color: colors.grey[500],
            '& .MuiSvgIcon-root': {
              fontSize: '1.2rem',
            },
          },
        },
      },

      // 모던 폼 라벨 스타일
      MuiFormLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            fontWeight: 500,
            fontFamily: 'Pretendard, sans-serif',
            color: colors.grey[600],
            '&.Mui-focused': {
              color: colors.primary[500],
            },
          },
        },
      },

      // 모던 리스트 아이템
      MuiListItem: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            margin: '4px 0',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.8)',
              transform: 'translateX(4px)',
            },
          },
        },
      },

      // iOS 스타일 글래스 아바타
      MuiAvatar: {
        styleOverrides: {
          root: {
            background: 'rgba(14, 165, 233, 0.2)',
            backdropFilter: 'blur(10px) saturate(180%)',
            WebkitBackdropFilter: 'blur(10px) saturate(180%)',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            color: colors.primary[700],
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 600,
          },
        },
      },
    },

    // 공통 스타일을 테마에 추가
    mixins: {
      ...commonStyles,
    },
  });
};

// 기본 라이트 테마 생성
const theme = createAppTheme('light');

// 다크모드 테마 생성 함수도 export
export { createAppTheme };
export default theme;
