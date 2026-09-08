import { getCurrentProfile } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export default async function DashboardRouter() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect('/auth');
  }

  switch (profile.role) {
    case 'FARMER':
      redirect('/dashboard/farmer');
    case 'OPERATOR':
      redirect('/dashboard/operator');
    case 'ADMIN':
      redirect('/dashboard/admin');
    default:
      redirect('/auth');
  }
}
