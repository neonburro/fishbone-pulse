import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button } from '@chakra-ui/react'

export default function ErrorState({ title = 'Could not load this view', message, onRetry }) {
  return (
    <Alert status="error" variant="left-accent" borderRadius="base" alignItems="flex-start">
      <AlertIcon />
      <Box flex="1">
        <AlertTitle fontFamily="heading" textTransform="uppercase" letterSpacing="0.04em">
          {title}
        </AlertTitle>
        {message && <AlertDescription display="block">{message}</AlertDescription>}
        {onRetry && (
          <Button size="sm" mt={3} variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )}
      </Box>
    </Alert>
  )
}
