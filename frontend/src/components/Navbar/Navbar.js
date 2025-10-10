"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faSeedling } from "@fortawesome/free-solid-svg-icons";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [hasAnnonce, setHasAnnonce] = useState(false);

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        setUser(u);
        const uid = u.id ?? u.id_utilisateur;

        fetch(`http://localhost:5001/api/navbar?userId=${uid}&role=${u.role}`)
          .then((res) =>
            res.ok ? res.json() : Promise.resolve({ hasAnnonce: false })
          )
          .then((data) => setHasAnnonce(!!data.hasAnnonce))
          .catch(() => setHasAnnonce(false));
      } else {
        setUser(null);
        setHasAnnonce(false);
      }
    };

    loadUser();

    const onStorage = (e) => {
      if (e.key === "user") loadUser();
    };
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
    window.dispatchEvent(new Event("auth:changed")); // notifie Navbar
    window.location.href = "/";
  };

  const isLogged = !!user;

  const cta = (() => {
    if (!user) return null;
    if (user.role === "proprietaire") {
      return {
        href: hasAnnonce ? "/modifier-jardin" : "/ajouter-jardin",
        label: hasAnnonce ? "Modifier mon jardin" : "Ajouter mon jardin",
      };
    }
    if (user.role === "ami_du_vert") {
      return {
        href: hasAnnonce ? "/modifier-jardinier" : "/ajouter-jardinier",
        label: hasAnnonce ? "Modifier mon annonce" : "Proposer mes services",
      };
    }
    return null;
  })();

  const burgerItems = !isLogged
    ? [
        { href: "/jardins", label: "Jardins" },
        { href: "/jardiniers", label: "Jardiniers" },
        { href: "/connexion", label: "Se connecter" },
        { href: "/inscription", label: "S’inscrire" },
      ]
    : user.role === "proprietaire"
    ? [
        ...(hasAnnonce ? [{ href: "/mon-jardin", label: "Mon jardin" }] : []),
        { href: "/jardiniers", label: "Consulter les jardiniers" },
        { href: "/reservations", label: "Mes réservations" },
        { href: "/messages", label: "Ma messagerie" },
        { href: "/mon-profil", label: "Mon profil" },
        { href: "/favoris", label: "Mes favoris" },
      ]
    : [
        { href: "/jardins", label: "Consulter les jardins" },
        { href: "/reservations", label: "Mes réservations" },
        { href: "/messages", label: "Ma messagerie" },
        { href: "/favoris", label: "Mes favoris" },
      ];

  return (
    <nav className="w-full bg-green-600 text-white fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <FontAwesomeIcon icon={faSeedling} size="lg" className="mr-2" />
          <span className="text-xl font-bold">JardinSolidaire</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* CTA visible en desktop seulement */}
          <div className="hidden md:flex items-center gap-3">
            {!isLogged ? (
              <>
                <Link
                  href="/connexion"
                  className="bg-[#e3107d] hover:bg-pink-700 text-white px-4 py-2 rounded"
                >
                  Se connecter
                </Link>
                <Link
                  href="/inscription"
                  className="bg-[#e3107d] hover:bg-pink-700 text-white px-4 py-2 rounded"
                >
                  S’inscrire
                </Link>
              </>
            ) : cta ? (
              <Link
                href={cta.href}
                className="bg-[#e3107d] hover:bg-pink-700 text-white px-4 py-2 rounded"
              >
                {cta.label}
              </Link>
            ) : null}
          </div>

          {/* Bouton burger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-10 h-10 grid place-items-center rounded border border-white/30"
            aria-label="menu"
          >
            <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} size="lg" />
          </button>
        </div>
      </div>

      {/* Menu déroulant */}
      {menuOpen && (
        <div className="bg-green-600 w-full absolute top-16 left-0 shadow-lg">
          <ul className="flex flex-col space-y-2 p-4">
            {burgerItems.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block ${
                    it.accent
                      ? "font-semibold text-pink-200 hover:text-white"
                      : "text-white/90 hover:text-white"
                  }`}
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
