// src/app/page.tsx
// import { redirect } from 'next/navigation'; // Unused import
import LoginForm from '@/components/auth/LoginForm'; // Path to the auth-specific login form

export default function LoginPage() { // Renamed Home to LoginPage for clarity
  // Optional: If a user is already authenticated (checked via AuthContext or token),
  // you might want to redirect them to the dashboard from here.
  // e.g.,
  // const { user, isLoading } = useAuth();
  // const router = useRouter();
  // useEffect(() => {
  //   if (!isLoading && user) {
  //     router.replace('/dashboard');
  //   }
  // }, [user, isLoading, router]);
  // if (isLoading || (!isLoading && user)) return <p>Loading...</p>; // Or a loading spinner

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sage-100 via-green-50 to-teal-50 p-4"> {/* Added gradient, padding */}
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"> {/* Adjusted max-w */}
        <LoginForm />
      </div>
    </main>
  );
}