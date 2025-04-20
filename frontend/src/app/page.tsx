import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-sage-100">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-[480px]">
        <LoginForm />
      </div>
    </main>
  );
} 