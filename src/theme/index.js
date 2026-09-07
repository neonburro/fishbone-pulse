import { extendTheme } from '@chakra-ui/react'

// "Ink & Bone" — Pulse uses the light (paper) variant for legibility.
const colors = {
  ink: {
    50: '#F4F4F5',
    100: '#DCDCDF',
    200: '#B5B5BB',
    300: '#8E8E96',
    400: '#5F5F67',
    500: '#4A4741', // muted text on paper
    600: '#26262B', // border (dark)
    700: '#1C1C1F', // raised
    800: '#141416', // surface
    900: '#0B0B0C', // page bg (dark) / primary text on paper
  },
  bone: {
    50: '#FAF7F2', // paper
    100: '#F1ECE3', // paper2
    200: '#E6DFD2',
    300: '#D9D2C5', // muted
    400: '#B8B0A2', // subtle
    500: '#F2EDE4', // primary text on dark
    600: '#9A917F',
    700: '#7A7263',
    800: '#5A5449',
    900: '#3A362F',
  },
  paper: '#FAF7F2',
  paper2: '#F1ECE3',
  ember: {
    50: '#FFF1E8',
    100: '#FFD9C2',
    200: '#FFB68A',
    300: '#FF9556',
    400: '#FF8140', // hover
    500: '#FF6A13', // primary
    600: '#E55A0C', // pressed
    700: '#BF4A09',
    800: '#8F3707',
    900: '#5E2404',
  },
  river: {
    50: '#E9F8F6',
    100: '#C6EEE9',
    200: '#8EDDD4',
    300: '#5FCFC3',
    400: '#45C7B8', // hover
    500: '#2BB3A3', // secondary
    600: '#229487',
    700: '#1A736A',
    800: '#12524B',
    900: '#0A322E',
  },
  hivis: {
    50: '#F9FDE8',
    100: '#EFFAC2',
    200: '#E2F58B',
    300: '#D4F15A',
    400: '#C6F135', // fluorescent highlight
    500: '#AEDB1F',
    600: '#8FB515',
    700: '#6F8C10',
    800: '#4F640B',
    900: '#2F3C06',
  },
}

