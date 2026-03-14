import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect root URL to the authentication page.
  // The sign-in page handles auth and redirects to /dashboard.
  redirect('/sign-in')
}
