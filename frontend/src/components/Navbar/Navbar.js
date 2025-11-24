"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faSeedling } from "@fortawesome/free-solid-svg-icons";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [hasAnnonce, setHasAnnonce] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          setUser(null);
          setHasAnnonce(false);
          return;
        }
        const u = JSON.parse(storedUser);
        setUser(u);

        const uid = u?.id ?? u?.id_utilisateur;
        const role = u?.role ?? "";

        if (!uid || !role) {
          setHasAnnonce(false);
          return;
        }

        fetch(`http://localhost:5001/api/navbar?userId=${uid}&role=${role}`)
          .then((res) => (res.ok ? res.json() : Promise.resolve({ hasAnnonce: false })))
          .then((data) => setHasAnnonce(!!data?.hasAnnonce))
          .catch(() => setHasAnnonce(false));
      } catch {
        setUser(null);
        setHasAnnonce(false);
      }
    };

    loadUser();
    const onStorage = (e) => { if (e.key === "user") loadUser(); };
    const onAuthChanged = () => loadUser();

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth:changed", onAuthChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth:changed", onAuthChanged);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setMenuOpen(false);
    window.dispatchEvent(new Event("auth:changed"));
    window.location.href = "/";
  };

  const isLogged = !!user;

  // CTA dynamique (masqué sur /ajout_jardins ET /ajout_jardinier)
  const cta =
    !user || pathname === "/ajout_jardins" || pathname === "/ajout_jardinier"
      ? null
      : {
          href: user.role === "proprietaire" ? "/ajout_jardins" : "/ajout_jardinier",
          label:
            user.role === "proprietaire"
              ? hasAnnonce
                ? "Modifier mon jardin"
                : "Ajouter mon jardin"
              : hasAnnonce
              ? "Modifier mon annonce"
              : "Proposer mes services",
        };

  const burgerItems = !isLogged
    ? [
        { href: "/jardins", label: "Jardins" },
        { href: "/jardiniers", label: "Jardiniers" },
        { href: "/connexion", label: "Se connecter" },
        { href: "/inscription", label: "S’inscrire" },
      ]
    : user.role === "proprietaire"
    ? [
        { href: "/profil", label: "Mon profil" },                               // 🆕
        ...(hasAnnonce ? [{ href: "/mon-jardin", label: "Mon jardin" }] : []),
        { href: "/jardiniers", label: "Consulter les jardiniers" },
        { href: "/reservations", label: "Mes réservations" },
        { href: "/messages", label: "Ma messagerie" },
        { href: "/ajout_jardins", label: cta?.label || "Ajouter / Modifier", accent: true },
      ]
    : [
        { href: "/profil", label: "Mon profil" },                               // 🆕
        { href: "/jardins", label: "Consulter les jardins" },
        { href: "/reservations", label: "Mes réservations" },
        { href: "/messages", label: "Ma messagerie" },
        { href: "/ajout_jardinier", label: cta?.label || "Proposer mes services", accent: true },
      ];

  return (
    <nav className="w-full bg-green-600 text-white fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <FontAwesomeIcon icon={faSeedling} size="lg" className="mr-2" />
          <span className="text-xl font-bold">JardinSolidaire</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* CTA desktop */}
          <div className="hidden md:flex items-center gap-3">
            {!isLogged ? (
              <>
                <Link href="/connexion" className="bg-[#e3107d] hover:bg-pink-700 text-white px-4 py-2 rounded">
                  Se connecter
                </Link>
                <Link href="/inscription" className="bg-[#e3107d] hover:bg-pink-700 text-white px-4 py-2 rounded">
                  S’inscrire
                </Link>
              </>
            ) : cta ? (
              <Link href={cta.href} className="bg-[#e3107d] hover:bg-pink-700 text-white px-4 py-2 rounded">
                {cta.label}
              </Link>
            ) : null}
          </div>

          {/* Burger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-10 h-10 grid place-items-center rounded border border-white/30"
            aria-label="menu"
          >
            <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} size="lg" />
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="bg-green-600 w-full absolute top-16 left-0 shadow-lg">
          <ul className="flex flex-col space-y-2 p-4">
            {burgerItems.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block ${it.accent ? "font-semibold text-pink-200 hover:text-white" : "text-white/90 hover:text-white"}`}
                >
                  {it.label}
                </Link>
              </li>
            ))}

            {isLogged && (
              <li>
                <button
                  onClick={handleLogout}
                  className="block text-left w-full text-white/90 hover:text-white"
                >
                  Déconnexion
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
