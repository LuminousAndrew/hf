"use client";
import { useState } from 'react';
import { publicClient, getWalletClient } from '@/lib/client';
import { parseEther } from 'viem';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const REGISTRY_ABI = [{
  name: 'usernameToAddress',
  type: 'function',
  stateMutability: 'view',
  inputs: [{ name: '', type: 'string' }],
  outputs: [{ name: '', type: 'address' }],
}] as const;

const SPLITTER_ABI = [{
  name: 'supportCreator',
  type: 'function',
  stateMutability: 'payable',
  inputs: [{ name: '_creator', type: 'address' }],
  outputs: [],
}] as const;

export default function UserSearch({ userAccount }: { userAccount: string }) {
  // Input state (what you are typing)
  const [searchInput, setSearchInput] = useState('');
  
  // Resolved state (what the blockchain actually found)
  const [resolvedHandle, setResolvedHandle] = useState('');
  const [foundAddress, setFoundAddress] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchInput) return;

    // 1. Reset everything before starting a new search
    setLoading(true);
    setError(null);
    setFoundAddress(null);
    setResolvedHandle('');

    try {
      const address = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_REGISTRY_ADDR as `0x${string}`,
        abi: REGISTRY_ABI,
        functionName: 'usernameToAddress',
        args: [searchInput.toLowerCase().trim()],
      });

      // 2. Check if the address exists
      if (address === ZERO_ADDRESS) {
        setError(`Handle "@${searchInput}" not found on the registry.`);
      } else {
        // 3. LOCK the handle and address only on success
        setFoundAddress(address);
        setResolvedHandle(searchInput.toLowerCase().trim());
      }
    } catch (e) {
      setError("Registry lookup failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const sendSupport = async () => {
    if (!foundAddress || foundAddress === ZERO_ADDRESS) return;

    try {
      const client = await getWalletClient();
      if (!client) return;

      const hash = await client.writeContract({
        address: process.env.NEXT_PUBLIC_SPLITTER_ADDR as `0x${string}`,
        abi: SPLITTER_ABI,
        functionName: 'supportCreator',
        args: [foundAddress as `0x${string}`],
        value: parseEther('10'),
        account: userAccount as `0x${string}`,
      });
      
      alert(`Sent 10 XDC to @${resolvedHandle} via the Splitter!`);
    } catch (e) {
      alert("Payment failed or rejected.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-2">
        <input 
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Find creator handle..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all"
        />
        <button 
          onClick={handleSearch} 
          disabled={loading}
          className="bg-white text-black px-8 rounded-2xl font-black hover:bg-zinc-200 disabled:opacity-50 transition-all"
        >
          {loading ? "..." : "Find"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-2xl text-red-500 text-xs font-bold">
          {error}
        </div>
      )}

      {/* Verified Result Card */}
      {foundAddress && (
        <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-blue-600/20 shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-1">On-Chain Registry</p>
              <h2 className="text-3xl font-black text-white italic tracking-tighter">@{resolvedHandle}</h2>
            </div>
            <span className="bg-blue-600/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold border border-blue-600/20">
              RESOLVED
            </span>
          </div>
          
          <div className="bg-black/40 p-4 rounded-xl mb-8 border border-zinc-800">
            <p className="text-zinc-600 text-[10px] font-mono mb-1 uppercase tracking-tighter">Recipient Wallet</p>
            <p className="text-zinc-400 text-xs font-mono break-all">{foundAddress}</p>
          </div>

          <button 
            onClick={sendSupport} 
            className="w-full bg-white text-black py-4 rounded-2xl font-black hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-xl shadow-white/5"
          >
            Invest 10 XDC in @{resolvedHandle}
          </button>
        </div>
      )}
    </div>
  );
}