"use client";

import Link from "next/link";

const Footer = () => {
  return (
    <footer className="w-full bg-green-600 text-white">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-center">
        <div className="flex space-x-8">
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
          <Link href="/help" className="hover:underline">
            Centre d&apos;aide
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
