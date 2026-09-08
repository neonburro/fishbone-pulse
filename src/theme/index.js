import { extendTheme } from '@chakra-ui/react'

// "Ink & Bone" — Pulse uses the light (paper) variant for legibility.
// Ink, paper and one orange. The same ink and paper numbers as the
// storefront so the two apps are one family, and orange instead of the
// storefront's red so you always know which room you are in. `ember` is the
// orange. `red` is an alias of it so shared components written for the
// storefront still light up the right color here. `river` and `hivis` are repainted to neutrals
// so anything still reading them goes quiet. Status colors for orders and
// payments stay semantic (green paid, yellow pending) and live in
// lib/statusMeta.js, they are outcomes, not decoration.
const ember = {
  50: '#FFF1E8', 100: '#FFD9C2', 200: '#FFB48A', 300: '#FF9A62', 400: '#FF8140',
  500: '#FF6A13', 600: '#E55A0C', 700: '#BF4A08', 800: '#8F3705', 900: '#5A2303',
}
const red = ember
const colors = {
  ink: {
    50: '#F6F2EA',
    100: '#ECE6DA',
    200: '#D9D2C4',
    300: '#9AA1AA', // placeholder, quiet type
    400: '#6B727C',
    500: '#4F4F54', // muted text on paper
    600: '#2C2F35', // border on ink
    700: '#26262A', // raised on ink
    800: '#1D1D20', // surface on ink
    900: '#161618', // page on ink, primary text on paper
  },
  bone: {
    50: '#F6F2EA', // paper
    100: '#ECE6DA', // paper 2
    200: '#D9D2C4', // rules on paper
    300: '#B9B2A4',
    400: '#9AA1AA',
    500: '#EFEAE0', // primary text on ink
    600: '#8C8578',
    700: '#6B6760',
    800: '#4F4B44',
    900: '#2A2925',
  },
  paper: '#F6F2EA',
  paper2: '#ECE6DA',
  red,
  ember: red,
  river: { 50: '#F6F2EA', 100: '#ECE6DA', 200: '#D9D2C4', 300: '#B9B2A4', 400: '#9AA1AA', 500: '#6B727C', 600: '#4F4F54', 700: '#3A3A3E', 800: '#2C2F35', 900: '#161618' },
  hivis: { 50: '#F6F2EA', 100: '#ECE6DA', 200: '#D9D2C4', 300: '#B9B2A4', 400: '#FF6A13', 500: '#FF6A13', 600: '#E55A0C', 700: '#BF4A08', 800: '#8F3705', 900: '#5A2303' },
}

// Type on orange is ink, not off white. Orange is bright enough that ink
// reads at eight to one, and it is the pairing the old shop sign used.
export const ON_RED = '#161618'
export const ON_EMBER = ON_RED
export const ACCENT = ember[500]

const fonts = {
  heading: `"Barlow Condensed", "Arial Narrow", system-ui, sans-serif`,
  body: `"Karla", "Helvetica Neue", system-ui, sans-serif`,
  mono: `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`,
}

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  colors,
  fonts,
  // Same corners as the storefront.
  radii: {
    none: '0',
    sm: '8px',
    base: '10px',
    md: '12px',
    lg: '18px',
    xl: '24px',
    '2xl': '24px',
    full: '9999px',
  },
  shadows: {
    card: '0 1px 2px rgba(22, 22, 24, 0.05), 0 0 0 1px rgba(22, 22, 24, 0.06)',
    outline: '0 0 0 3px rgba(255, 106, 19, 0.45)',
    paper: '0 20px 60px rgba(0,0,0,0.18)',
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
      '*::selection': { bg: 'ember.500', color: '#161618' },
      'input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, textarea:-webkit-autofill': {
        WebkitBoxShadow: '0 0 0 1000px #FFFFFF inset',
        WebkitTextFillColor: '#161618',
        caretColor: '#161618',
        transition: 'background-color 9999s ease-out 0s',
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
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0',
        color: 'ink.900',
      },
    },
    Button: {
      baseStyle: {
        fontFamily: 'heading',
        fontWeight: 600,
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
          if (props.colorScheme === 'ember' || props.colorScheme === 'red') {
            return {
              bg: 'red.500',
              color: ON_RED,
              _hover: { bg: 'red.400', _disabled: { bg: 'red.500' } },
              _active: { bg: 'red.600' },
            }
          }
          if (props.colorScheme === 'ink' || props.colorScheme === 'river') {
            return {
              bg: 'ink.900',
              color: 'bone.500',
              _hover: { bg: 'ink.700' },
              _active: { bg: 'ink.800' },
            }
          }
          return {}
        },
        outline: {
          borderColor: 'bone.200',
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
            borderColor: 'bone.200',
            borderRadius: 'sm',
            _hover: { borderColor: 'bone.400' },
            _focusVisible: {
              borderColor: 'ember.500',
              boxShadow: '0 0 0 1px #FF6A13',
            },
          },
        },
      },
      defaultProps: { focusBorderColor: 'red.500' },
    },
    Textarea: {
      variants: {
        outline: {
          bg: 'white',
          borderColor: 'bone.200',
          borderRadius: 'sm',
          _hover: { borderColor: 'bone.400' },
          _focusVisible: { borderColor: 'ember.500', boxShadow: '0 0 0 1px #FF6A13' },
        },
      },
      defaultProps: { focusBorderColor: 'red.500' },
    },
    Select: {
      variants: {
        outline: {
          field: {
            bg: 'white',
            borderColor: 'bone.200',
            borderRadius: 'sm',
            _hover: { borderColor: 'bone.400' },
            _focusVisible: { borderColor: 'ember.500', boxShadow: '0 0 0 1px #FF6A13' },
          },
        },
      },
      defaultProps: { focusBorderColor: 'red.500' },
    },
    NumberInput: {
      variants: {
        outline: {
          field: {
            bg: 'white',
            borderColor: 'bone.200',
            borderRadius: 'sm',
            _focusVisible: { borderColor: 'ember.500', boxShadow: '0 0 0 1px #FF6A13' },
          },
        },
      },
      defaultProps: { focusBorderColor: 'red.500' },
    },
    FormLabel: {
      baseStyle: {
        fontFamily: 'mono',
        fontSize: '11px',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: 'ink.500',
        mb: 1.5,
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
