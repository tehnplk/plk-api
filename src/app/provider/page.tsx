
'use client';

import { signInWithHealthId,} from '../actions/sign-in'
import { useEffect } from 'react'

export default function ProviderPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-center mb-8">ทดสอบระบบ Login - Provider</h1>
        <form action={signInWithHealthId} className="w-full">
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-6 rounded-lg text-lg w-full"
          >
            Login with Provider ID
          </button>
        </form>
      </div>
    </div>
  );
}
