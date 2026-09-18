import { AuthForm } from '../auth-form'
import { signInAction } from '../actions'

export default function SignInPage() {
  return <AuthForm mode="signIn" action={signInAction} />
}
