import { ProtectedRoute } from "../components/ProtectedRoute";
import Profile from "../profile/page";
import Link from "next/link";


export default function Settings() {
  return (

    <ProtectedRoute>
    <Profile/>
    <div className="flex justify-center min-h-screen p-4 ">
    <div className="max-w-7xl ">
      <div className="text-4xl text-[var(--foreground)] bg-[var(--theme)] mt-5 mb-2 ">
      Your account
    </div>
    <div className="mb-4 ">
    <p>Here you can manage your account settings 💻</p>
    </div>
    <div>
      <button>
        <Link href="/privacy">
          <div className="bg-[var(--theme)]  text-[var(--foreground)] font-bold py-2 px-4 rounded">
            Privacy
          </div>
        </Link>
      </button>
    </div>
    <div>
      <Link href="/delete-account">
      <button className="bg-[var(--theme)]  text-[var(--foreground)] font-bold py-2 px-4 rounded mt-5 mb-5">
        Delete Account
      </button>
      </Link>
    </div>
    <div>
      <Link href="/pricing">
      <button className="bg-green-700  text-[var(--background)] font-bold py-2 px-4 rounded  mb-5">
        Manage your subscription
      </button>
      </Link>
    </div>
    </div>
  
    </div>
    </ProtectedRoute>
  );
}