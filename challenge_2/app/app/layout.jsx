import "./globals.css";
import { Providers } from "./providers";
import Nav from "../components/Nav";

export const metadata = {
  title: "Zenithium: estate settlement without blind trust",
  description: "Sealed family documents that open only when a quorum of heirs agrees. Built with TideCloak.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          <main className="container">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
