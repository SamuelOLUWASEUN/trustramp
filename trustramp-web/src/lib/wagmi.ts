import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { monadTestnet, monadMainnet } from "./chains";

// Default network is testnet for the hackathon. Switch the `chains` order or the
// active chain in components if you deploy to mainnet.
export const config = createConfig({
  chains: [monadTestnet, monadMainnet],
  connectors: [injected()],
  transports: {
    [monadTestnet.id]: http(),
    [monadMainnet.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
