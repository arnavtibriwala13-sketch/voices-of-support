'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getContacts, createContact, updateContact, deleteContact } from '@/lib/db';
import type { Contact } from '@/types';

type RelationshipType = 'family' | 'close';

export default function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('family');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchContacts = async () => {
    if (!user) return;
    try {
      const data = await getContacts(user.id);
      setContacts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContacts(); }, [user]);

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
    if (!user || !name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      if (editContact) {
        await updateContact(editContact.id, { name: name.trim(), email: email.trim() || undefined, relationship_type: relationshipType });
        setContacts((prev) => prev.map((c) => c.id === editContact.id ? { ...c, name: name.trim(), email: email.trim() || undefined, relationship_type: relationshipType } : c));
      } else {
        const newContact = await createContact(user.id, { name: name.trim(), email: email.trim() || undefined, relationship_type: relationshipType });
        setContacts((prev) => [...prev, newContact]);
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

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-[#1F2933]/10 bg-white text-[#1F2933] placeholder-[#1F2933]/40 focus:outline-none focus:ring-2 focus:ring-[#3E5C86] transition text-sm';

  return (
    <div className="max-w-lg mx-auto px-4">
      <div className="pt-12 pb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/60 font-medium uppercase tracking-wider">People</p>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#3E5C86] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#324d73] transition shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-[#E6E6E6] rounded-2xl p-5 mb-6 shadow-lg">
          <h2 className="text-base font-semibold text-[#1F2933] mb-4">{editContact ? 'Edit Contact' : 'New Contact'}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1F2933] mb-1.5">Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact name" className={inputClass} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2933] mb-1.5">Email <span className="text-[#1F2933]/40 font-normal">(optional)</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="their@email.com" className={inputClass} />
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

      {loading && <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-[#E6E6E6] border-t-transparent rounded-full animate-spin" /></div>}

      {!loading && contacts.length === 0 && !showForm && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#3E5C86] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <p className="text-white/70 text-sm">No contacts yet.</p>
          <p className="text-white/40 text-xs mt-1">Add people you want to send messages to.</p>
        </div>
      )}

      <div className="space-y-3 pb-4">
        {contacts.map((contact) => (
          <div key={contact.id} className="bg-[#E6E6E6] rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-11 h-11 bg-[#3E5C86] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-base">{contact.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1F2933] text-sm truncate">{contact.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${contact.relationship_type === 'family' ? 'bg-[#4F6D9A]/20 text-[#3E5C86]' : 'bg-[#8FA87A]/20 text-[#5a7a46]'}`}>
                  {contact.relationship_type === 'close' ? 'Close Friend' : 'Family'}
                </span>
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
        ))}
      </div>
    </div>
  );
}
