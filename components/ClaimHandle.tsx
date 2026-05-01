"use client";
import { useState, useEffect } from 'react';
import { getWalletClient, publicClient } from '@/lib/client';

// Added usernameToAddress to the ABI so we can check availability
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
  },
  {
    name: 'usernameToAddress',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'string' }],
    outputs: [{ name: '', type: 'address' }],
  }
] as const;

interface ClaimHandleProps {
  account: string;
  onSuccess: () => void;
}

export default function ClaimHandle({ account, onSuccess }: ClaimHandleProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Check availability as the user types
  useEffect(() => {
    const checkAvailability = async () => {
      if (username.length < 3) {
        setIsAvailable(null);
        return;
      }
      try {
        const existingAddress = await publicClient.readContract({
          address: process.env.NEXT_PUBLIC_REGISTRY_ADDR as `0x${string}`,
          abi: REGISTRY_ABI,
          functionName: 'usernameToAddress',
          args: [username],
        });
        // If address is 0x00... it's available
        setIsAvailable(existingAddress === '0x0000000000000000000000000000000000000000');
      } catch (e) {
        setIsAvailable(null);
      }
    };

    const debounce = setTimeout(checkAvailability, 400);
    return () => clearTimeout(debounce);
  }, [username]);

  const claim = async () => {
    if (!username || username.length < 3) return alert("Username too short");
    if (isAvailable === false) return alert("This handle is already taken.");
    
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

      await publicClient.waitForTransactionReceipt({ hash });
      onSuccess();
      alert(`Handle @${username} confirmed on-chain!`);
    } catch (e: any) {
      console.error(e);
      // Catch specific Solidity revert error
      if (e.message.includes("Handle taken")) {
        alert("Handle taken! Someone just grabbed it.");
      } else {
        alert("Transaction failed. Check your XDC balance.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl">
      <h3 className="text-2xl font-black mb-2 text-white italic">HARD FORK ID</h3>
      <p className="text-zinc-500 mb-6 text-sm uppercase tracking-widest font-bold">Claim your unique venture handle</p>
      
      <div className="flex flex-col gap-3">
        <div className="relative">
          <span className="absolute left-4 top-4 text-zinc-600 font-bold">@</span>
          <input 
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            className={`w-full bg-black border rounded-2xl py-4 pl-10 pr-4 text-white font-medium outline-none transition-all ${
              isAvailable === true ? 'border-green-500' : isAvailable === false ? 'border-red-500' : 'border-zinc-800'
            }`}
            placeholder="username"
            disabled={loading}
          />
          {username.length >= 3 && (
            <div className="absolute right-4 top-4 text-[10px] font-black uppercase italic">
              {isAvailable === true && <span className="text-green-500">Available</span>}
              {isAvailable === false && <span className="text-red-500">Taken</span>}
            </div>
          )}
        </div>
        <button 
          onClick={claim}
          disabled={loading || !isAvailable}
          className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 hover:text-white disabled:opacity-30 transition-all"
        >
          {loading ? "Registering..." : "Initialize Identity"}
        </button>
      </div>
    </div>
  );
}