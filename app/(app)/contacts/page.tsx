'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  sendFriendRequest,
  getIncomingRequests,
  getAcceptedIncomingRequests,
  getOutgoingRequests,
  respondToRequest,
  createUserRecord,
} from '@/lib/db';
import { supabase } from '@/lib/supabase';
import type { Contact, FriendRequest } from '@/types';

type RelationshipType = 'family' | 'close';
type Tab = 'contacts' | 'requests';

export default function ContactsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [acceptedIncoming, setAcceptedIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('family');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const [c, inc, accInc, out] = await Promise.all([
        getContacts(user.id),
        getIncomingRequests(user.email ?? ''),
        getAcceptedIncomingRequests(user.email ?? ''),
        getOutgoingRequests(user.id),
      ]);
      setContacts(c);
      setIncoming(inc);
      setAcceptedIncoming(accInc);
      setOutgoing(out);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime: watch for new friend requests addressed to this user
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('friend-requests-incoming')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friend_requests',
      }, () => { fetchAll(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchAll]);

  const openAdd = () => {
    setEditContact(null);
    setName(''); setEmail(''); setRelationshipType('family'); setError('');
    setShowForm(true);
  };

  const openEdit = (contact: Contact) => {
    setEditContact(contact);
    setName(contact.name); setEmail(contact.email || ''); setRelationshipType(contact.relationship_type); setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!email.trim()) { setError('Email is required.'); return; }
    // Auto-fill name from email prefix if left blank
    const resolvedName = name.trim() || email.trim().split('@')[0];
    setSaving(true); setError('');
    try {
      if (editContact) {
        await updateContact(editContact.id, {
          name: resolvedName,
          email: email.trim(),
          relationship_type: relationshipType,
        });
        setContacts((prev) =>
          prev.map((c) =>
            c.id === editContact.id
              ? { ...c, name: resolvedName, email: email.trim(), relationship_type: relationshipType }
              : c
          )
        );
      } else {
        const newContact = await createContact(user.id, {
          name: resolvedName,
          email: email.trim(),
          relationship_type: relationshipType,
        });
        setContacts((prev) => [...prev, newContact]);

        // Auto-send friend request
        const displayName = user.email?.split('@')[0] || 'Someone';
        try {
          await sendFriendRequest(user.id, displayName, email.trim());
          await fetchAll();
        } catch (reqErr) {
          console.error('Friend request error:', reqErr);
        }
      }
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('Delete this contact?')) return;
    try {
      await deleteContact(contactId);
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRespond = async (requestId: string, status: 'accepted' | 'declined') => {
    if (!user) return;
    setRespondingId(requestId);
    setError('');
    try {
      // Ensure this user exists in public.users so the RLS policy allows the UPDATE
      if (user.email) await createUserRecord(user.id, user.email);
      await respondToRequest(requestId, status, user.id);
      setIncoming((prev) => prev.filter((r) => r.id !== requestId));
      await fetchAll();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to respond to request.');
    } finally {
      setRespondingId(null);
    }
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-[#1F2933]/10 bg-white text-[#1F2933] placeholder-[#1F2933]/40 focus:outline-none focus:ring-2 focus:ring-[#3E5C86] transition text-sm';

  const pendingIncoming = incoming.length;

  return (
    <div className="max-w-lg mx-auto px-4">
      <div className="pt-12 pb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/60 font-medium uppercase tracking-wider">People</p>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
        </div>
        {tab === 'contacts' && (
          <button onClick={openAdd} className="flex items-center gap-2 bg-[#3E5C86] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#324d73] transition shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add
          </button>
        )}
        {tab === 'requests' && (
          <button onClick={fetchAll} className="flex items-center gap-2 bg-[#3E5C86] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#324d73] transition shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#3E5C86]/30 p-1 rounded-xl">
        <button
          onClick={() => setTab('contacts')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'contacts' ? 'bg-[#E6E6E6] text-[#1F2933]' : 'text-white/60 hover:text-white'}`}
        >
          My Contacts
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${tab === 'requests' ? 'bg-[#E6E6E6] text-[#1F2933]' : 'text-white/60 hover:text-white'}`}
        >
          Requests
          {pendingIncoming > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {pendingIncoming}
            </span>
          )}
        </button>
      </div>

      {loading && <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-[#E6E6E6] border-t-transparent rounded-full animate-spin" /></div>}

      {/* CONTACTS TAB */}
      {!loading && tab === 'contacts' && (
        <>
          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-[#E6E6E6] rounded-2xl p-5 mb-6 shadow-lg">
              <h2 className="text-base font-semibold text-[#1F2933] mb-4">{editContact ? 'Edit Contact' : 'New Contact'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1F2933] mb-1.5">Email *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="their@email.com" className={inputClass} autoFocus />
                  {!editContact && email.trim() && (
                    <p className="text-xs text-[#3E5C86] mt-1">A friend request will be sent to this email.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2933] mb-1.5">
                    Name <span className="text-[#1F2933]/40 font-normal">(optional — auto-filled from email)</span>
                  </label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2933] mb-2">Relationship</label>
                  <div className="flex gap-2">
                    {(['family', 'close'] as RelationshipType[]).map((type) => (
                      <button key={type} type="button" onClick={() => setRelationshipType(type)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors ${relationshipType === type ? 'bg-[#3E5C86] text-white shadow-sm' : 'bg-white text-[#1F2933]/60 hover:bg-gray-100'}`}>
                        {type === 'close' ? 'Close Friend' : 'Family'}
                      </button>
                    ))}
                  </div>
                </div>
                {error && <div className="bg-red-100 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border-2 border-[#1F2933]/20 text-[#1F2933]/60 font-semibold text-sm hover:bg-gray-100 transition">Cancel</button>
                  <button type="button" onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#3E5C86] text-white font-semibold text-sm hover:bg-[#324d73] disabled:opacity-60 transition shadow-sm">
                    {saving ? 'Saving...' : editContact ? 'Save Changes' : 'Add Contact'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {contacts.length === 0 && acceptedIncoming.length === 0 && !showForm && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-[#3E5C86] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <p className="text-white/70 text-sm">No contacts yet.</p>
              <p className="text-white/40 text-xs mt-1">Add someone by email to send them a friend request.</p>
            </div>
          )}

          {/* Connections accepted from incoming requests (the other person added you) */}
          {acceptedIncoming.length > 0 && (
            <div className="space-y-3 mb-3">
              {acceptedIncoming.map((req) => (
                <div key={req.id} className="bg-[#E6E6E6] rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="w-11 h-11 bg-[#3E5C86] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-base">{req.sender_name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1F2933] text-sm truncate">{req.sender_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#8FA87A]/20 text-[#5a7a46]">Close Friend</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Connected</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 pb-4">
            {contacts.map((contact) => {
              const matchingRequest = outgoing.find((r) => r.recipient_email === contact.email);
              const isAccepted = !!contact.linked_user_id || matchingRequest?.status === 'accepted';
              const isPending = !isAccepted && matchingRequest?.status === 'pending';
              const isDeclined = !isAccepted && matchingRequest?.status === 'declined';

              return (
                <div key={contact.id} className="bg-[#E6E6E6] rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="w-11 h-11 bg-[#3E5C86] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-base">{contact.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1F2933] text-sm truncate">{contact.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${contact.relationship_type === 'family' ? 'bg-[#4F6D9A]/20 text-[#3E5C86]' : 'bg-[#8FA87A]/20 text-[#5a7a46]'}`}>
                        {contact.relationship_type === 'close' ? 'Close Friend' : 'Family'}
                      </span>
                      {isAccepted && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Connected</span>
                      )}
                      {isPending && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">⏳ Request sent</span>
                      )}
                      {isDeclined && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">✗ Declined</span>
                      )}
                      {!isAccepted && !isPending && !isDeclined && contact.email && (
                        <button
                          onClick={async () => {
                            if (!user) return;
                            const displayName = user.email?.split('@')[0] || 'Someone';
                            try {
                              await sendFriendRequest(user.id, displayName, contact.email!);
                              await fetchAll();
                            } catch (e) { console.error(e); }
                          }}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#3E5C86]/10 text-[#3E5C86] hover:bg-[#3E5C86]/20 transition"
                        >
                          Send request
                        </button>
                      )}
                      {contact.email && <p className="text-xs text-[#1F2933]/40 truncate">{contact.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(contact)} className="p-2 rounded-xl hover:bg-[#4F6D9A]/10 transition">
                      <svg className="w-4 h-4 text-[#3E5C86]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(contact.id)} className="p-2 rounded-xl hover:bg-red-100 transition">
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* REQUESTS TAB */}
      {!loading && tab === 'requests' && (
        <div className="space-y-6 pb-4">
          {/* Incoming requests */}
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Incoming Requests {incoming.length > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">{incoming.length}</span>}
            </h2>
            {incoming.length === 0 ? (
              <div className="bg-[#3E5C86]/20 rounded-2xl p-4 text-center">
                <p className="text-white/50 text-sm">No pending requests.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incoming.map((req) => (
                  <div key={req.id} className="bg-[#E6E6E6] rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#3E5C86] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">{req.sender_name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#1F2933] text-sm">{req.sender_name}</p>
                        <p className="text-xs text-[#1F2933]/50">wants to add you as a contact</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(req.id, 'declined')}
                        disabled={respondingId === req.id}
                        className="flex-1 py-2 rounded-xl border-2 border-[#1F2933]/20 text-[#1F2933]/60 font-semibold text-sm hover:bg-gray-100 disabled:opacity-50 transition"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, 'accepted')}
                        disabled={respondingId === req.id}
                        className="flex-1 py-2 rounded-xl bg-[#3E5C86] text-white font-semibold text-sm hover:bg-[#324d73] disabled:opacity-60 transition shadow-sm"
                      >
                        {respondingId === req.id ? 'Accepting...' : 'Accept'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing requests */}
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Sent Requests</h2>
            {outgoing.length === 0 ? (
              <div className="bg-[#3E5C86]/20 rounded-2xl p-4 text-center">
                <p className="text-white/50 text-sm">No sent requests yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {outgoing.map((req) => (
                  <div key={req.id} className="bg-[#E6E6E6] rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                    <div className="w-9 h-9 bg-[#3E5C86]/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-[#3E5C86]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1F2933] truncate">{req.recipient_email}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        req.status === 'accepted' ? 'bg-green-100 text-green-700'
                        : req.status === 'declined' ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {req.status === 'accepted' ? '✓ Accepted' : req.status === 'declined' ? '✗ Declined' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
