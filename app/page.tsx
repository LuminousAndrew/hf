"use client";
import { useState, useEffect, useCallback } from 'react';
import { publicClient, getWalletClient } from '@/lib/client';
import ClaimHandle from '@/components/ClaimHandle';
import ProfileHeader from '@/components/ProfileHeader';
import CreatePost from '@/components/CreatePost';
import VentureCard from '@/components/VentureCard';

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [hasHandle, setHasHandle] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewedProfile, setViewedProfile] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  /* --- Inside Home.tsx --- */

const fetchPosts = useCallback(async () => {
  const postAddr = process.env.NEXT_PUBLIC_POSTS_ADDR;
  if (!postAddr || postAddr === '0x0000000000000000000000000000000000000000') return;
  
  try {
    const data = await publicClient.readContract({
      address: postAddr as `0x${string}`,
      abi: [{ 
        name: 'getAllPosts', 
        type: 'function', 
        stateMutability: 'view', 
        inputs: [], 
        outputs: [{ 
          type: 'tuple[]', 
          components: [
            { name: 'id', type: 'uint256' }, 
            { name: 'author', type: 'address' }, 
            { name: 'content', type: 'string' }, 
            { name: 'mediaHash', type: 'string' }, 
            { name: 'totalInvested', type: 'uint256' }, 
            { name: 'timestamp', type: 'uint256' },
            { name: 'comments', type: 'tuple[]', components: [
                { name: 'commenter', type: 'address' },
                { name: 'text', type: 'string' },
                { name: 'timestamp', type: 'uint256' }
            ]},
            { name: 'donors', type: 'tuple[]', components: [
                { name: 'investor', type: 'address' },
                { name: 'amount', type: 'uint256' }
            ]}
          ] 
        }] 
      }], // This closes the ABI array
      functionName: 'getAllPosts', // This is a sibling to 'abi', NOT outside the object
    }); // This closes the readContract object and function call

    if (data) {
      setPosts([...(data as any[])].reverse());
    }
  } catch (e) {
    console.error("Feed error:", e);
  }
}, []);

  const checkHandle = async (address: string) => {
  try {
    const profile = await publicClient.readContract({
      address: process.env.NEXT_PUBLIC_REGISTRY_ADDR as `0x${string}`,
      abi: [{ 
        name: 'getProfile', 
        type: 'function', 
        stateMutability: 'view', 
        inputs: [{ name: '_user', type: 'address' }], 
        outputs: [
          { name: 'username', type: 'string' },
          { name: 'metadataCID', type: 'string' }
        ] 
      }],
      functionName: 'getProfile',
      args: [address as `0x${string}`],
    }) as readonly [string, string]; // Use 'readonly' to match viem's output

    // If the username (first element) exists and isn't empty, they have a handle
    setHasHandle(!!profile[0] && profile[0] !== "");
  } catch (e) {
    console.error("Check handle error:", e);
    setHasHandle(false);
  }
};

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const client = await getWalletClient();
      if (!client) return alert("Please install a wallet!");
      const [addr] = await client.requestAddresses();
      if (addr) {
        setAccount(addr);
        await checkHandle(addr);
      }
    } catch (e) {
      console.error("Connection failed", e);
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const searchHandle = async () => {
      if (!searchQuery) {
        setViewedProfile(null);
        return;
      }
      try {
        const addr = await publicClient.readContract({
          address: process.env.NEXT_PUBLIC_REGISTRY_ADDR as `0x${string}`,
          abi: [{ name: 'usernameToAddress', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'string' }], outputs: [{ name: '', type: 'address' }] }],
          functionName: 'usernameToAddress',
          args: [searchQuery.toLowerCase()],
        }) as `0x${string}`;

        if (addr && addr !== '0x0000000000000000000000000000000000000000') {
          setViewedProfile(addr);
        }
      } catch (e) { console.error("Search error", e); }
    };
    const delay = setTimeout(searchHandle, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const displayPosts = viewedProfile
    ? posts.filter(p => p.author.toLowerCase() === viewedProfile.toLowerCase())
    : posts;

  return (
    <main className="min-h-screen bg-black text-white p-6 pb-24">
      <div className="max-w-xl mx-auto">
        <header className="flex flex-col mb-12 gap-6">
          <div className="flex justify-between items-center">
            <h1 
              onClick={() => { setViewedProfile(null); setSearchQuery(""); }} 
              className="text-4xl font-black italic tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
            >
              HARD FORK
            </h1>
            {!account && (
              <button 
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-white text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
              >
                {isConnecting ? "Connecting..." : "Connect"}
              </button>
            )}
          </div>
          <div className="relative">
            <input 
              type="text"
              placeholder="Search creator handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem] text-white outline-none focus:border-blue-600 transition-all font-medium"
            />
          </div>
        </header>

        <div className="space-y-12">
          {account && !viewedProfile && (
            <div className="space-y-8">
              {hasHandle ? (
                <ProfileHeader account={account} />
              ) : (
                <ClaimHandle account={account} onSuccess={() => checkHandle(account)} />
              )}
              <CreatePost account={account} onSuccess={fetchPosts} />
              <hr className="border-zinc-900" />
            </div>
          )}

          {viewedProfile && (
            <div className="flex items-center justify-between">
              <button 
                onClick={() => { setViewedProfile(null); setSearchQuery(""); }}
                className="text-blue-500 font-black text-xs uppercase tracking-widest hover:text-white transition-all"
              >
                ← Back to Main Feed
              </button>
            </div>
          )}

          <div className="space-y-8">
            {displayPosts.length > 0 ? (
              displayPosts.map((p) => (
                <VentureCard 
                  key={p.id.toString()} 
                  post={{...p, imageCID: p.mediaHash}} 
                  userAccount={account || "0x0000000000000000000000000000000000000000"} 
                  onRefresh={fetchPosts}
                />
              ))
            ) : (
              <div className="text-center py-20 bg-zinc-900/50 rounded-[3rem] border border-dashed border-zinc-800 text-zinc-600 uppercase font-black text-sm tracking-widest">
                {viewedProfile ? "No content found" : "No posts yet..."}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}