const fonts = {
  heading: `"Barlow Condensed", "Barlow", system-ui, -apple-system, "Segoe UI", sans-serif`,
  body: `"Barlow", system-ui, -apple-system, "Segoe UI", sans-serif`,
  mono: `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`,
}

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  colors,
  fonts,
  radii: {
    none: '0',
    sm: '2px',
    base: '4px',
    md: '4px',
    lg: '6px',
    xl: '8px',
    '2xl': '12px',
    full: '9999px',
  },
  shadows: {
    card: '0 1px 2px rgba(11, 11, 12, 0.06), 0 0 0 1px rgba(11, 11, 12, 0.06)',
    outline: '0 0 0 3px rgba(255, 106, 19, 0.45)',
  },
  semanticTokens: {
    colors: {
      'chakra-body-bg': { default: 'paper' },
      'chakra-body-text': { default: 'ink.900' },
      'chakra-border-color': { default: 'bone.200' },
      'chakra-placeholder-color': { default: 'ink.300' },
    },
  },
  styles: {
    global: {
      'html, body': {
        bg: 'paper',
        color: 'ink.900',
        fontSize: '15px',
        lineHeight: '1.5',
      },
      '*::selection': {
        bg: 'ember.100',
      },
      ':focus-visible': {
        outline: 'none',
      },
    },
  },
  components: {
    Heading: {
      baseStyle: {
        fontFamily: 'heading',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '-0.01em',
        color: 'ink.900',
      },
    },
    Button: {
      baseStyle: {
        fontFamily: 'heading',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        borderRadius: 'base',
      },
      sizes: {
        sm: { fontSize: 'sm', px: 3 },
        md: { fontSize: 'md', px: 4 },
      },
      variants: {
        solid: (props) => {
          if (props.colorScheme === 'ember') {
            return {
              bg: 'ember.500',
              color: 'white',
              _hover: { bg: 'ember.400', _disabled: { bg: 'ember.500' } },
              _active: { bg: 'ember.600' },
            }
          }
          if (props.colorScheme === 'ink') {
            return {
              bg: 'ink.900',
              color: 'bone.500',
              _hover: { bg: 'ink.700' },
              _active: { bg: 'ink.800' },
            }
          }
          if (props.colorScheme === 'river') {
            return {
              bg: 'river.500',
              color: 'white',
              _hover: { bg: 'river.400' },
              _active: { bg: 'river.600' },
            }
          }
          return {}
        },
        outline: {
          borderColor: 'bone.300',
          color: 'ink.900',
          bg: 'white',
          _hover: { bg: 'paper2', borderColor: 'ink.500' },
        },
        ghost: {
          color: 'ink.500',
          _hover: { bg: 'paper2', color: 'ink.900' },
        },
      },
      defaultProps: {
        colorScheme: 'ember',
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            bg: 'white',
            borderColor: 'bone.300',
            borderRadius: 'base',
            _hover: { borderColor: 'bone.400' },
            _focusVisible: {
              borderColor: 'ember.500',
              boxShadow: '0 0 0 1px #FF6A13',
            },
          },
        },
      },
      defaultProps: { focusBorderColor: 'ember.500' },
    },
    Textarea: {
      variants: {
        outline: {
          bg: 'white',
          borderColor: 'bone.300',
          borderRadius: 'base',
          _hover: { borderColor: 'bone.400' },
          _focusVisible: { borderColor: 'ember.500', boxShadow: '0 0 0 1px #FF6A13' },
        },
      },
      defaultProps: { focusBorderColor: 'ember.500' },
    },
    Select: {
      variants: {
        outline: {
          field: {
            bg: 'white',
            borderColor: 'bone.300',
            borderRadius: 'base',
            _hover: { borderColor: 'bone.400' },
            _focusVisible: { borderColor: 'ember.500', boxShadow: '0 0 0 1px #FF6A13' },
          },
        },
      },
      defaultProps: { focusBorderColor: 'ember.500' },
    },
    NumberInput: {
      variants: {
        outline: {
          field: {
            bg: 'white',
            borderColor: 'bone.300',
            borderRadius: 'base',
            _focusVisible: { borderColor: 'ember.500', boxShadow: '0 0 0 1px #FF6A13' },
          },
        },
      },
      defaultProps: { focusBorderColor: 'ember.500' },
    },
    FormLabel: {
      baseStyle: {
        fontSize: 'xs',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'ink.500',
        mb: 1,
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'sm',
        fontFamily: 'heading',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        px: 2,
        py: 0.5,
      },
    },
    Tabs: {
      variants: {
        line: {
          tab: {
            fontFamily: 'heading',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'ink.500',
            whiteSpace: 'nowrap',
            _selected: { color: 'ink.900', borderColor: 'ember.500' },
          },
          tablist: { borderColor: 'bone.300' },
        },
      },
      defaultProps: { colorScheme: 'ember' },
    },
    Table: {
      variants: {
        simple: {
          th: {
            fontFamily: 'heading',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'ink.500',
            borderColor: 'bone.200',
            bg: 'paper2',
            fontSize: 'xs',
          },
          td: {
            borderColor: 'bone.200',
            fontSize: 'sm',
          },
        },
      },
    },
    Switch: { defaultProps: { colorScheme: 'river' } },
    Checkbox: {
      defaultProps: { colorScheme: 'ember' },
      baseStyle: { control: { borderRadius: 'sm', borderColor: 'bone.400' } },
    },
    Menu: {
      baseStyle: {
        list: { borderRadius: 'base', borderColor: 'bone.300', boxShadow: 'card', py: 1 },
        item: { fontSize: 'sm', _hover: { bg: 'paper2' }, _focus: { bg: 'paper2' } },
      },
    },
    Modal: {
      baseStyle: {
        dialog: { borderRadius: 'base', bg: 'paper' },
        header: { fontFamily: 'heading', textTransform: 'uppercase', letterSpacing: '-0.01em' },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: { bg: 'paper' },
        header: { fontFamily: 'heading', textTransform: 'uppercase', letterSpacing: '-0.01em' },
      },
    },
    Tooltip: {
      baseStyle: { bg: 'ink.900', color: 'bone.500', borderRadius: 'sm', fontSize: 'xs' },
    },
    Skeleton: {
      baseStyle: { borderRadius: 'base' },
      defaultProps: { startColor: 'bone.100', endColor: 'bone.200' },
    },
  },
})

export default theme
