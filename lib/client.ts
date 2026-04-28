import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { xdcTestnet } from 'viem/chains'; 

export const publicClient = createPublicClient({
  chain: xdcTestnet,
  transport: http('https://erpc.apothem.network'),
});

export const getWalletClient = async () => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return createWalletClient({
      chain: xdcTestnet,
      transport: custom((window as any).ethereum),
    });
  }
  return null;
};