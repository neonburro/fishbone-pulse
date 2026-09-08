// src/components/common/ErrorBoundary.jsx
//
// One broken page should never blank the whole of Pulse. This catches a
// render error inside the workspace, keeps the sidebar and the bar up, and
// gives the crew a reload and a way home. The error goes to the console so
// it can be chased.

import { Component } from 'react'
import { Box, Button, HStack, Text } from '@chakra-ui/react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('[Pulse] render error', error, info?.componentStack)
  }
  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <Box bg="white" borderRadius="md" boxShadow="card" p={6} maxW="640px">
        <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="ember.500">Misprint</Text>
        <Text fontFamily="heading" fontWeight={600} textTransform="uppercase" fontSize="xl" mt={1}>This page came off the press wrong.</Text>
        <Text fontSize="sm" color="ink.500" mt={2}>The rest of Pulse is fine. Reload this page, or go back to the dashboard. If it keeps happening, tell Tyler what you clicked.</Text>
        <Text fontFamily="mono" fontSize="xs" color="ink.400" mt={3} noOfLines={2}>{String(this.state.error?.message || this.state.error)}</Text>
        <HStack mt={4}>
          <Button size="sm" onClick={() => window.location.reload()}>Reload</Button>
          <Button size="sm" variant="outline" onClick={() => { window.location.href = '/' }}>Dashboard</Button>
        </HStack>
      </Box>
    )
  }
}
