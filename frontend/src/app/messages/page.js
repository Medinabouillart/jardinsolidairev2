'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001';

export default function MessagesPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState('');

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState('');

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [autoOpened, setAutoOpened] = useState(false);

  const searchParams = useSearchParams();

  function getAuthHeaders() {
    if (!isClient) return {};
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  // Init client + récup userId
  useEffect(() => {
    setIsClient(true);

    if (typeof window !== 'undefined') {
      try {
        const raw =
          localStorage.getItem('utilisateur') || localStorage.getItem('user');
        if (raw) {
          const u = JSON.parse(raw);
          const id = u.id_utilisateur || u.id;
          if (id) setCurrentUserId(id);
        }
      } catch (e) {
        console.error(
          '[Messages] Impossible de lire user depuis localStorage',
          e
        );
      }
    }
  }, []);

  // Charger conversations
  useEffect(() => {
    if (!isClient || !currentUserId) {
      setLoadingConversations(false);
      return;
    }

    async function fetchConversations() {
      try {
        setLoadingConversations(true);
        setConversationsError('');

        const res = await fetch(
          `${API}/messagerie/conversations?userId=${currentUserId}`,
          {
            method: 'GET',
            headers: getAuthHeaders(),
            credentials: 'include',
          }
        );

        if (!res.ok) {
          if (res.status === 401) {
            setConversations([]);
            setConversationsError(
              'Votre session a expiré. Veuillez vous reconnecter pour voir vos messages.'
            );
            return;
          }
          throw new Error('Erreur lors du chargement des conversations.');
        }

        const data = await res.json();
        setConversations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setConversationsError(
          'Impossible de charger vos conversations pour le moment.'
        );
      } finally {
        setLoadingConversations(false);
      }
    }

    fetchConversations();
  }, [isClient, currentUserId]);

  // Ouvrir conversation (clic colonne gauche)
  async function openConversation(convUser) {
    if (!convUser || !convUser.id_utilisateur || !currentUserId) return;

    const otherId = convUser.id_utilisateur;
    setSelectedUserId(otherId);
    setSelectedUserInfo(convUser);
    setMessages([]);
    setMessagesError('');
    setLoadingMessages(true);

    try {
      const res = await fetch(
        `${API}/messagerie/conversation/${otherId}?userId=${currentUserId}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          setMessagesError(
            'Votre session a expiré. Veuillez vous reconnecter pour voir cette conversation.'
          );
          return;
        }
        throw new Error('Erreur lors du chargement des messages.');
      }

      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMessagesError('Impossible de charger cette conversation.');
    } finally {
      setLoadingMessages(false);
    }
  }

  // Auto-ouverture si /messages?to=...
  useEffect(() => {
    if (!isClient || !currentUserId || loadingConversations || autoOpened)
      return;

    const to = searchParams?.get('to');
    if (!to) return;

    const toId = Number(to);
    if (!Number.isFinite(toId) || toId <= 0) return;

    setAutoOpened(true);

    const existing = conversations.find((c) => c.id_utilisateur === toId);
    if (existing) {
      openConversation(existing);
      return;
    }

    const prenom = searchParams.get('prenom') || '';
    const nom = searchParams.get('nom') || '';
    const displayName = searchParams.get('displayName') || '';
    const avatar = searchParams.get('avatar') || '';
    const ville = searchParams.get('ville') || '';

    const fakeUser = {
      id_utilisateur: toId,
      prenom: prenom || displayName || '',
      nom,
      ville,
      photo_profil: avatar,
      displayName,
    };

    setSelectedUserId(toId);
    setSelectedUserInfo(fakeUser);
    setMessages([]);
    setMessagesError('');
  }, [
    isClient,
    currentUserId,
    loadingConversations,
    autoOpened,
    conversations,
    searchParams,
  ]);

  // Envoyer un message
  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || !currentUserId) return;

    try {
      setSending(true);
      setMessagesError('');

      const res = await fetch(
        `${API}/messagerie/conversation/${selectedUserId}?userId=${currentUserId}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify({ contenu: newMessage.trim() }),
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          setMessagesError(
            'Votre session a expiré. Veuillez vous reconnecter pour envoyer un message.'
          );
          return;
        }
        throw new Error("Erreur lors de l’envoi du message.");
      }

      const saved = await res.json();
      setMessages((prev) => [...prev, saved]);
      setNewMessage('');

      // MAJ de la liste des conversations
      setConversations((prev) => {
        const exists = prev.some((c) => c.id_utilisateur === selectedUserId);

        const baseUser =
          selectedUserInfo || {
            id_utilisateur: selectedUserId,
            prenom: searchParams.get('prenom') || '',
            nom: searchParams.get('nom') || '',
            ville: searchParams.get('ville') || '',
            photo_profil: searchParams.get('avatar') || '',
          };

        if (!exists) {
          return [
            {
              ...baseUser,
              last_message: saved.contenu,
              last_date: saved.date_envoi,
              unread_count: 0,
            },
            ...prev,
          ];
        }

        return prev.map((c) =>
          c.id_utilisateur === selectedUserId
            ? {
                ...c,
                last_message: saved.contenu,
                last_date: saved.date_envoi,
              }
            : c
        );
      });
    } catch (error) {
      console.error(error);
      setMessagesError("Impossible d’envoyer le message pour le moment.");
    } finally {
      setSending(false);
    }
  }

  function formatDateTime(dt) {
    if (!dt) return '';
    try {
      const d = new Date(dt);
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
            Messages
          </h1>
          <p className="text-sm md:text-base text-gray-600 mb-6">
            Discute avec les autres utilisateurs de la plateforme Jardin
            Solidaire.
          </p>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex flex-col md:flex-row h-[70vh]">
              {/* COLONNE GAUCHE */}
              <aside className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Mes conversations
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Choisis un utilisateur pour voir vos échanges.
                  </p>
                </div>

                <div className="p-3 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loadingConversations ? (
                    <div className="p-4 text-sm text-gray-500">
                      Chargement de vos conversations...
                    </div>
                  ) : conversationsError ? (
                    <div className="p-4 text-sm text-red-500">
                      {conversationsError}
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-6 text-sm text-gray-600 text-center flex flex-col items-center justify-center h-full">
                      <div className="text-3xl mb-3">💬</div>
                      <p className="font-medium mb-2">
                        Vous n’avez encore pris contact avec personne.
                      </p>
                      <p className="text-xs text-gray-500 max-w-xs">
                        Pour envoyer un message, allez sur le profil d’un
                        utilisateur qui vous intéresse et cliquez sur{' '}
                        <span className="font-semibold">« Contacter »</span>.
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {conversations.map((conv) => {
                        const isActive =
                          selectedUserId === conv.id_utilisateur;
                        return (
                          <li
                            key={conv.id_utilisateur}
                            className={`cursor-pointer px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-50 transition ${
                              isActive ? 'bg-green-50' : ''
                            }`}
                            onClick={() => openConversation(conv)}
                          >
                            <div className="flex-shrink-0">
                              {conv.photo_profil ? (
                                <img
                                  src={conv.photo_profil}
                                  alt={`${conv.prenom || ''} ${
                                    conv.nom || ''
                                  }`}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-800">
                                  {(conv.prenom || '?')
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <p className="font-medium text-gray-900 truncate">
                                  {conv.prenom} {conv.nom}
                                </p>
                                {conv.unread_count > 0 && (
                                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-green-600 text-white text-[10px] px-2 py-0.5">
                                    {conv.unread_count}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                {conv.last_message ||
                                  'Aucun message pour le moment.'}
                              </p>
                              {conv.last_date && (
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {formatDateTime(conv.last_date)}
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </aside>

              {/* COLONNE DROITE */}
              <section className="w-full md:w-2/3 flex flex-col">
                {/* En-tête conversation */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                  {selectedUserInfo ? (
                    <>
                      {selectedUserInfo.photo_profil ? (
                        <img
                          src={selectedUserInfo.photo_profil}
                          alt={`${selectedUserInfo.prenom || ''} ${
                            selectedUserInfo.nom || ''
                          }`}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-sm font-semibold text-green-800">
                          {(
                            selectedUserInfo.prenom ||
                            selectedUserInfo.displayName ||
                            '?'
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedUserInfo.prenom ||
                            selectedUserInfo.displayName}{' '}
                          {selectedUserInfo.nom}
                        </p>
                        {selectedUserInfo.ville && (
                          <p className="text-xs text-gray-500">
                            {selectedUserInfo.ville}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Aucune conversation sélectionnée
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Choisissez une conversation dans la liste de gauche pour
                        voir vos messages.
                      </p>
                    </div>
                  )}
                </div>

                {/* Zone messages */}
                <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-3">
                  {!selectedUserId ? (
                    <div className="h-full flex items-center justify-center text-center text-sm text-gray-500">
                      <div>
                        <div className="text-3xl mb-3">🌿</div>
                        <p className="font-medium mb-1">
                          Bienvenue dans votre messagerie Jardin Solidaire.
                        </p>
                        <p className="text-xs text-gray-500 max-w-xs mx-auto">
                          Sélectionnez un utilisateur à gauche pour lire vos
                          messages ou commencez une nouvelle conversation
                          depuis un profil.
                        </p>
                      </div>
                    </div>
                  ) : loadingMessages ? (
                    <div className="text-sm text-gray-500">
                      Chargement de la conversation...
                    </div>
                  ) : messagesError ? (
                    <div className="text-sm text-red-500">{messagesError}</div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-sm text-gray-500">
                      <div>
                        <p className="font-medium mb-1">
                          Vous n’avez pas encore échangé avec cet utilisateur.
                        </p>
                        <p className="text-xs text-gray-500 max-w-xs mx-auto">
                          Envoyez un premier message pour ouvrir la discussion 🌱
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {messages.map((msg) => {
                        const isMine = Boolean(
                          msg.is_mine ??
                            msg.isMine ??
                            msg.est_moi ??
                            msg.moi
                        );

                        return (
                          <div
                            key={
                              msg.id_message ||
                              `${msg.date_envoi}-${msg.contenu}`
                            }
                            className={`flex ${
                              isMine ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                                isMine
                                  ? 'bg-green-600 text-white rounded-br-sm'
                                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">
                                {msg.contenu}
                              </p>
                              <p
                                className={`mt-1 text-[10px] ${
                                  isMine
                                    ? 'text-green-100/80'
                                    : 'text-gray-400'
                                }`}
                              >
                                {formatDateTime(msg.date_envoi)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Zone saisie */}
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-gray-100 p-3 flex items-center gap-2"
                >
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={
                      selectedUserId
                        ? 'Écrire un message...'
                        : 'Sélectionnez d’abord une conversation.'
                    }
                    rows={1}
                    className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent max-h-32"
                    disabled={!selectedUserId || sending}
                  />
                  <button
                    type="submit"
                    disabled={!selectedUserId || !newMessage.trim() || sending}
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                      !selectedUserId || !newMessage.trim() || sending
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {sending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </form>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
