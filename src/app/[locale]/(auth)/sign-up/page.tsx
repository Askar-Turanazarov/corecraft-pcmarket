import { AuthForm } from '../auth-form'
import { signUpAction } from '../actions'

export default function SignUpPage() {
  return <AuthForm mode="signUp" action={signUpAction} />
}
