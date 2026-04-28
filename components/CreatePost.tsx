"use client";
import { useState, useRef } from 'react';
import { getWalletClient, publicClient } from '@/lib/client';

const POST_ABI = [
  { 
    name: 'createPost', 
    type: 'function', 
    stateMutability: 'nonpayable', 
    inputs: [
      { name: '_content', type: 'string' },
      { name: '_mediaHash', type: 'string' } 
    ] 
  }
] as const;

export default function CreatePost({ account, onSuccess }: { account: string, onSuccess: () => void }) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToIPFS = async (fileToUpload: File) => {
    const formData = new FormData();
    formData.append("file", fileToUpload);

    // Replace YOUR_PINATA_JWT with your actual JWT from Pinata dashboard
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJkMWE2N2E5ZC1kOTFiLTQzNGQtODkzOC04ZDcxZDIyOTc3YTciLCJlbWFpbCI6ImFuZHJld2JhbHNvbjIwMDBAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjE0N2I3MTU3MjQ3ZTlmMmI0Nzg4Iiwic2NvcGVkS2V5U2VjcmV0IjoiMWVmM2I4ODgzNmJiNjgxYzc0ZTg2ZmQ2ZTA1N2NkOWIzNjQxMWE0ODQ3NjE2NDA5NjU2Y2YwYzhmODMxYTYwNCIsImV4cCI6MTgwODg3MTEzMn0.6xIf4hDroTr8c1PG7rb8qO2VVSSTPBVeGZeET6_hVzk`,
      },
      body: formData,
    });

    if (!res.ok) throw new Error("IPFS Upload Failed");
    const data = await res.json();
    return data.IpfsHash; // This is the CID (the "image address")
  };

  const broadcast = async () => {
    if (!content && !file) return;
    setLoading(true);

    try {
      let cid = "";
      if (file) {
        cid = await uploadToIPFS(file);
      }

      const client = await getWalletClient();
      if (!client) return;
      
      const hash = await client.writeContract({
        address: process.env.NEXT_PUBLIC_POSTS_ADDR as `0x${string}`,
        abi: POST_ABI,
        functionName: 'createPost',
        args: [content, cid], // Sending the CID instead of an empty string
        account: account as `0x${string}`,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      
      // Reset state
      setContent('');
      setFile(null);
      onSuccess();
    } catch (e) { 
      console.error(e);
      alert("Broadcast failed."); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 mb-10 shadow-2xl">
      <textarea 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening in the venture?"
        className="w-full bg-black rounded-2xl p-5 text-white border border-zinc-800 focus:border-blue-500 outline-none mb-4 resize-none h-32"
      />

      <div className="flex gap-4 mb-4">
        <input 
          type="file" 
          hidden 
          ref={fileInputRef}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          accept="image/*"
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-3 bg-zinc-800 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-all border border-zinc-700"
        >
          {file ? `📸 ${file.name.slice(0, 15)}...` : "📁 ADD PHOTO"}
        </button>
      </div>

      <button 
        onClick={broadcast} 
        disabled={loading} 
        className="w-full bg-blue-600 py-4 rounded-xl font-black hover:bg-blue-500 disabled:opacity-50 transition-all"
      >
        {loading ? "UPLOADING TO MESH..." : "POST TO FEED"}
      </button>
    </div>
  );
}