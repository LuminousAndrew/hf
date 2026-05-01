"use client";
import { useState, useEffect } from 'react';
import { parseEther, formatEther } from 'viem';
import { publicClient, getWalletClient } from '@/lib/client';

const REGISTRY_ABI = [{
  name: 'getProfile',
  type: 'function',
  stateMutability: 'view',
  inputs: [{ name: '_user', type: 'address' }],
  outputs: [{ name: 'username', type: 'string' }, { name: 'metadataCID', type: 'string' }],
}] as const;

const POSTS_ABI = [{
  name: 'addComment',
  type: 'function',
  stateMutability: 'nonpayable',
  inputs: [{ name: '_postId', type: 'uint256' }, { name: '_text', type: 'string' }],
  outputs: [],
}] as const;

const SPLITTER_ABI = [{
  name: 'supportCreator',
  type: 'function',
  stateMutability: 'payable',
  inputs: [{ name: '_creator', type: 'address' }, { name: '_postId', type: 'uint256' }],
  outputs: [],
}] as const;

interface PostProps {
  post: any;
  userAccount: string;
  onRefresh: () => void;
}

export default function VentureCard({ post, userAccount, onRefresh }: PostProps) {
  const [authorHandle, setAuthorHandle] = useState<string>('anonymous');
  const [amount, setAmount] = useState<string>("");
  const [commentText, setCommentText] = useState<string>("");
  const [isInvesting, setIsInvesting] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    const getHandle = async () => {
      try {
        const result = await publicClient.readContract({
          address: process.env.NEXT_PUBLIC_REGISTRY_ADDR as `0x${string}`,
          abi: REGISTRY_ABI,
          functionName: 'getProfile',
          args: [post.author],
        });
        if (result && result[0]) setAuthorHandle(result[0]);
      } catch (e) { console.error("Handle error"); }
    };
    getHandle();
  }, [post.author]);

  const investXDC = async () => {
    if (!amount || parseFloat(amount) <= 0) return alert("Enter an amount");
    setIsInvesting(true);
    try {
      const client = await getWalletClient();
      if (!client) return;

      const hash = await client.writeContract({
        address: process.env.NEXT_PUBLIC_SPLITTER_ADDR as `0x${string}`,
        abi: SPLITTER_ABI,
        functionName: 'supportCreator',
        args: [post.author, post.id],
        value: parseEther(amount),
        account: userAccount as `0x${string}`,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      onRefresh(); 
      alert(`Success! Sent ${amount} XDC to @${authorHandle}`);
    } catch (e) { alert("Transaction failed. Check balance."); } 
    finally { setIsInvesting(false); }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setIsCommenting(true);
    try {
      const client = await getWalletClient();
      if (!client) return;

      const hash = await client.writeContract({
        address: process.env.NEXT_PUBLIC_POSTS_ADDR as `0x${string}`,
        abi: POSTS_ABI,
        functionName: 'addComment',
        args: [post.id, commentText],
        account: userAccount as `0x${string}`,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setCommentText("");
      onRefresh();
    } catch (e) { alert("Failed to post comment."); }
    finally { setIsCommenting(false); }
  };

  return (
    <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 overflow-hidden shadow-2xl transition-all hover:border-zinc-700 mb-12">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-full flex items-center justify-center font-black text-white">
                {authorHandle[0]?.toUpperCase()}
            </div>
            <div>
                {/* FIXED: Removed [0] to show full handle */}
                <p className="text-white font-bold italic">@{authorHandle}</p>
                <p className="text-zinc-500 text-[10px] font-mono">{post.author.slice(0, 10)}...</p>
            </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-2xl">
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Raised</p>
            <p className="text-white font-mono font-bold">{formatEther(post.totalInvested || 0n)} XDC</p>
        </div>
      </div>

      {post.imageCID && (
        <div className="w-full bg-black aspect-video overflow-hidden border-y border-zinc-800">
          <img 
            src={`https://gateway.pinata.cloud/ipfs/${post.imageCID}`} 
            className="w-full h-full object-cover opacity-90" 
            alt="Venture Media"
          />
        </div>
      )}

      <div className="p-8">
        <p className="text-zinc-300 text-lg mb-8 leading-relaxed">{post.content}</p>

        <div className="flex gap-2 p-2 bg-black rounded-3xl border border-zinc-800 mb-8">
          <input 
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent pl-4 text-white font-bold outline-none"
            placeholder="Amount..."
          />
          <button 
            onClick={investXDC}
            disabled={isInvesting}
            className="bg-white text-black px-8 py-3 rounded-2xl font-black uppercase text-xs hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
          >
            {isInvesting ? "SENDING..." : "SUPPORT"}
          </button>
        </div>

        {post.donors && post.donors.length > 0 && (
            <div className="mb-8">
                <p className="text-[10px] text-zinc-500 uppercase font-black mb-3 tracking-tighter">Recent Backers</p>
                <div className="flex flex-wrap gap-2">
                    {post.donors.slice(-3).map((donor: any, i: number) => (
                        <div key={i} className="bg-zinc-800/50 border border-zinc-700/50 px-3 py-1.5 rounded-xl flex items-center gap-2">
                            <span className="text-blue-400 font-mono text-[10px]">{donor.investor.slice(0,6)}</span>
                            <span className="text-zinc-400 text-[10px] font-bold">{formatEther(donor.amount)} XDC</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="border-t border-zinc-800 pt-8">
            <div className="flex gap-3 mb-6">
                <input 
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all"
                />
                <button 
                    onClick={submitComment}
                    disabled={isCommenting}
                    className="text-blue-500 font-black uppercase text-xs hover:text-blue-400 disabled:opacity-50"
                >
                    {isCommenting ? "..." : "Post"}
                </button>
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {post.comments && post.comments.length > 0 ? (
                    post.comments.map((c: any, i: number) => (
                        <div key={i} className="bg-black/20 p-4 rounded-2xl border border-zinc-800/50">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-blue-400 text-[10px] font-bold font-mono">@{c.commenter.slice(0, 8)}</span>
                                <span className="text-zinc-600 text-[9px] uppercase font-bold">
                                    {new Date(Number(c.timestamp) * 1000).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-zinc-400 text-sm">{c.text}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-zinc-700 text-xs italic">No comments yet.</p>
                )}
            </div>
        </div>

        <p className="text-center text-[9px] text-zinc-600 mt-8 uppercase font-bold tracking-widest">
           Automated Settlement • 95% Creator • 5% Protocol
        </p>
      </div>
    </div>
  );
} 