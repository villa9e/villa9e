'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { CATEGORY_LABELS, CATEGORY_COLORS, GOVERNANCE_RULES } from '@/lib/vico/constants';

type Comment = {
  id: string;
  content: string;
  oowop_count: number;
  created_at: string;
  user_id: string;
  profiles?: { username?: string; display_name?: string; avatar_url?: string } | null;
};

type ProposalDetail = {
  id: string;
  vip_number: number;
  title: string;
  category: string;
  description: string;
  execution_plan: string;
  execution_tx_hash: string | null;
  status: string;
  display_status: string;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  voting_ends_at: string;
  comments: Comment[];
  user_vote: 'for' | 'against' | 'abstain' | null;
  user_staked: number;
  can_vote: boolean;
  can_comment: boolean;
  oowoped_comment_ids: string[];
};

function votePct(p: ProposalDetail) {
  const total = p.votes_for + p.votes_against + p.votes_abstain;
  if (total === 0) return { forPct: 0, againstPct: 0, abstainPct: 0, total };
  return {
    forPct:     Math.round((p.votes_for     / total) * 100),
    againstPct: Math.round((p.votes_against / total) * 100),
    abstainPct: Math.round((p.votes_abstain / total) * 100),
    total,
  };
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initialsFor(c: Comment) {
  const name = c.profiles?.display_name || c.profiles?.username || '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function usernameFor(c: Comment) {
  return c.profiles?.username || c.profiles?.display_name || 'villager';
}

export default function ProposalDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const isNight = useVillageTheme(s => s.theme) === 'night';

  const pageBg     = isNight ? '#100E1E' : '#F8F7FF';
  const cardBg     = isNight ? '#1C1830' : '#FFFFFF';
  const cardBorder = isNight ? '0.5px solid #2E2A4A' : '0.5px solid #DDDAF8';
  const textPrimary   = isNight ? '#E8E4FF' : '#1A1640';
  const textSecondary = isNight ? '#9B96C8' : '#534AB7';
  const textMuted     = isNight ? '#6B6490' : '#7B78A8';

  const [proposal, setProposal] = useState<ProposalDetail | null | 'not-found'>(null);
  const [showConfirm, setShowConfirm] = useState<'for' | 'against' | 'abstain' | null>(null);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [oowopedIds, setOowopedIds] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  function load() {
    fetch(`/api/vico/proposals/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: ProposalDetail) => {
        setProposal(d);
        setOowopedIds(new Set(d.oowoped_comment_ids ?? []));
      })
      .catch(() => setProposal('not-found'));
  }

  useEffect(() => { if (id) load(); }, [id]);

  if (proposal === null) {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: textMuted, fontSize: 13 }}>Loading proposal…</div>
      </div>
    );
  }

  if (proposal === 'not-found') {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: textMuted }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Proposal not found</div>
          <Link href="/village/vico/proposals" style={{ color: textSecondary, fontSize: 13 }}>
            ← Back to proposals
          </Link>
        </div>
      </div>
    );
  }

  const { forPct, againstPct, abstainPct, total } = votePct(proposal);
  const catColor = CATEGORY_COLORS[proposal.category] ?? { bg: '#F0F0F0', text: '#666' };
  const isActive = proposal.display_status === 'active';

  async function submitVote() {
    if (!showConfirm) return;
    setVoting(true);
    setVoteError(null);
    try {
      const res = await fetch(`/api/vico/proposals/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: showConfirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVoteError(data.error || 'Failed to submit vote');
        setShowConfirm(null);
        return;
      }
      setShowConfirm(null);
      load();
    } catch {
      setVoteError('Failed to submit vote');
      setShowConfirm(null);
    } finally {
      setVoting(false);
    }
  }

  async function toggleOowop(commentId: string) {
    const wasOowoped = oowopedIds.has(commentId);
    setOowopedIds(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId); else next.add(commentId);
      return next;
    });
    setProposal(p => {
      if (!p || p === 'not-found') return p;
      return {
        ...p,
        comments: p.comments.map(c => c.id === commentId
          ? { ...c, oowop_count: c.oowop_count + (wasOowoped ? -1 : 1) }
          : c),
      };
    });
    try {
      await fetch(`/api/vico/comments/${commentId}/oowop`, { method: 'POST' });
    } catch {
      // best-effort; reload will reconcile on next visit
    }
  }

  async function postComment() {
    if (!commentText.trim()) return;
    setPosting(true);
    setCommentError(null);
    try {
      const res = await fetch('/api/vico/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: id, content: commentText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCommentError(data.error || 'Failed to post comment');
        return;
      }
      setCommentText('');
      load();
    } catch {
      setCommentError('Failed to post comment');
    } finally {
      setPosting(false);
    }
  }

  const sortedComments = [...proposal.comments].sort((a, b) => b.oowop_count - a.oowop_count);

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: isNight ? '#1A1640' : '#26215C', padding: '52px 20px 20px' }}>
        <Link href="/village/vico/proposals" style={{
          display: 'flex', alignItems: 'center', gap: 4,
          color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13, marginBottom: 12,
        }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to Proposals
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(196,192,255,0.8)' }}>
            VIP-{String(proposal.vip_number).padStart(3, '0')}
          </span>
          <span style={{
            padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
            background: `${catColor.text}22`, color: catColor.text,
          }}>
            {CATEGORY_LABELS[proposal.category]}
          </span>
          {isActive && (
            <span style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
              background: 'rgba(29,158,117,0.2)', color: '#4CD4A0',
            }}>Active</span>
          )}
          {proposal.display_status === 'discussion' && (
            <span style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
              background: 'rgba(186,117,23,0.2)', color: '#E0B05C',
            }}>Discussion</span>
          )}
          {(proposal.display_status === 'passed' || proposal.display_status === 'executed') && (
            <span style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
              background: 'rgba(127,119,221,0.2)', color: '#A9A3F0',
            }}>Passed</span>
          )}
          {proposal.display_status === 'rejected' && (
            <span style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
              background: 'rgba(226,75,74,0.15)', color: '#F08080',
            }}>Rejected</span>
          )}
        </div>
        <div style={{ color: 'white', fontSize: 18, fontWeight: 800, lineHeight: 1.4 }}>
          {proposal.title}
        </div>
        <div style={{ color: 'rgba(196,192,255,0.6)', fontSize: 11, marginTop: 6 }}>
          Voting {isActive ? `ends ${formatDate(proposal.voting_ends_at)}` : `${proposal.display_status === 'discussion' ? 'starts soon' : 'ended ' + formatDate(proposal.voting_ends_at)}`}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Vote tally card */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, marginBottom: 10 }}>Vote Tally</div>

          {/* Big dual-color bar */}
          <div style={{ height: 12, borderRadius: 6, overflow: 'hidden', display: 'flex', background: isNight ? '#2E2A4A' : '#EEEDFE', marginBottom: 8 }}>
            <div style={{ width: `${forPct}%`, background: '#1D9E75', transition: 'width 0.5s' }} />
            <div style={{ width: `${againstPct}%`, background: '#E24B4A', transition: 'width 0.5s' }} />
            <div style={{ width: `${abstainPct}%`, background: isNight ? '#4A4670' : '#C4C0E8', transition: 'width 0.5s' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1D9E75' }}>{forPct}%</div>
              <div style={{ fontSize: 10, color: textMuted }}>For ({proposal.votes_for.toLocaleString()})</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#E24B4A' }}>{againstPct}%</div>
              <div style={{ fontSize: 10, color: textMuted }}>Against ({proposal.votes_against.toLocaleString()})</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: textMuted }}>{abstainPct}%</div>
              <div style={{ fontSize: 10, color: textMuted }}>Abstain ({proposal.votes_abstain.toLocaleString()})</div>
            </div>
          </div>

          {/* Threshold status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 10px', borderRadius: 8,
            background: forPct >= GOVERNANCE_RULES.PASS_THRESHOLD_PCT
              ? (isNight ? 'rgba(29,158,117,0.12)' : '#E8F7F1')
              : (isNight ? 'rgba(226,75,74,0.1)' : '#FEF0EE'),
          }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
              stroke={forPct >= GOVERNANCE_RULES.PASS_THRESHOLD_PCT ? '#1D9E75' : '#E24B4A'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {forPct >= GOVERNANCE_RULES.PASS_THRESHOLD_PCT
                ? <polyline points="20 6 9 17 4 12" />
                : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              }
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: forPct >= GOVERNANCE_RULES.PASS_THRESHOLD_PCT ? '#1D9E75' : '#E24B4A' }}>
              {forPct >= GOVERNANCE_RULES.PASS_THRESHOLD_PCT
                ? `Passing — ${forPct}% exceeds ${GOVERNANCE_RULES.PASS_THRESHOLD_PCT}% threshold`
                : `${GOVERNANCE_RULES.PASS_THRESHOLD_PCT - forPct}% more needed to pass ${GOVERNANCE_RULES.PASS_THRESHOLD_PCT}% threshold`
              }
            </span>
          </div>

          <div style={{ fontSize: 10, color: textMuted, marginTop: 8 }}>
            {total.toLocaleString()} total votes cast
          </div>
        </div>

        {/* Vote buttons */}
        {(isActive || proposal.display_status === 'discussion') && (
          <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '14px', marginBottom: 14 }}>
            {proposal.user_vote ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px',
                background: isNight ? 'rgba(29,158,117,0.12)' : '#E8F7F1', borderRadius: 8,
              }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1D9E75' }}>
                  You voted: <strong style={{ textTransform: 'capitalize' }}>{proposal.user_vote}</strong>
                </span>
              </div>
            ) : !isActive ? (
              <div style={{ fontSize: 12, color: textMuted, textAlign: 'center' }}>
                Voting opens once the discussion period ends.
              </div>
            ) : !proposal.can_vote ? (
              <div style={{
                background: isNight ? 'rgba(127,119,221,0.1)' : '#EEEDFE',
                border: `1px solid ${isNight ? '#3C3470' : '#C8C3F4'}`,
                borderRadius: 10, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: isNight ? '#C4C0FF' : '#3C3489', marginBottom: 4 }}>
                  Stake $VICO to vote
                </div>
                <div style={{ fontSize: 12, color: isNight ? '#9B96C8' : '#5C58A8', lineHeight: 1.5, marginBottom: 8 }}>
                  You need {GOVERNANCE_RULES.MIN_STAKE_TO_VOTE.toLocaleString()}+ $VICO staked to vote. Your current stake: {proposal.user_staked.toLocaleString()} $VICO.
                </div>
                <Link href="/village/bank/blockchain" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 700, color: '#7F77DD', textDecoration: 'none',
                }}>
                  Stake $VICO →
                </Link>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, marginBottom: 10 }}>Cast Your Vote</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <button
                    onClick={() => setShowConfirm('for')}
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: '#1D9E75', fontWeight: 700, fontSize: 13, color: 'white',
                    }}
                  >For</button>
                  <button
                    onClick={() => setShowConfirm('against')}
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: '#E24B4A', fontWeight: 700, fontSize: 13, color: 'white',
                    }}
                  >Against</button>
                  <button
                    onClick={() => setShowConfirm('abstain')}
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: isNight ? '#4A4670' : '#8E8AB0', fontWeight: 700, fontSize: 13, color: 'white',
                    }}
                  >Abstain</button>
                </div>
                <div style={{ fontSize: 11, color: textMuted, textAlign: 'center' }}>
                  Your voting power: <strong style={{ color: textSecondary }}>{proposal.user_staked.toLocaleString()} $VICO</strong> · Cannot change after submission
                </div>
              </>
            )}
            {voteError && (
              <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 8, textAlign: 'center' }}>{voteError}</div>
            )}
          </div>
        )}

        {/* Proposal description */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, marginBottom: 8 }}>Description</div>
          <div style={{ fontSize: 13, color: textPrimary, lineHeight: 1.65 }}>{proposal.description}</div>
        </div>

        {/* Execution plan */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, marginBottom: 8 }}>Execution Plan</div>
          <div style={{ fontSize: 13, color: textPrimary, lineHeight: 1.65 }}>{proposal.execution_plan}</div>
          {proposal.execution_tx_hash && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontSize: 11, color: '#1D9E75', fontWeight: 600 }}>
                Executed · tx: {proposal.execution_tx_hash}
              </span>
            </div>
          )}
        </div>

        {/* Discussion */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, marginBottom: 12 }}>
            Discussion <span style={{ color: textMuted, fontWeight: 400 }}>· sorted by OoWop</span>
          </div>

          {sortedComments.length === 0 && (
            <div style={{ fontSize: 12, color: textMuted, padding: '8px 0' }}>No comments yet.</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sortedComments.map(comment => (
              <div key={comment.id}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 16,
                    background: isNight ? '#3C3489' : '#534AB7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {initialsFor(comment)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: textPrimary }}>@{usernameFor(comment)}</span>
                      <span style={{
                        padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                        background: isNight ? '#3C3489' : '#EEEDFE', color: isNight ? '#A9A3F0' : '#3C3489',
                      }}>Village Elder</span>
                    </div>
                    <div style={{ fontSize: 12, color: textPrimary, lineHeight: 1.55, marginBottom: 8 }}>
                      {comment.content}
                    </div>
                    <button
                      onClick={() => toggleOowop(comment.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: oowopedIds.has(comment.id)
                          ? (isNight ? 'rgba(83,74,183,0.25)' : '#EEF0FF')
                          : 'transparent',
                        border: `1px solid ${oowopedIds.has(comment.id) ? '#7F77DD' : (isNight ? '#3C3870' : '#DDDAF8')}`,
                        borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                      }}
                    >
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                        stroke={oowopedIds.has(comment.id) ? '#7F77DD' : textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
                        <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
                      </svg>
                      <span style={{ fontSize: 11, fontWeight: 600, color: oowopedIds.has(comment.id) ? '#7F77DD' : textMuted }}>
                        OoWop · {comment.oowop_count}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comment input area */}
          <div style={{ marginTop: 16, borderTop: cardBorder, paddingTop: 14 }}>
            {proposal.can_comment ? (
              <>
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Share your perspective on this proposal..."
                  rows={3}
                  style={{
                    width: '100%', borderRadius: 8,
                    border: `1px solid ${isNight ? '#3C3870' : '#DDDAF8'}`,
                    background: isNight ? '#120F22' : '#FAFAFE',
                    color: textPrimary, fontSize: 13, padding: '10px 12px',
                    resize: 'none', boxSizing: 'border-box', marginBottom: 8,
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={postComment}
                  disabled={posting || !commentText.trim()}
                  style={{
                    padding: '9px 18px', background: isNight ? '#7F77DD' : '#534AB7',
                    border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600,
                    cursor: posting || !commentText.trim() ? 'not-allowed' : 'pointer',
                    opacity: posting || !commentText.trim() ? 0.6 : 1,
                  }}>
                  {posting ? 'Posting…' : 'Post Comment'}
                </button>
                {commentError && (
                  <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 8 }}>{commentError}</div>
                )}
              </>
            ) : (
              /* Non-Elder lock card */
              <div style={{
                background: isNight ? 'rgba(127,119,221,0.1)' : '#EEEDFE',
                border: `1px solid ${isNight ? '#3C3470' : '#C8C3F4'}`,
                borderRadius: 10, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isNight ? '#C4C0FF' : '#3C3489', marginBottom: 4 }}>
                      Village Elder commenting
                    </div>
                    <div style={{ fontSize: 12, color: isNight ? '#9B96C8' : '#5C58A8', lineHeight: 1.5, marginBottom: 8 }}>
                      Elders ({GOVERNANCE_RULES.ELDER_STAKE.toLocaleString()}+ staked $VICO) can post in governance discussions. You can OoWop any comment now. Stake more to reach Elder tier.
                    </div>
                    <Link href="/village/bank/blockchain" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 700, color: '#7F77DD', textDecoration: 'none',
                    }}>
                      Stake more $VICO →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vote confirmation modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'flex-end', zIndex: 200,
        }} onClick={() => !voting && setShowConfirm(null)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', background: cardBg,
              borderRadius: '16px 16px 0 0', padding: '24px 20px 40px',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: textPrimary, marginBottom: 8 }}>
              Confirm Your Vote
            </div>
            <div style={{ fontSize: 13, color: textMuted, marginBottom: 6 }}>
              You are voting <strong style={{ color: textPrimary, textTransform: 'capitalize' }}>{showConfirm}</strong> on:
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary, marginBottom: 16, lineHeight: 1.4 }}>
              {proposal.title}
            </div>
            <div style={{
              padding: '10px 12px', borderRadius: 8,
              background: isNight ? '#120F22' : '#FFF8EE',
              border: `1px solid ${isNight ? '#3C3870' : '#F0E6D3'}`,
              fontSize: 12, color: textMuted, marginBottom: 20, lineHeight: 1.5,
            }}>
              This vote is final and cannot be changed after submission.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowConfirm(null)} disabled={voting} style={{
                flex: 1, padding: '12px', borderRadius: 10,
                border: `1px solid ${isNight ? '#3C3870' : '#DDDAF8'}`,
                background: 'transparent', color: textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={submitVote} disabled={voting} style={{
                flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                background: showConfirm === 'for' ? '#1D9E75' : showConfirm === 'against' ? '#E24B4A' : '#8E8AB0',
                color: 'white', fontSize: 13, fontWeight: 700, cursor: voting ? 'not-allowed' : 'pointer', textTransform: 'capitalize',
                opacity: voting ? 0.7 : 1,
              }}>
                {voting ? 'Submitting…' : `Vote ${showConfirm}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
