"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function HomeImage() {
  const [isLogged, setIsLogged] = useState(false);
  const [role, setRole] = useState(null); // "ami_du_vert" | "proprietaire" | null

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        setIsLogged(false);
        setRole(null);
        return;
      }
      const u = JSON.parse(raw);
      setIsLogged(true);
      setRole(u?.role ?? null);
    } catch {
      setIsLogged(false);
      setRole(null);
    }
  }, []);

  const showJardins = !isLogged || role === "ami_du_vert";
  const showJardiniers = !isLogged || role === "proprietaire";

  return (
    <div className="relative w-full h-80 md:h-96 lg:h-[500px]">
      <Image
        src="/assets/garden.jpg"
        alt="Image de fond"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex space-x-6">
          {showJardins && (
            <Link
              href="/jardins"
              className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded"
            >
              Nos jardins
            </Link>
          )}
          {showJardiniers && (
            <Link
              href="/jardiniers"
              className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded"
            >
              Nos Jardiniers
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
