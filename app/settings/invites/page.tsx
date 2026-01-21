'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Copy, Check } from 'lucide-react';

interface Invite {
  id: string;
  invite_code: string;
  created_at: string;
  expires_at: string;
  max_uses: number;
  use_count: number;
  notes: string | null;
}

export default function InvitesPage() {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const response = await fetch('/api/invites');
      if (response.ok) {
        const data = await response.json();
        setInvites(data.invites || []);
      }
    } catch (error) {
      console.error('Failed to fetch invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxUses: 1,
          notes: 'Single-use invite',
        }),
      });

      if (response.ok) {
        await fetchInvites();
      }
    } catch (error) {
      console.error('Failed to create invite:', error);
    } finally {
      setCreating(false);
    }
  };

  const copyInviteCode = (code: string) => {
    const inviteUrl = `${window.location.origin}/onboarding?code=${code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        gap: '12px'
      }}>
        <button

          onClick={() => router.push('/settings')}

          style={{

            width: '36px',

            height: '36px',

            borderRadius: '50%',

            border: '1px solid var(--theme-primary)',

            backgroundColor: 'white',

            cursor: 'pointer',

            display: 'flex',

            alignItems: 'center',

            justifyContent: 'center'

          }}

        >

          <ArrowLeft size={18} style={{ color: 'var(--theme-primary)', strokeWidth: 2 }} />

        </button>
        <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#111827' }}>
          Household Invites
        </h3>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            Generate invite codes to add family members to your household. Share the link with them to sign up.
          </p>

          <button
            onClick={createInvite}
            disabled={creating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'var(--theme-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: creating ? 'not-allowed' : 'pointer',
              opacity: creating ? 0.6 : 1,
            }}
          >
            <Plus size={18} />
            {creating ? 'Creating...' : 'Create Invite Link'}
          </button>
        </div>

        {/* Invites List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
            Loading invites...
          </div>
        ) : invites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
            No invites yet. Create one to invite family members!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {invites.map((invite) => {
              const isExpired = new Date(invite.expires_at) < new Date();
              const isUsed = invite.use_count >= invite.max_uses;
              const isCopied = copiedCode === invite.invite_code;

              return (
                <div
                  key={invite.id}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        marginBottom: '8px',
                        wordBreak: 'break-all',
                      }}>
                        {`${window.location.origin}/onboarding?code=${invite.invite_code}`}
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        fontFamily: 'monospace',
                        color: isExpired || isUsed ? '#9ca3af' : 'var(--theme-primary)',
                        marginBottom: '8px',
                      }}>
                        Code: {invite.invite_code}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                        Uses: {invite.use_count} / {invite.max_uses}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Expires: {new Date(invite.expires_at).toLocaleDateString()}
                      </div>
                    </div>

                    {!isExpired && !isUsed && (
                      <button
                        onClick={() => copyInviteCode(invite.invite_code)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: isCopied ? '#22c55e' : '#f3f4f6',
                          color: isCopied ? 'white' : '#111827',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isCopied ? (
                          <>
                            <Check size={14} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            Copy Link
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {(isExpired || isUsed) && (
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#ef4444',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      {isExpired ? 'Expired' : 'Fully Used'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
