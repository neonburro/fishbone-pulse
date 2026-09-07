import { Box } from '@chakra-ui/react'

/** Registration mark — circle + crosshair. Decorative bullet / brand motif. */
export default function RegMark({ size = 14, color = 'currentColor', ...rest }) {
  return (
    <Box as="svg" viewBox="0 0 24 24" width={`${size}px`} height={`${size}px`} flexShrink={0} aria-hidden {...rest}>
      <circle cx="12" cy="12" r="8" fill="none" stroke={color} strokeWidth="1.6" />
      <path d="M12 1v22M1 12h22" stroke={color} strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2" fill={color} />
    </Box>
  )
}
