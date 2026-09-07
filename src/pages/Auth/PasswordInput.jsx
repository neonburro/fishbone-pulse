import { useState } from 'react'
import { IconButton, Input, InputGroup, InputRightElement } from '@chakra-ui/react'
import { FiEye, FiEyeOff } from 'react-icons/fi'

/** Password field with a show/hide toggle. Accepts all Input props. */
export default function PasswordInput({ size = 'lg', ...props }) {
  const [show, setShow] = useState(false)
  return (
    <InputGroup size={size}>
      <Input type={show ? 'text' : 'password'} {...props} />
      <InputRightElement>
        <IconButton variant="ghost" size="sm" aria-label={show ? 'Hide password' : 'Show password'} icon={show ? <FiEyeOff /> : <FiEye />} onClick={() => setShow((v) => !v)} tabIndex={-1} />
      </InputRightElement>
    </InputGroup>
  )
}
