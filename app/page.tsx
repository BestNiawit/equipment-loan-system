import { redirect } from 'next/navigation'

export default function RootPage() {
  // Public app — go straight to equipment list
  redirect('/equipment')
}
