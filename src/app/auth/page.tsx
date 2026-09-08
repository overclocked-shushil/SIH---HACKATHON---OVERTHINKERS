import AuthForm from './AuthForm';

export const metadata = {
  title: 'Authentication | SIH MVP',
  description: 'Login and Registration flow',
};

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-8">
          Smart Agricultural Procurement
        </h1>
        <AuthForm />
      </div>
    </div>
  );
}
