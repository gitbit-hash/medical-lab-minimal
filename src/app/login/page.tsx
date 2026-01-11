// app/login/page.tsx - This redirects to locale-specific login
import { redirect } from 'next/navigation';

export default function LoginRedirectPage() {
  // This page just redirects to the default locale login
  // The middleware will handle locale detection
  redirect('/en/login');
}