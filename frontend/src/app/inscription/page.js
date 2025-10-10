"use client";
import { useState } from 'react';
import InputField from '../../components/Pageconnexion/InputField';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';
import { useRouter } from 'next/navigation';

export default function Inscription() {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  // Vérifs
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^a-zA-Z\d]/.test(password);
  const hasMinLength = password.length >= 8;
  const isValidPassword = hasUppercase && hasNumber && hasSpecialChar && hasMinLength;
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isValidPassword) { alert("Votre mot de passe ne respecte pas les critères de sécurité."); return; }
    if (!passwordsMatch)  { alert("Les mots de passe ne correspondent pas."); return; }

    try {
      const response = await fetch('http://localhost:5001/api/inscription/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom, nom, email, password, role,
          date_naissance: dateNaissance || null,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        // ✅ auto-login pour que la Navbar change tout de suite
        localStorage.setItem('user', JSON.stringify({
          id: (data.user?.id ?? data.user?.id_utilisateur ?? null),
          role: data.user?.role ?? role,
          prenom: data.user?.prenom ?? prenom
        }));
        window.dispatchEvent(new Event('auth:changed'));

        alert(`Bienvenue ${data.user?.prenom ?? prenom} !`);
        if (role === 'ami_du_vert') router.push('/jardins');
        else if (role === 'proprietaire') router.push('/jardiniers');
      } else {
        setErrorMessage(data.error || 'Erreur lors de l’inscription');
      }
    } catch (error) {
      console.error('Erreur réseau :', error);
      alert('Impossible de contacter le serveur');
    }
  };

  const styles = {
    container: { maxWidth: '520px', margin: '0 auto', padding: '28px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    title: { textAlign: 'center', color: '#021904', marginBottom: '16px', fontSize: '22px' },
    paragraph: { textAlign: 'center', marginBottom: '22px', color: '#021904', fontSize: '16px', lineHeight: '1.5' },
    form: { display: 'flex', flexDirection: 'column' },
    label: { fontSize: '16px', marginBottom: '8px', color: '#021904' },
    list: { fontSize: '16px', marginTop: 0, marginBottom: '12px', paddingLeft: '20px', color: '#021904' },
    input: {
      width: '100%', height: '44px', padding: '10px 12px', boxSizing: 'border-box',
      border: '2px solid #6ec173', borderRadius: '10px', fontSize: '16px', color: '#021904', background: '#fff',
    },
    button: { padding: '10px 12px', backgroundColor: '#6ec173', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', marginTop: '6px' },
    passwordWrapper: { position: 'relative', marginBottom: '16px' },
    toggleButton: { position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6ec173', fontSize: '14px' },
    passwordHint: (ok) => ({ fontSize: '14px', color: ok ? 'green' : 'red', marginTop: 0, marginBottom: '4px' }),
    errorText: { fontSize: '16px', color: 'red', marginBottom: '12px' },
    register: { textAlign: 'center', marginTop: '20px', fontSize: '16px' },
    note: { fontSize: '16px', textAlign: 'center', marginTop: '16px', color: '#021904', lineHeight: '1.5' },
    page: { backgroundColor: '#f5f5f5', minHeight: '100vh', paddingTop: '50px' },
  };

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.container}>
          <h2 style={styles.title}>Bienvenue sur JardinSolidaire !</h2>
          <p style={styles.paragraph}>
            Vous êtes sur le point de rejoindre une communauté qui fait pousser bien plus que des plantes : <br />
            entraide, solidarité et sourires. 🌿🌻
          </p>

          <form style={styles.form} onSubmit={handleSubmit}>
            <label style={styles.label}>Prénom</label>
            <InputField type="text" name="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Votre prénom" required style={styles.input} />

            <label style={styles.label}>Nom</label>
            <InputField type="text" name="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom" required style={styles.input} />

            <label style={styles.label}>Adresse e-mail</label>
            <InputField type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre adresse e-mail" required style={styles.input} />

            <label style={styles.label}>Date de naissance</label>
            <div style={{ marginBottom: '20px' }}>
              <input type="date" name="date_naissance" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} required style={styles.input} />
            </div>

            <label style={styles.label}>Mot de passe</label>
            <ul style={styles.list}>
              <li>Au moins 8 caractères</li>
              <li>Une majuscule</li>
              <li>Un chiffre</li>
              <li>Un caractère spécial</li>
            </ul>

            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
                style={styles.input}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.toggleButton}>
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>

            <p style={styles.passwordHint(hasMinLength)}>✔️ 8 caractères minimum</p>
            <p style={styles.passwordHint(hasUppercase)}>✔️ Une majuscule</p>
            <p style={styles.passwordHint(hasNumber)}>✔️ Un chiffre</p>
            <p style={styles.passwordHint(hasSpecialChar)}>✔️ Un caractère spécial</p>

            <label style={styles.label}>Confirmez votre mot de passe</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre mot de passe"
                required
                style={styles.input}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.toggleButton}>
                {showConfirmPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>

            {!passwordsMatch && confirmPassword && <p style={styles.errorText}>❌ Les mots de passe ne correspondent pas</p>}

            <label style={styles.label}>Quel est votre rôle ?</label>
            <div style={{ marginBottom: '20px' }}>
              <select
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                style={styles.input}
              >
                <option value="">-- Choisissez votre rôle --</option>
                <option value="proprietaire">Je possède un jardin</option>
                <option value="ami_du_vert">Je souhaite jardiner chez quelqu’un</option>
              </select>
            </div>

            <button type="submit" style={styles.button}>S&apos;inscrire</button>
            {errorMessage && <p style={{ color: 'red', fontSize: '16px', marginTop: '10px', textAlign: 'center' }}>{errorMessage}</p>}
          </form>

          <p style={{ ...styles.register, color: '#e3107d' }}>
            Déjà inscrit ?{' '}
            <a href="/connexion" style={{ color: '#021904', textDecoration: 'none' }}
              onMouseOver={(e) => (e.target.style.textDecoration = 'underline')}
              onMouseOut={(e) => (e.target.style.textDecoration = 'none')}>
              Se connecter
            </a>
          </p>

          <p style={styles.note}>
            En vous inscrivant, vous contribuez à une plateforme bienveillante dédiée à la nature et au partage. 💚
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
