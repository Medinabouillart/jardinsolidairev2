"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InputField from '../../components/Pageconnexion/InputField';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';

export default function Connexion() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:5001/api/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mot_de_passe: password }),
      });

      const data = await response.json();

      if (response.ok && data?.user) {
        // --- Normalise l'objet utilisateur
        const userId =
          data.user.id_utilisateur ??
          data.user.id ??
          data.user.user_id ??
          null;

        const userObj = {
          id_utilisateur: userId,
          role: data.user.role,
          prenom: data.user.prenom ?? '',
        };

        // ✅ Stockage cohérent avec Navbar
        localStorage.setItem('user', JSON.stringify(userObj));

        if (data.token) {
          localStorage.setItem('token', data.token);
        } else {
          // fallback si le back n’envoie pas de token
          localStorage.setItem('user_auth', '1');
        }

        // Expiration 2h
        localStorage.setItem(
          'auth_expires_at',
          String(Date.now() + 2 * 60 * 60 * 1000)
        );

        // 🔔 Notifie la Navbar
        window.dispatchEvent(new Event('auth:changed'));

        // Redirection par rôle
        if (data.user.role === 'jardinier' || data.user.role === 'ami_du_vert') {
          router.push('/jardins');
        } else if (data.user.role === 'proprietaire') {
          router.push('/jardiniers');
        } else {
          setErrorMessage('Rôle inconnu.');
        }
      } else {
        setErrorMessage(data?.error || 'Identifiant ou mot de passe incorrect.');
      }
    } catch (error) {
      console.error('Erreur réseau :', error);
      setErrorMessage('Erreur de connexion. Veuillez réessayer.');
    }
  };

  const styles = {
    container: { maxWidth: '520px', margin: '0 auto', padding: '28px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    title: { textAlign: 'center', color: '#021904', marginBottom: '16px', fontSize: '22px' },
    intro: { textAlign: 'center', color: '#4e784f', fontSize: '16px', marginBottom: '22px', lineHeight: '1.5' },
    form: { display: 'flex', flexDirection: 'column' },
    input: {
      width: '100%', height: '44px', padding: '10px 12px', boxSizing: 'border-box',
      border: '2px solid #6ec173', borderRadius: '10px', fontSize: '16px', color: '#021904', background: '#fff',
    },
    passwordWrapper: { position: 'relative', marginBottom: '20px' },
    toggleButton: {
      position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer', color: '#6ec173', fontSize: '14px'
    },
    forgot: { textAlign: 'right', marginTop: '-6px', marginBottom: '16px', fontSize: '14px' },
    button: { padding: '10px 12px', backgroundColor: '#6ec173', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px' },
    register: { textAlign: 'center', marginTop: '20px', fontSize: '16px', color: '#021904' },
    page: { backgroundColor: '#f5f5f5', minHeight: '100vh', paddingTop: '80px' },
  };

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.container}>
          <h2 style={styles.title}>Connexion à JardinSolidaire</h2>
          <p style={styles.intro}>
            Ravie de vous revoir sur JardinSolidaire 🌱 <br />
            Connectez-vous pour cultiver des liens et des jardins.
          </p>

          <label style={{ marginBottom: '6px', color: '#021904', fontSize: '16px' }}>Email</label>
          <form style={styles.form} onSubmit={handleSubmit}>
            <InputField
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse e-mail"
              required
              style={styles.input}
            />

            <label style={{ marginBottom: '6px', color: '#021904', fontSize: '16px' }}>Mot de passe</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                required
                style={{ ...styles.input, paddingRight: '50px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.toggleButton}
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>

            <p style={styles.forgot}>
              <a
                href="/mdp_oublier"
                style={{ color: '#6ec173', textDecoration: 'none' }}
                onMouseOver={(e) => (e.target.style.textDecoration = 'underline')}
                onMouseOut={(e) => (e.target.style.textDecoration = 'none')}
              >
                Mot de passe oublié ?
              </a>
            </p>

            <button type="submit" style={styles.button}>Se connecter</button>

            {errorMessage && (
              <p style={{ color: 'red', fontSize: '16px', marginTop: '10px', textAlign: 'center' }}>
                {errorMessage}
              </p>
            )}
          </form>

          <p style={{ ...styles.register, color: '#e3107d' }}>
            Pas encore de compte ?{' '}
            <a
              href="/inscription"
              style={{ color: '#021904', textDecoration: 'none' }}
              onMouseOver={(e) => (e.target.style.textDecoration = 'underline')}
              onMouseOut={(e) => (e.target.style.textDecoration = 'none')}
            >
              Inscrivez-vous
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
