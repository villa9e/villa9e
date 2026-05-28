'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// ─── ICE server config ────────────────────────────────────────────────────────
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
];

export type CallState =
  | 'idle'
  | 'calling'      // outbound, waiting for answer
  | 'ringing'      // inbound, waiting for user to accept
  | 'connecting'   // ICE negotiating
  | 'active'       // call live
  | 'ended';

export interface CallMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  ts: number;
}

export interface UseWebRTCReturn {
  callState:       CallState;
  localStream:     MediaStream | null;
  remoteStream:    MediaStream | null;
  isMuted:         boolean;
  isCameraOff:     boolean;
  isScreenSharing: boolean;
  callMessages:    CallMessage[];
  callDuration:    number;   // seconds
  remoteUser:      { id: string; name: string; avatar?: string } | null;
  callId:          string | null;

  initiateCall:    (targetUserId: string, targetName: string, targetAvatar?: string) => Promise<void>;
  acceptCall:      () => Promise<void>;
  declineCall:     () => void;
  endCall:         () => void;
  toggleMute:      () => void;
  toggleCamera:    () => void;
  toggleScreenShare: () => Promise<void>;
  sendMessage:     (content: string) => void;
}

export function useWebRTC(currentUserId: string | null, currentUserName: string): UseWebRTCReturn {
  const supabase = createClient();

  const pcRef              = useRef<RTCPeerConnection | null>(null);
  const localStreamRef     = useRef<MediaStream | null>(null);
  const screenStreamRef    = useRef<MediaStream | null>(null);
  const channelRef         = useRef<any>(null);
  const callTimerRef       = useRef<NodeJS.Timeout | null>(null);
  const makingOfferRef     = useRef(false);
  const ignoreOfferRef     = useRef(false);
  const isSettingRemoteRef = useRef(false);

  const [callState,       setCallState]       = useState<CallState>('idle');
  const [localStream,     setLocalStream]     = useState<MediaStream | null>(null);
  const [remoteStream,    setRemoteStream]    = useState<MediaStream | null>(null);
  const [isMuted,         setIsMuted]         = useState(false);
  const [isCameraOff,     setIsCameraOff]     = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callMessages,    setCallMessages]    = useState<CallMessage[]>([]);
  const [callDuration,    setCallDuration]    = useState(0);
  const [remoteUser,      setRemoteUser]      = useState<{ id: string; name: string; avatar?: string } | null>(null);
  const [callId,          setCallId]          = useState<string | null>(null);

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    if (screenStreamRef.current) { screenStreamRef.current.getTracks().forEach(t => t.stop()); screenStreamRef.current = null; }
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    setLocalStream(null);
    setRemoteStream(null);
    setCallMessages([]);
    setCallDuration(0);
    setRemoteUser(null);
    setCallId(null);
    setIsScreenSharing(false);
    setIsMuted(false);
    setIsCameraOff(false);
    makingOfferRef.current = false;
    ignoreOfferRef.current = false;
  }, []);

  // ── Get local media ───────────────────────────────────────────────────────────
  async function getLocalMedia(): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }

  // ── Create peer connection ────────────────────────────────────────────────────
  function createPeerConnection(cid: string, polite: boolean) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // Remote track → state
    const remoteStr = new MediaStream();
    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach(t => remoteStr.addTrack(t));
      setRemoteStream(remoteStr);
    };

    // ICE candidate → broadcast
    pc.onicecandidate = (e) => {
      if (e.candidate && channelRef.current) {
        channelRef.current.send({
          type:    'broadcast',
          event:   'ice',
          payload: { candidate: e.candidate.toJSON(), sender: currentUserId },
        });
      }
    };

    // Connection state logging
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('active');
        callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      }
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    // Perfect negotiation — polite peer defers
    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        await pc.setLocalDescription();
        channelRef.current?.send({
          type:    'broadcast',
          event:   'sdp',
          payload: { description: pc.localDescription, sender: currentUserId },
        });
      } catch (err) {
        console.error('negotiation error', err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    return pc;
  }

  // ── Subscribe to signaling channel ───────────────────────────────────────────
  function subscribeSignaling(cid: string, polite: boolean) {
    const ch = supabase.channel(`call:${cid}`, { config: { broadcast: { self: false } } });

    ch.on('broadcast', { event: 'sdp' }, async ({ payload }: any) => {
      const { description, sender } = payload;
      if (sender === currentUserId || !pcRef.current) return;
      const pc = pcRef.current;
      const offerCollision = description.type === 'offer' &&
        (makingOfferRef.current || pc.signalingState !== 'stable');
      ignoreOfferRef.current = !polite && offerCollision;
      if (ignoreOfferRef.current) return;
      isSettingRemoteRef.current = true;
      await pc.setRemoteDescription(new RTCSessionDescription(description));
      isSettingRemoteRef.current = false;
      if (description.type === 'offer') {
        await pc.setLocalDescription();
        ch.send({
          type:    'broadcast',
          event:   'sdp',
          payload: { description: pc.localDescription, sender: currentUserId },
        });
      }
    });

    ch.on('broadcast', { event: 'ice' }, async ({ payload }: any) => {
      const { candidate, sender } = payload;
      if (sender === currentUserId || !pcRef.current) return;
      try {
        if (!isSettingRemoteRef.current && !ignoreOfferRef.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) { /* ignore */ }
    });

    ch.on('broadcast', { event: 'call-ended' }, () => {
      setCallState('ended');
      setTimeout(cleanup, 1200);
    });

    ch.on('broadcast', { event: 'call-accepted' }, () => {
      setCallState('connecting');
    });

    ch.on('broadcast', { event: 'call-declined' }, () => {
      setCallState('ended');
      setTimeout(cleanup, 800);
    });

    ch.on('broadcast', { event: 'chat' }, ({ payload }: any) => {
      setCallMessages(prev => [...prev, payload]);
    });

    ch.subscribe();
    channelRef.current = ch;
    return ch;
  }

  // ── Initiate call (caller) ────────────────────────────────────────────────────
  const initiateCall = useCallback(async (targetUserId: string, targetName: string, targetAvatar?: string) => {
    if (!currentUserId) return;
    const cid = `${currentUserId}_${targetUserId}_${Date.now()}`;
    setCallId(cid);
    setRemoteUser({ id: targetUserId, name: targetName, avatar: targetAvatar });
    setCallState('calling');

    // Store call in DB for notification
    await (supabase as any).from('call_sessions').insert({
      id: cid, caller_id: currentUserId, callee_id: targetUserId,
      caller_name: currentUserName, status: 'ringing',
    }).catch(() => {});

    // Notify callee via push/realtime
    await (supabase as any).from('notifications').insert({
      user_id: targetUserId, type: 'system',
      message: `${currentUserName} is calling you`,
      data: { call_id: cid, caller_id: currentUserId, caller_name: currentUserName, caller_avatar: targetAvatar },
    }).catch(() => {});

    const stream = await getLocalMedia();
    const ch     = subscribeSignaling(cid, false); // impolite = caller
    const pc     = createPeerConnection(cid, false);
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
  }, [currentUserId, currentUserName]);

  // ── Accept call (callee) ──────────────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!callId || !remoteUser) return;
    setCallState('connecting');

    await (supabase as any).from('call_sessions').update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', callId).catch(() => {});

    const stream = await getLocalMedia();
    const pc     = createPeerConnection(callId, true); // polite = callee
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    channelRef.current?.send({ type: 'broadcast', event: 'call-accepted', payload: { callee_id: currentUserId } });
  }, [callId, remoteUser, currentUserId]);

  // ── Incoming call setup (called externally when notification arrives) ─────────
  useEffect(() => {
    if (!currentUserId) return;
    // Listen for incoming call notifications via Realtime
    const notifChannel = supabase.channel(`incoming_call:${currentUserId}`)
      .on('broadcast', { event: 'incoming_call' }, ({ payload }: any) => {
        if (callState !== 'idle') return; // already in a call
        const { call_id, caller_id, caller_name, caller_avatar } = payload;
        setCallId(call_id);
        setRemoteUser({ id: caller_id, name: caller_name, avatar: caller_avatar });
        setCallState('ringing');
        subscribeSignaling(call_id, true); // polite = callee
      })
      .subscribe();
    return () => { supabase.removeChannel(notifChannel); };
  }, [currentUserId, callState]);

  // ── End call ─────────────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    channelRef.current?.send({ type: 'broadcast', event: 'call-ended', payload: {} });
    if (callId) {
      (supabase as any).from('call_sessions').update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', callId).catch(() => {});
    }
    setCallState('ended');
    setTimeout(cleanup, 800);
  }, [callId, cleanup]);

  const declineCall = useCallback(() => {
    channelRef.current?.send({ type: 'broadcast', event: 'call-declined', payload: {} });
    if (callId) {
      (supabase as any).from('call_sessions').update({ status: 'declined' }).eq('id', callId).catch(() => {});
    }
    cleanup();
    setCallState('idle');
  }, [callId, cleanup]);

  // ── Media controls ────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCameraOff(!track.enabled); }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!pcRef.current || !localStreamRef.current) return;
    const senders = pcRef.current.getSenders();
    const videoSender = senders.find(s => s.track?.kind === 'video');

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        if (videoSender) await videoSender.replaceTrack(screenTrack);
        screenTrack.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
      } catch { /* user cancelled */ }
    } else {
      const camTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoSender && camTrack) await videoSender.replaceTrack(camTrack);
      if (screenStreamRef.current) { screenStreamRef.current.getTracks().forEach(t => t.stop()); screenStreamRef.current = null; }
      setIsScreenSharing(false);
    }
  }, [isScreenSharing]);

  // ── In-call chat ──────────────────────────────────────────────────────────────
  const sendMessage = useCallback((content: string) => {
    if (!channelRef.current || !currentUserId) return;
    const msg: CallMessage = {
      id:          Date.now().toString(),
      sender_id:   currentUserId,
      sender_name: currentUserName,
      content,
      ts:          Date.now(),
    };
    channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msg });
    setCallMessages(prev => [...prev, msg]);
  }, [currentUserId, currentUserName]);

  useEffect(() => () => { cleanup(); }, [cleanup]);

  return {
    callState, localStream, remoteStream, isMuted, isCameraOff, isScreenSharing,
    callMessages, callDuration, remoteUser, callId,
    initiateCall, acceptCall, declineCall, endCall,
    toggleMute, toggleCamera, toggleScreenShare, sendMessage,
  };
}
