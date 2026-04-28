"use client";
import { useEffect, useState } from 'react';
import { publicClient } from '@/lib/client';

const REGISTRY_ABI = [{
  name: 'getProfile',
  type: 'function',
  stateMutability: 'view',
  inputs: [{ name: '_user', type: 'address' }],
  outputs: [{ name: 'username', type: 'string' }, { name: 'metadataCID', type: 'string' }],
}] as const;

export default function ProfileHeader({ account }: { account: string }) {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [name] = await publicClient.readContract({
          address: process.env.NEXT_PUBLIC_REGISTRY_ADDR as `0x${string}`,
          abi: REGISTRY_ABI,
          functionName: 'getProfile',
          args: [account as `0x${string}`],
        });
        setUsername(name);
      } catch (e) {
        setUsername(null); // No profile found
      }
    };
    fetchProfile();
  }, [account]);

  if (!username) return null;

  return (
    <div className="flex items-center gap-4 p-6 bg-zinc-900 rounded-3xl border border-zinc-800 mb-8">
      <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold">
        {username[0].toUpperCase()}
      </div>
      <div>
        <h2 className="text-2xl font-black text-white">@{username}</h2>
        <p className="text-zinc-500 text-sm">Verified Venture Creator</p>
      </div>
    </div>
  );
}