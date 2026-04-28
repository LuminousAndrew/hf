export interface VenturePost {
  id: number;
  username: string;
  creatorAddress: `0x${string}`;
  content: string;
  image: string;
  fundingGoal: string;
}

export const MOCK_FEED: VenturePost[] = [
  {
    id: 1,
    username: "balson",
    creatorAddress: "0x215c2ff021637ebeb98ef836f097a0aef44216c9",
    content: "Deploying the first liquid-cooled loop for the Dallas Data Center project. Efficiency targets: +22%.",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc51",
    fundingGoal: "5000 XDC"
  },
  {
    id: 2,
    username: "crypto_builder",
    creatorAddress: "0x123...456", // Replace with a real address for testing
    content: "Hard Fork Protocol is officially live on Apothem. Creator economy starts now.",
    image: "https://images.unsplash.com/photo-1639322537228-f710d846310a",
    fundingGoal: "1000 XDC"
  }
];