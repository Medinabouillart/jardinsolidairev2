"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

const API = "http://localhost:5001";
const TYPES = ["potager", "ornement", "mixte"];

export default function AjoutJardinsPage() {
  const [user, setUser] = useState(null);

  // Profil
  const [photo_profil, setPhotoProfil] = useState("");
  const [biographie, setBiographie] = useState("");

  // Jardin
  const [jardinId, setJardinId] = useState(null);
  const [isPosted, setIsPosted] = useState(false);
  const [titre, setTitre] = useState("");
  const [adresse, setAdresse] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]); // [{name,dataUrl}]

  // Champs recherche / FiltersBar
  const [type, setType] = useState("");
  const [ville, setVille] = useState("");
  const [code_postal, setCodePostal] = useState("");
  const [superficie, setSuperficie] = useState("");

  // Critères (compétences)
  const [competences_ids, setCompetencesIds] = useState([]);

  // Disponibilités du jardin
  const [disponibilites, setDisponibilites] = useState([]); // [{id_dispo?, start, end}]

  const fileRef = useRef(null);
  const profileFileRef = useRef(null); // ref pour la photo de profil

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Styles
  const styles = {
    page: { backgroundColor: "#f5f5f5", minHeight: "100vh", paddingTop: "80px" },
    wrap: { maxWidth: "1100px", margin: "0 auto", padding: "24px 16px" },
    h1: { fontSize: "24px", color: "#021904", marginBottom: "6px" },
    intro: { color: "#4e784f", marginBottom: "18px", lineHeight: 1.5 },
    card: { background: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" },
    label: { display: "block", fontSize: "14px", color: "#021904", marginBottom: "6px" },
    input: {
      width: "100%",
      height: "44px",
      padding: "10px 12px",
      boxSizing: "border-box",
      border: "2px solid #6ec173",
      borderRadius: "10px",
      fontSize: "16px",
      color: "#021904",
      background: "#fff",
    },
    textarea: {
      width: "100%",
      padding: "10px 12px",
      minHeight: "120px",
      boxSizing: "border-box",
      border: "2px solid #6ec173",
      borderRadius: "10px",
      fontSize: "16px",
      color: "#021904",
      background: "#fff",
    },
    select: {
      width: "100%",
      height: "44px",
      padding: "10px 12px",
      boxSizing: "border-box",
      border: "2px solid #6ec173",
      borderRadius: "10px",
      fontSize: "16px",
      color: "#021904",
      background: "#fff",
    },
    btnPrimary: {
      padding: "10px 14px",
      background: "#e3107d",
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      fontSize: "16px",
      cursor: "pointer",
    },
    btnGhost: {
      padding: "10px 14px",
      background: "#fff",
      color: "#021904",
      border: "2px solid #6ec173",
      borderRadius: "10px",
      fontSize: "16px",
      cursor: "pointer",
    },
    chipsWrap: { display: "flex", flexWrap: "wrap", gap: "8px" },
    chip: (active) => ({
      padding: "6px 10px",
      borderRadius: "999px",
      border: active ? "2px solid transparent" : "2px solid #6ec173",
      background: active ? "#e3107d" : "#fff",
      color: active ? "#fff" : "#021904",
      fontSize: "14px",
      cursor: "pointer",
    }),
    grid: { display: "grid", gap: "16px", gridTemplateColumns: "repeat(1, minmax(0,1fr))" },
    grid2: { display: "grid", gap: "16px", gridTemplateColumns: "repeat(1, minmax(0,1fr))" },
    grid3: { display: "grid", gap: "12px", gridTemplateColumns: "repeat(1, minmax(0,1fr))" },
    topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" },
    link: { color: "#021904", textDecoration: "underline", fontSize: "14px" },
    msgError: { color: "red" },
    msgOk: { color: "#147a4b" },
  };

  if (typeof window !== "undefined" && window.innerWidth >= 768) {
    styles.grid.gridTemplateColumns = "repeat(2, minmax(0,1fr))";
    styles.grid3.gridTemplateColumns = "repeat(3, minmax(0,1fr))";
  }

  const handleJsonOrError = async (res, label) => {
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      console.error(`[AjoutJardins] ${label} - parse JSON échoué`, e);
    }
    if (!res.ok) {
      console.error(`[AjoutJardins] ${label} - erreur API`, { status: res.status, data });
      throw new Error(data?.error || data?.message || `${label} (${res.status})`);
    }
    return data || {};
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;
      const u = JSON.parse(raw);
      setUser(u);

      setPhotoProfil(u?.photo_profil || "");
      setBiographie(u?.biographie || "");

      const uid = u.id ?? u.id_utilisateur;

      fetch(`${API}/api/ajout_jardins/mon?owner=${uid}`)
        .then(async (r) => {
          if (r.status === 204) return null;
          let data = null;
          try {
            data = await r.json();
          } catch (e) {
            console.error("[AjoutJardins] GET /ajout_jardins/mon - parse JSON", e);
          }
          if (!r.ok) {
            console.error("[AjoutJardins] GET /ajout_jardins/mon - erreur API", {
              status: r.status,
              data,
            });
            return null;
          }
          return data;
        })
        .then((data) => {
          if (!data) return;
          setJardinId(data.id_jardin || null);
          setIsPosted(Boolean(data.is_posted));
          setTitre(data.titre || "");
          setAdresse(data.adresse || "");
          setDescription(data.description || "");
          setType(data.type || "");
          setVille(data.ville || "");
          setCodePostal(data.code_postal || "");
          setSuperficie(data.superficie ?? "");
          setCompetencesIds(Array.isArray(data.competences_ids) ? data.competences_ids : []);

          if (Array.isArray(data.photos)) {
            setPhotos(
              data.photos.map((p, i) => ({
                name: p.name || `photo-${i}`,
                dataUrl: p.dataUrl || p.url || "",
              }))
            );
          }

          if (Array.isArray(data.disponibilites)) {
            setDisponibilites(
              data.disponibilites.map((d) => ({
                id_dispo: d.id_dispo,
                start: d.start ? String(d.start).slice(0, 16) : "",
                end: d.end ? String(d.end).slice(0, 16) : "",
              }))
            );
          }
        })
        .catch((e) => {
          console.error("[AjoutJardins] GET /ajout_jardins/mon - fetch planté", e);
        });
    } catch (e) {
      console.error("[AjoutJardins] init useEffect", e);
    }
  }, []);

  const handleFiles = async (files) => {
    const arr = Array.from(files || []);
    const readers = await Promise.all(
      arr.map(
        (f) =>
          new Promise((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve({ name: f.name, dataUrl: r.result });
            r.readAsDataURL(f);
          })
      )
    );
    setPhotos((p) => [...p, ...readers]);
  };

  // handler pour la photo de profil
  const handleProfileFile = (files) => {
    const f = files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      setPhotoProfil(r.result);
    };
    r.readAsDataURL(f);
  };

  const removePhotoAt = (idx) =>
    setPhotos((p) => p.filter((_, i) => i !== idx));

  const toggleCritere = (id) => {
    setCompetencesIds((prev) => {
      const S = new Set(prev);
      S.has(id) ? S.delete(id) : S.add(id);
      return Array.from(S);
    });
  };

  // Disponibilités helpers
  const addDispo = () => {
    setDisponibilites((prev) => [...prev, { id_dispo: null, start: "", end: "" }]);
  };

  const updateDispoField = (index, field, value) => {
    setDisponibilites((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const removeDispoAt = (index) => {
    setDisponibilites((prev) => prev.filter((_, i) => i !== index));
  };

  const canPost = () =>
    (photo_profil?.trim() || "").length > 0 &&
    (biographie?.trim() || "").length > 0 &&
    (titre?.trim() || "").length > 0 &&
    (adresse?.trim() || "").length > 0 &&
    (description?.trim() || "").length > 0 &&
    photos.length > 0 &&
    competences_ids.length > 0 &&
    (type?.trim() || "").length > 0 &&
    (ville?.trim() || "").length > 0 &&
    (code_postal?.trim() || "").length > 0 &&
    String(superficie || "").trim().length > 0;

  // MAJ du localStorage après sauvegarde
  const updateLocalUserProfile = () => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try {
      const u = JSON.parse(raw);
      const updated = {
        ...u,
        photo_profil,
        biographie,
      };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
    } catch (e) {
      console.error("[AjoutJardins] updateLocalUserProfile - erreur", e);
    }
  };

  const basePayload = (uid, postFlag) => ({
    id_proprietaire: uid,
    photo_profil,
    biographie,
    titre,
    adresse,
    description,
    photos,
    competences_ids,
    type,
    ville,
    code_postal,
    superficie,
    is_posted: postFlag,
    disponibilites: disponibilites
      .filter((d) => d.start && d.end)
      .map((d) => ({
        id_dispo: d.id_dispo ?? null,
        start: d.start,
        end: d.end,
      })),
  });

  const onSaveDraft = async () => {
    if (!user) return;
    setSaving(true);
    setMsg({ type: "", text: "" });
    const uid = user.id ?? user.id_utilisateur;

    try {
      const res = await fetch(
        `${API}/api/ajout_jardins${jardinId ? `/${jardinId}` : ""}`,
        {
          method: jardinId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(basePayload(uid, false)),
        }
      );
      const data = await handleJsonOrError(res, "Erreur enregistrement brouillon");

      if (data?.id_jardin) setJardinId(data.id_jardin);
      setIsPosted(false);
      updateLocalUserProfile();
      setMsg({ type: "success", text: "Brouillon enregistré ✅" });
    } catch (e) {
      console.error("[AjoutJardins] onSaveDraft", e);
      setMsg({ type: "error", text: e.message || "Erreur inconnue." });
    } finally {
      setSaving(false);
    }
  };

  const onPost = async () => {
    if (!user) return;
    if (!canPost()) {
      setMsg({ type: "error", text: "Complète tous les champs requis pour publier 🌿" });
      return;
    }
    setSaving(true);
    setMsg({ type: "", text: "" });
    const uid = user.id ?? user.id_utilisateur;

    try {
      const res = await fetch(
        `${API}/api/ajout_jardins${jardinId ? `/${jardinId}` : ""}`,
        {
          method: jardinId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(basePayload(uid, true)),
        }
      );
      const data = await handleJsonOrError(res, "Erreur publication");
      if (data?.id_jardin) setJardinId(data.id_jardin);
      setIsPosted(true);
      updateLocalUserProfile();
      setMsg({ type: "success", text: "Jardin publié avec succès 🌱✨" });
    } catch (e) {
      console.error("[AjoutJardins] onPost", e);
      setMsg({ type: "error", text: e.message || "Erreur inconnue." });
    } finally {
      setSaving(false);
    }
  };

  const onWithdraw = async () => {
    if (!user || !jardinId) return;
    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      const res = await fetch(`${API}/api/ajout_jardins/${jardinId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_posted: false }),
      });
      await handleJsonOrError(res, "Erreur retrait du jardin");
      setIsPosted(false);
      setMsg({ type: "success", text: "Jardin retiré (non publié) 🌼" });
    } catch (e) {
      console.error("[AjoutJardins] onWithdraw", e);
      setMsg({ type: "error", text: e.message || "Erreur inconnue." });
    } finally {
      setSaving(false);
    }
  };

  const onPostModifs = async () => {
    if (!user || !jardinId) return;
    if (!canPost()) {
      setMsg({ type: "error", text: "Complète tous les champs requis avant de republier 🌿" });
      return;
    }
    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      const uid = user.id ?? user.id_utilisateur;

      const res = await fetch(`${API}/api/ajout_jardins/${jardinId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(basePayload(uid, true)),
      });
      await handleJsonOrError(res, "Erreur publication des modifications");
      setIsPosted(true);
      updateLocalUserProfile();
      setMsg({ type: "success", text: "Modifications publiées 🌸" });
    } catch (e) {
      console.error("[AjoutJardins] onPostModifs", e);
      setMsg({ type: "error", text: e.message || "Erreur inconnue." });
    } finally {
      setSaving(false);
    }
  };

  const Actions = () => {
    if (!isPosted) {
      return (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button" onClick={onSaveDraft} disabled={saving} style={styles.btnGhost}>
            {saving ? "Enregistrement..." : "Enregistrer le brouillon"}
          </button>
          <button type="button" onClick={onPost} disabled={saving} style={styles.btnPrimary}>
            {saving ? "Publication..." : "Poster"}
          </button>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button type="button" onClick={onWithdraw} disabled={saving} style={styles.btnGhost}>
          {saving ? "Traitement..." : "Retirer le jardin"}
        </button>
        <button type="button" onClick={onPostModifs} disabled={saving} style={styles.btnPrimary}>
          {saving ? "Publication..." : "Poster les modifications"}
        </button>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.wrap}>
          <div style={styles.topRow}>
            <h1 style={styles.h1}>Ajouter / Modifier mon jardin 🌿</h1>
            {/* lien "Voir mon jardin" supprimé comme demandé */}
          </div>
          <p style={styles.intro}>
            Donne vie à ton annonce : un joli titre, quelques photos, et hop — ton jardin rencontre la bonne personne ✨
          </p>

          <form
            onSubmit={(e) => e.preventDefault()}
            style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr", marginBottom: 16 }}
          >
            <div style={styles.grid}>
              {/* Profil */}
              <section style={styles.card}>
                <h2 style={{ ...styles.h1, fontSize: 18, marginBottom: 10 }}>Mon profil 👩🏽‍🌾</h2>

                <label style={styles.label}>Photo de profil</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid #6ec173",
                      background: "#f0f0f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      color: "#4e784f",
                    }}
                  >
                    {photo_profil ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo_profil}
                        alt="Profil"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      "Aucune photo"
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => profileFileRef.current?.click()}
                      style={styles.btnGhost}
                    >
                      Choisir une photo
                    </button>
                    {photo_profil && (
                      <button
                        type="button"
                        onClick={() => setPhotoProfil("")}
                        style={{ ...styles.btnGhost, padding: "4px 10px", fontSize: 14 }}
                      >
                        Supprimer la photo
                      </button>
                    )}
                  </div>

                  <input
                    ref={profileFileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleProfileFile(e.target.files)}
                  />
                </div>

                <div style={{ height: 12 }} />
                <label style={styles.label}>Biographie</label>
                <textarea
                  value={biographie}
                  onChange={(e) => setBiographie(e.target.value)}
                  placeholder="Parle un peu de toi…"
                  style={styles.textarea}
                />
              </section>

              {/* Jardin */}
              <section style={styles.card}>
                <h2 style={{ ...styles.h1, fontSize: 18, marginBottom: 10 }}>Mon jardin 🌱</h2>

                <label style={styles.label}>Photos du jardin</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {photos.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        width: 96,
                        height: 96,
                        border: "1px solid #e5e5e5",
                        borderRadius: 10,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.dataUrl}
                        alt={p.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        onClick={() => removePhotoAt(i)}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          background: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 12,
                          padding: "0 6px",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => fileRef.current?.click()} style={styles.btnGhost}>
                    + Ajouter
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => handleFiles(e.target.files)}
                />

                <div style={{ height: 12 }} />
                <label style={styles.label}>Titre de l’annonce</label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: Cherche aide pour mon potager"
                  style={styles.input}
                />

                <div style={{ height: 12 }} />
                <label style={styles.label}>Adresse du jardin</label>
                <input
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder="Adresse complète"
                  style={styles.input}
                />

                <div style={{ height: 12 }} />
                <div style={styles.grid3}>
                  <div>
                    <label style={styles.label}>Ville</label>
                    <input
                      type="text"
                      value={ville}
                      onChange={(e) => setVille(e.target.value)}
                      placeholder="Ville"
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Code postal</label>
                    <input
                      type="text"
                      value={code_postal}
                      onChange={(e) => setCodePostal(e.target.value)}
                      placeholder="Code postal"
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Superficie (m²)</label>
                    <input
                      type="number"
                      min="0"
                      value={superficie}
                      onChange={(e) => setSuperficie(e.target.value)}
                      placeholder="Ex: 120"
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={{ height: 12 }} />
                <label style={styles.label}>Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={styles.select}
                >
                  <option value="">— Sélectionner —</option>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <div style={{ height: 12 }} />
                <label style={styles.label}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décris ton jardin et ce que tu attends."
                  style={styles.textarea}
                />

                <div style={{ height: 12 }} />
                <label style={styles.label}>Critères</label>
                <div style={styles.chipsWrap}>
                  {[1, 2, 3, 4, 5].map((id) => {
                    const labels = {
                      1: "Potager",
                      2: "Arbres / Taille",
                      3: "Plantation",
                      4: "Désherbage",
                      5: "Arrosage",
                    };
                    const active = (competences_ids || []).includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleCritere(id)}
                        style={styles.chip(active)}
                      >
                        {labels[id]}
                      </button>
                    );
                  })}
                </div>

                {/* Disponibilités */}
                <div style={{ height: 12 }} />
                <label style={styles.label}>Disponibilités du jardin</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {disponibilites.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <input
                        type="datetime-local"
                        value={d.start}
                        onChange={(e) => updateDispoField(i, "start", e.target.value)}
                        style={{ ...styles.input, maxWidth: 230 }}
                      />
                      <span>→</span>
                      <input
                        type="datetime-local"
                        value={d.end}
                        onChange={(e) => updateDispoField(i, "end", e.target.value)}
                        style={{ ...styles.input, maxWidth: 230 }}
                      />
                      <button
                        type="button"
                        onClick={() => removeDispoAt(i)}
                        style={{ ...styles.btnGhost, padding: "6px 10px" }}
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addDispo} style={styles.btnGhost}>
                    + Ajouter un créneau
                  </button>
                </div>
              </section>
            </div>

            <section
              style={{
                ...styles.card,
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Actions />
              {msg.text && (
                <p style={msg.type === "error" ? styles.msgError : styles.msgOk}>
                  {msg.text}
                </p>
              )}
            </section>
          </form>

          <p style={{ color: "#4e784f" }}>
            Astuce 💡: des photos lumineuses et un titre précis attirent plus de demandes.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
