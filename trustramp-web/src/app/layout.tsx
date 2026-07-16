import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trustramp — escrow for P2P remittance",
  description:
    "Trustless escrow for P2P crypto to fiat trades. Lock funds onchain, confirm the fiat leg, release when it arrives.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      // Rendered server-side so the attribute already exists in the SSR HTML and
      // the pre-paint script below only ever *changes* it, never adds it.
      data-theme="dark"
      // The script intentionally mutates this element before React hydrates (that's
      // the whole point — it prevents a flash of the wrong theme). React can't know
      // that's deliberate, so it errors on the mismatch. This scopes the exemption
      // to this element's own attributes only; children still get full checking.
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          // Runs before paint so we never flash the wrong theme. Reads the saved
          // preference; falls back to dark, which is the intended default.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('trustramp-theme');if(t==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
