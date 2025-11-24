"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

const API = "http://localhost:5001";

// 🔹 mêmes types que dans ton index liste jardiniers
const COMPETENCES = [
  { id: 1, value: "potager",      label: "Potager" },
  { id: 2, value: "fleurs",       label: "Fleurs" },
  { id: 3, value: "permaculture", label: "Permaculture" },
  { id: 4, value: "jardinage",    label: "Apprendre" },
  { id: 5, value: "tondre",       label: "Tondre" },
];

export default function AjoutJardinierPage() {
  const [user, setUser] = useState(null);

  // Profil
  const [photo_profil, setPhotoProfil] = useState("");
  const [biographie, setBiographie] = useState("");
  const [ville, setVille] = useState("");
  const [cp, setCp] = useState("");
  const [age, setAge] = useState("");

  // Compétences & dispos
  const [competences_ids, setCompetencesIds] = useState([]);
  const [disponibilites, setDisponibilites] = useState([]);

  // État annonce
  const [jardinierId, setJardinierId] = useState(null);
  const [isPosted, setIsPosted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const profileFileRef = useRef(null);

  /* ========= Styles ========= */
  const styles = {
    page: { backgroundColor: "#f5f5f5", minHeight: "100vh", paddingTop: "80px" },
    wrap: { maxWidth: "1100px", margin: "0 auto", padding: "24px 16px" },
    h1: { fontSize: "24px", color: "#021904", marginBottom: "6px" },
    intro: { color: "#4e784f", marginBottom: "18px", lineHeight: 1.5 },
    card: {
      background: "#fff",
      borderRadius: "16px",
      padding: "16px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    },
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
    grid: {
      display: "grid",
      gap: "16px",
      gridTemplateColumns: "repeat(1, minmax(0,1fr))",
    },
    msgError: { color: "red" },
    msgOk: { color: "#147a4b" },
  };

  if (typeof window !== "undefined" && window.innerWidth >= 768) {
    styles.grid.gridTemplateColumns = "repeat(2, minmax(0,1fr))";
  }

  /* ========= Utils JSON / API ========= */
  const handleJsonOrError = async (res, label) => {
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      console.error(`[AjoutJardinier] ${label} - parse JSON échoué`, e);
    }
    if (!res.ok) {
      console.error(`[AjoutJardinier] ${label} - erreur API`, {
        status: res.status,
        data,
      });
      throw new Error(data?.error || data?.message || `${label} (${res.status})`);
    }
    return data || {};
  };

  /* ========= Chargement user + profil jardinier ========= */
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (!raw) return;
      const u = JSON.parse(raw);
      setUser(u);

      setPhotoProfil(u?.photo_profil || "");
      setBiographie(u?.biographie || "");
      setVille(u?.ville || "");
      setCp(u?.cp || u?.code_postal || "");

      if (u?.date_naissance) {
        const birth = new Date(u.date_naissance);
        if (!isNaN(birth.getTime())) {
          const now = new Date();
          let a = now.getFullYear() - birth.getFullYear();
          const m = now.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) a--;
          setAge(String(a));
        }
      }

      const uid = u.id ?? u.id_utilisateur;
      if (!uid) return;

      fetch(`${API}/api/jardiniers/mon?user=${uid}`)
        .then(async (r) => {
          if (r.status === 204) return null;
          try {
            return await r.json();
          } catch (e) {
            console.error("[AjoutJardinier] GET /jardiniers/mon - parse JSON", e);
            return null;
          }
        })
        .then((data) => {
          if (!data) return;
          setJardinierId(data.id_utilisateur || data.id_jardinier || null);
          setIsPosted(Boolean(data.is_posted));

          if (data.photo_profil) setPhotoProfil(data.photo_profil);
          if (data.biographie) setBiographie(data.biographie);
          if (data.ville) setVille(data.ville);
          if (data.cp || data.code_postal) setCp(data.cp || data.code_postal);
          if (data.age) setAge(String(data.age));

          if (Array.isArray(data.competences_ids)) {
            setCompetencesIds(data.competences_ids);
          }

          if (Array.isArray(data.disponibilites)) {
            setDisponibilites(
              data.disponibilites.map((d) => ({
                id_dispo: d.id_dispo ?? null,
                start: d.start ? String(d.start).slice(0, 16) : "",
                end: d.end ? String(d.end).slice(0, 16) : "",
              }))
            );
          }
        })
        .catch((e) => {
          console.error("[AjoutJardinier] GET /jardiniers/mon", e);
        });
    } catch (e) {
      console.error("[AjoutJardinier] useEffect init - erreur", e);
    }
  }, []);

  /* ========= Helpers ========= */
  const handleProfileFile = (files) => {
    const f = files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      setPhotoProfil(r.result);
    };
    r.readAsDataURL(f);
  };

  const toggleCompetence = (id) => {
    setCompetencesIds((prev) => {
      const S = new Set(prev);
      if (S.has(id)) S.delete(id);
      else S.add(id);
      return Array.from(S);
    });
  };

  const addDispo = () => {
    setDisponibilites((prev) => [...prev, { id_dispo: null, start: "", end: "" }]);
  };

  const updateDispoField = (index, field, value) => {
    setDisponibilites((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const removeDispo = (index) => {
    setDisponibilites((prev) => prev.filter((_, i) => i !== index));
  };

  const canPost = () => {
    if (!biographie.trim()) return false;
    if (!ville.trim()) return false;
    if (!age) return false;
    if (!competences_ids || competences_ids.length === 0) return false;
    if (!disponibilites.some((d) => d.start && d.end)) return false;
    return true;
  };

  const updateLocalUserProfile = () => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!raw) return;
    try {
      const u = JSON.parse(raw);
      const updated = {
        ...u,
        photo_profil,
        biographie,
        ville,
        cp,
      };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
    } catch (e) {
      console.error("[AjoutJardinier] updateLocalUserProfile - erreur", e);
    }
  };

  const basePayload = (uid, postFlag) => ({
    id_utilisateur: uid,
    photo_profil,
    biographie,
    ville,
    cp,
    age,
    competences_ids,
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
        `${API}/api/jardiniers${jardinierId ? `/${jardinierId}` : ""}`,
        {
          method: jardinierId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(basePayload(uid, false)),
        }
      );
      const data = await handleJsonOrError(res, "Erreur enregistrement brouillon");
      if (data?.id_utilisateur || data?.id_jardinier) {
        setJardinierId(data.id_utilisateur || data.id_jardinier);
      }
      setIsPosted(false);
      setMsg({ type: "success", text: "Brouillon enregistré ✅" });
    } catch (e) {
      console.error("[AjoutJardinier] onSaveDraft", e);
      setMsg({ type: "error", text: e.message || "Erreur inconnue." });
    } finally {
      setSaving(false);
    }
  };

  const onPost = async () => {
    if (!user) return;
    if (!canPost()) {
      setMsg({
        type: "error",
        text: "Complète les champs essentiels pour publier ton profil 🌿",
      });
      return;
    }
    setSaving(true);
    setMsg({ type: "", text: "" });

    const uid = user.id ?? user.id_utilisateur;

    try {
      const res = await fetch(
        `${API}/api/jardiniers${jardinierId ? `/${jardinierId}` : ""}`,
        {
          method: jardinierId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(basePayload(uid, true)),
        }
      );
      const data = await handleJsonOrError(res, "Erreur publication");
      if (data?.id_utilisateur || data?.id_jardinier) {
        setJardinierId(data.id_utilisateur || data.id_jardinier);
      }
      setIsPosted(true);
      updateLocalUserProfile();
      setMsg({ type: "success", text: "Profil jardinier publié 🌸" });
    } catch (e) {
      console.error("[AjoutJardinier] onPost", e);
      setMsg({ type: "error", text: e.message || "Erreur inconnue." });
    } finally {
      setSaving(false);
    }
  };

  const onWithdraw = async () => {
    if (!user || !jardinierId) return;
    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      const res = await fetch(`${API}/api/jardiniers/${jardinierId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_posted: false }),
      });
      await handleJsonOrError(res, "Erreur retrait du profil");
      setIsPosted(false);
      setMsg({ type: "success", text: "Profil retiré (non publié) 🌼" });
    } catch (e) {
      console.error("[AjoutJardinier] onWithdraw", e);
      setMsg({ type: "error", text: e.message || "Erreur inconnue." });
    } finally {
      setSaving(false);
    }
  };

  const onPostModifs = async () => {
    if (!user || !jardinierId) return;
    if (!canPost()) {
      setMsg({
        type: "error",
        text: "Complète les champs essentiels avant de republier 🌿",
      });
      return;
    }
    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      const uid = user.id ?? user.id_utilisateur;

      const res = await fetch(`${API}/api/jardiniers/${jardinierId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(basePayload(uid, true)),
      });
      await handleJsonOrError(res, "Erreur publication des modifications");
      setIsPosted(true);
      updateLocalUserProfile();
      setMsg({ type: "success", text: "Profil mis à jour et publié 🌸" });
    } catch (e) {
      console.error("[AjoutJardinier] onPostModifs", e);
      setMsg({ type: "error", text: e.message || "Erreur inconnue." });
    } finally {
      setSaving(false);
    }
  };

  const renderActions = () => {
    if (!isPosted) {
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={saving || !user}
            style={{
              ...styles.btnGhost,
              opacity: saving || !user ? 0.6 : 1,
              cursor: saving || !user ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Enregistrement..." : "Enregistrer le brouillon"}
          </button>
          <button
            type="button"
            onClick={onPost}
            disabled={saving || !user}
            style={{
              ...styles.btnPrimary,
              opacity: saving || !user ? 0.6 : 1,
              cursor: saving || !user ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Publication..." : "Poster"}
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <button
          type="button"
          onClick={onWithdraw}
          disabled={saving || !user}
          style={{
            ...styles.btnGhost,
            opacity: saving || !user ? 0.6 : 1,
            cursor: saving || !user ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Traitement..." : "Retirer le profil"}
        </button>
        <button
          type="button"
          onClick={onPostModifs}
          disabled={saving || !user}
          style={{
            ...styles.btnPrimary,
            opacity: saving || !user ? 0.6 : 1,
            cursor: saving || !user ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Publication..." : "Poster les modifications"}
        </button>
      </div>
    );
  };

  /* ========= Render ========= */
  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.wrap}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <h1 style={styles.h1}>Créer / modifier mon profil jardinier 🌿</h1>
          </div>

          <p style={styles.intro}>
            Ajoute une photo, une petite description, ta ville, ton code postal,
            tes compétences et quelques créneaux de disponibilité pour que les
            propriétaires puissent te trouver facilement.
          </p>

          {!user && (
            <p style={{ ...styles.msgError, marginBottom: 16 }}>
              Tu dois être connecté pour créer ton profil jardinier.
            </p>
          )}

          <form
            onSubmit={(e) => e.preventDefault()}
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "1fr",
              marginBottom: 16,
            }}
          >
            <div style={styles.grid}>
              {/* Profil jardinier */}
              <section style={styles.card}>
                <h2
                  style={{
                    ...styles.h1,
                    fontSize: 18,
                    marginBottom: 10,
                  }}
                >
                  Mon profil 👩🏽‍🌾
                </h2>

                <label style={styles.label}>Photo de profil</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid #6ec173",
                      background: "#f0f0f0",
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
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          color: "#777",
                        }}
                      >
                        Pas de photo
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    style={styles.btnGhost}
                    onClick={() => profileFileRef.current?.click()}
                  >
                    Choisir une photo
                  </button>
                  <input
                    ref={profileFileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleProfileFile(e.target.files)}
                  />
                </div>

                <div style={{ height: 12 }} />
                <label style={styles.label}>Ville</label>
                <input
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  placeholder="Ex : Beynes"
                  style={styles.input}
                />

                <div style={{ height: 12 }} />
                <label style={styles.label}>Code postal</label>
                <input
                  value={cp}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                    setCp(v);
                  }}
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="Ex : 78650"
                  style={styles.input}
                />

                <div style={{ height: 12 }} />
                <label style={styles.label}>Âge</label>
                <input
                  type="number"
                  min="14"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Ex : 24"
                  style={styles.input}
                />

                <div style={{ height: 12 }} />
                <label style={styles.label}>Description / biographie</label>
                <textarea
                  value={biographie}
                  onChange={(e) => setBiographie(e.target.value)}
                  placeholder="Parle un peu de toi, de ton expérience et de ce que tu aimes faire au jardin…"
                  style={styles.textarea}
                />
              </section>

              {/* Compétences + disponibilités */}
              <section style={styles.card}>
                <h2
                  style={{
                    ...styles.h1,
                    fontSize: 18,
                    marginBottom: 10,
                  }}
                >
                  Compétences & disponibilités 🌱
                </h2>

                <label style={styles.label}>Compétences</label>
                <div style={styles.chipsWrap}>
                  {COMPETENCES.map((c) => {
                    const active = (competences_ids || []).includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCompetence(c.id)}
                        style={styles.chip(active)}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>

                <div style={{ height: 16 }} />
                <label style={styles.label}>Disponibilités</label>
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
                        onClick={() => removeDispo(i)}
                        style={{ ...styles.btnGhost, padding: "6px 10px", fontSize: 14 }}
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addDispo}
                    style={{
                      ...styles.btnGhost,
                      alignSelf: "flex-start",
                      marginTop: 4,
                    }}
                  >
                    + Ajouter un créneau
                  </button>
                </div>
              </section>
            </div>
          </form>

          {renderActions()}

          {msg.text && (
            <p style={msg.type === "error" ? styles.msgError : styles.msgOk}>{msg.text}</p>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
