"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Twitter } from "lucide-react";

const footerLinks = {
  product: [
    { name: "Showroom", href: "/showroom" },
    // { name: "Comment ça marche", href: "/#how-it-works" },
    // { name: "FAQ", href: "/#faq" },
  ],
  legal: [
    // { name: "Mentions légales", href: "/legal" },
    // { name: "CGU", href: "/terms" },
    // { name: "Confidentialité", href: "/privacy" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-surface border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="relative w-8 h-8">
                <Image
                  src="/logo.png"
                  alt="Vaultis"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-semibold text-white">Vaultis</span>
            </Link>
            <p className="text-neutral-500 text-sm max-w-md leading-relaxed">
              La première plateforme de tokenisation de montres de luxe.
              Investissez dans l&apos;horlogerie de prestige avec la sécurité de la blockchain.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white text-sm font-medium mb-4">Produit</h3>
            <ul className="space-y-2.5">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-neutral-500 hover:text-white text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-neutral-600 text-xs">
            © {new Date().getFullYear()} Vaultis. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
