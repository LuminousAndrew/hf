"use client";
import { useState } from 'react';
import { getWalletClient, publicClient } from '@/lib/client';

const REGISTRY_ABI = [
  {
    name: 'registerProfile',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_username', type: 'string' },
      { name: '_metadataCID', type: 'string' }
    ],
    outputs: [],
  }
] as const;

interface ClaimHandleProps {
  account: string;
  onSuccess: () => void;
}

export default function ClaimHandle({ account, onSuccess }: ClaimHandleProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const claim = async () => {
    if (!username || username.length < 3) return alert("Username too short");
    setLoading(true);
    
    try {
      const client = await getWalletClient();
      if (!client) return;

      const hash = await client.writeContract({
        address: process.env.NEXT_PUBLIC_REGISTRY_ADDR as `0x${string}`,
        abi: REGISTRY_ABI,
        functionName: 'registerProfile',
        args: [username, "ipfs://default-avatar"],
        account: account as `0x${string}`,
      });

      // Wait for the blockchain to confirm the transaction
      await publicClient.waitForTransactionReceipt({ hash });
      
      // Trigger the parent UI refresh
      onSuccess();
      alert(`Handle @${username} confirmed on-chain!`);
    } catch (e: any) {
      console.error(e);
      alert("Error: Handle might be taken or transaction rejected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl">
      <h3 className="text-2xl font-black mb-2 text-white">Secure Your Identity</h3>
      <p className="text-zinc-500 mb-6">Choose your unique venture handle on XDC.</p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-3.5 text-zinc-600 font-bold">@</span>
          <input 
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            className="w-full bg-black border border-zinc-800 rounded-2xl py-4 pl-10 pr-4 text-white font-medium focus:border-blue-500 outline-none transition-all"
            placeholder="username"
            disabled={loading}
          />
        </div>
        <button 
          onClick={claim}
          disabled={loading || !username}
          className="bg-blue-600 px-8 py-4 rounded-2xl font-black text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-900/20"
        >
          {loading ? "Claiming..." : "Claim Handle"}
        </button>
      </div>
    </div>
  );
}