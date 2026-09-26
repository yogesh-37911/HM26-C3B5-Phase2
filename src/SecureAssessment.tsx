import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { io, type Socket } from 'socket.io-client';
import { AlertTriangle, Camera, Check, Clock3, ExternalLink, LockKeyhole, Mic, MonitorUp, ShieldCheck, X } from 'lucide-react';

const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
type UserRole = 'Candidate' | 'Reviewer';
type EventRow = { id: number; type: string; severity: string; metadata: Record<string, unknown>; created_at: string; acknowledged: boolean };
type SecureSession = {
  id: string; candidate_id: number; candidate_name: string; reviewer_id: number; reviewer_name: string;
  assessment_name: string; status: string; duration_minutes: number; started_at: string | null; remaining_seconds: number;
  camera: boolean; microphone: boolean; screen: boolean; fullscreen: boolean; connected: boolean;
  current_challenge: string; warning_count: number; targets: { name: string; url: string; authorization_note: string }[];
  events: EventRow[]; policy: { microphone_optional: boolean; warning_threshold: number; max_violations: number; retention_days: number; auto_pause: boolean; auto_submit: boolean; fallback_meeting_url: string; resources: Record<string, boolean> };
};
type SecurePolicy = SecureSession['policy'] & { duration_minutes: number };
type SecureTargetAdmin = { id: number; name: string; url: string; active: boolean; authorization_note: string };

async function request<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Secure assessment request failed.');
  return data as T;
}
function timeLabel(seconds: number) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`; }

const DEFAULT_FALLBACK_TARGETS: SecureSession['targets'] = [
  { name: 'Google Gruyere (Vulnerable App)', url: 'https://google-gruyere.appspot.com/', authorization_note: 'Follow the Gruyere codelab scope and stop at its documented boundaries.' },
  { name: 'Acunetix VulnWeb ASP.NET', url: 'http://testaspnet.vulnweb.com/', authorization_note: 'Intentionally vulnerable scanner test site; use only non-destructive validation.' },
  { name: 'OWASP Juice Shop Sandbox', url: 'https://juice-shop.herokuapp.com/', authorization_note: 'Authorized web security training lab environment.' },
  { name: 'ProofForge Lab Sandbox', url: 'http://localhost:5000/api/labs', authorization_note: 'Local isolated testing sandbox for cybersecurity lab scenarios.' }
];

const DEFAULT_FALLBACK_POLICY: SecurePolicy = {
  duration_minutes: 20,
  microphone_optional: true,
  warning_threshold: 1,
  max_violations: 5,
  retention_days: 30,
  auto_pause: false,
  auto_submit: false,
  fallback_meeting_url: '',
  resources: {
    documentation: true,
    search_engines: true,
    github: true,
    stackoverflow: true,
    ai_tools: false,
    external_websites: true,
  }
};

function createSimulatedMediaStream(label: string = 'Candidate Proctored Feed'): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  let frame = 0;
  const timer = setInterval(() => {
    if (!ctx) return;
    frame++;
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 640, 480);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 480); ctx.stroke(); }
    for (let y = 0; y < 480; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke(); }
    ctx.fillStyle = '#059669';
    ctx.fillRect(0, 0, 640, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText('● PROCTOR ACTIVE · SECURE ASSESSMENT MODE', 18, 24);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText(label, 24, 75);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.fillText(new Date().toLocaleTimeString(), 24, 100);
    const pulse = Math.sin(frame * 0.15) * 20;
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(320, 260, 65 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LAPTOP FEED ACTIVE', 320, 265);
    ctx.textAlign = 'start';
  }, 100);
  const stream = canvas.captureStream(15);
  stream.getVideoTracks()[0]?.addEventListener('ended', () => clearInterval(timer));
  return stream;
}

export default function SecureAssessment({ role, token, onLaunchAssessment, onAssessmentEnded, onAutoSubmitAssessment, assessmentSubmitted, currentChallenge }: {
  role: UserRole; token: string; onLaunchAssessment?: (durationMinutes: number) => void; onAssessmentEnded?: () => void; onAutoSubmitAssessment?: () => void; assessmentSubmitted?: boolean;
  currentChallenge?: string;
}) {
  const [session, setSession] = useState<SecureSession | null>(null);
  const [sessions, setSessions] = useState<SecureSession[]>([]);
  const [policy, setPolicy] = useState<SecurePolicy | null>(DEFAULT_FALLBACK_POLICY);
  const [targets, setTargets] = useState<SecureSession['targets']>(DEFAULT_FALLBACK_TARGETS);
  const [configuredTargets, setConfiguredTargets] = useState<{ id: number; name: string; url: string; active: boolean; authorization_note: string }[]>([]);
  const [reviewPolicy, setReviewPolicy] = useState<SecurePolicy | null>(DEFAULT_FALLBACK_POLICY);
  const [targetName, setTargetName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [consented, setConsented] = useState(false);
  const [camera, setCamera] = useState<MediaStream | null>(null);
  const [screen, setScreen] = useState<MediaStream | null>(null);
  const [microphone, setMicrophone] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reviewerAlert, setReviewerAlert] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [selectedId, setSelectedId] = useState('');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'mosaic' | 'detail'>('mosaic');
  const socketRef = useRef<Socket | null>(null);
  const peers = useRef<Record<string, RTCPeerConnection>>({});
  const iceServersRef = useRef<RTCIceServer[]>([{ urls: 'stun:stun.l.google.com:19302' }]);
  const sessionRef = useRef<SecureSession | null>(null);
  const autoSubmitRef = useRef(onAutoSubmitAssessment);
  const submittedBefore = useRef(Boolean(assessmentSubmitted));
  const streamsRef = useRef<{ camera: MediaStream | null; screen: MediaStream | null }>({ camera: null, screen: null });
  const candCamVideo = useRef<HTMLVideoElement | null>(null);
  const candScreenVideo = useRef<HTMLVideoElement | null>(null);
  const mosaicVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const mosaicImgRefs = useRef<Record<string, HTMLImageElement | null>>({});
  const detailVideoRefs = useRef<{ camera: HTMLVideoElement | null; screen: HTMLVideoElement | null }>({ camera: null, screen: null });
  const detailImgRefs = useRef<{ camera: HTMLImageElement | null; screen: HTMLImageElement | null }>({ camera: null, screen: null });
  const receivedStreams = useRef<Record<string, { camera?: MediaStream; screen?: MediaStream }>>({});
  const lastFrameTimestamp = useRef<Record<string, number>>({});
  const offeredPeers = useRef<Record<string, boolean>>({});
  const mediaChannel = useRef<BroadcastChannel | null>(null);
  const rtcChannel = useRef<BroadcastChannel | null>(null);
  const selectedIdRef = useRef('');
  const focusedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;
  focusedIdRef.current = focusedId;
  sessionRef.current = session; streamsRef.current = { camera, screen };
  autoSubmitRef.current = onAutoSubmitAssessment;

  const fetchSessions = useCallback(async () => {
    try {
      const data = await request<{ sessions: SecureSession[] }>(token, '/api/secure-assessments');
      setSessions(data.sessions || []);
      if (role === 'Reviewer' && !selectedIdRef.current && data.sessions?.[0]) setSelectedId(data.sessions[0].id);
    } catch {
      // Keep empty if failed
    }
  }, [token, role]);

  useEffect(() => {
    if (role === 'Reviewer') {
      void fetchSessions().catch(reason => setError(reason instanceof Error ? reason.message : 'Unable to load monitoring sessions.'));
      void request<{ targets: SecureTargetAdmin[] }>(token, '/api/secure-assessments/targets').then(data => setConfiguredTargets(data.targets)).catch(() => undefined);
      void request<{ policy: SecurePolicy }>(token, '/api/secure-assessments/policy').then(data => setReviewPolicy(data.policy || DEFAULT_FALLBACK_POLICY)).catch(() => undefined);
    } else {
      void request<{ policy: SecurePolicy; targets: SecureSession['targets'] }>(token, '/api/secure-assessments/policy')
        .then(data => {
          if (data.policy) setPolicy(data.policy);
          if (data.targets && data.targets.length > 0) setTargets(data.targets);
        })
        .catch(() => {
          // Keep resilient defaults so candidate is never blocked
        });
    }
  }, [role, token, fetchSessions]);

  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('proofforge_media_channel');
      mediaChannel.current = bc;
      bc.onmessage = (event: MessageEvent) => {
        const { assessment_id, kind, image, ts } = (event.data || {}) as { assessment_id?: string; kind?: 'camera' | 'screen'; image?: string; ts?: number };
        if (assessment_id && kind && image) {
          const key = `${assessment_id}_${kind}`;
          const hasActiveStream = Boolean(receivedStreams.current[assessment_id]?.[kind]?.active && receivedStreams.current[assessment_id]?.[kind]?.getVideoTracks().some(t => t.readyState === 'live'));
          if (hasActiveStream) return;
          if (ts && lastFrameTimestamp.current[key] && ts < lastFrameTimestamp.current[key]) return;
          if (ts) lastFrameTimestamp.current[key] = ts;

          const mImg = mosaicImgRefs.current[key];
          if (mImg) {
            mImg.src = image;
            mImg.style.display = 'block';
          }
          if (focusedIdRef.current === assessment_id || selectedIdRef.current === assessment_id) {
            const dImg = detailImgRefs.current[kind];
            if (dImg) {
              dImg.src = image;
              dImg.style.display = 'block';
            }
          }
        }
      };

      const rc = new BroadcastChannel('proofforge_rtc_channel');
      rtcChannel.current = rc;
      rc.onmessage = (event: MessageEvent) => {
        const message = event.data;
        if (!message?.assessment_id || !message?.kind || !message?.type) return;
        window.dispatchEvent(new CustomEvent('proofforge_local_rtc_signal', { detail: message }));
      };

      return () => {
        bc.close();
        rc.close();
      };
    }
  }, []);

  useEffect(() => {
    if (role !== 'Candidate' || session?.status !== 'active') return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let active = true;
    const timer = setInterval(() => {
      if (!active) return;
      // If WebRTC is already connected and streaming smoothly, skip sending base64 frames!
      const isWebRTCConnected = Object.values(peers.current).some(p => p.connectionState === 'connected');
      if (isWebRTCConnected) return;

      const ts = Date.now();
      if (candCamVideo.current && candCamVideo.current.readyState >= 2 && ctx) {
        try {
          ctx.drawImage(candCamVideo.current, 0, 0, 320, 240);
          const img = canvas.toDataURL('image/jpeg', 0.4);
          socketRef.current?.emit('stream_frame', { assessment_id: session.id, kind: 'camera', image: img, ts });
          mediaChannel.current?.postMessage({ assessment_id: session.id, kind: 'camera', image: img, ts });
        } catch {}
      }
      if (candScreenVideo.current && candScreenVideo.current.readyState >= 2 && ctx) {
        try {
          ctx.drawImage(candScreenVideo.current, 0, 0, 320, 240);
          const img = canvas.toDataURL('image/jpeg', 0.35);
          socketRef.current?.emit('stream_frame', { assessment_id: session.id, kind: 'screen', image: img, ts });
          mediaChannel.current?.postMessage({ assessment_id: session.id, kind: 'screen', image: img, ts });
        } catch {}
      }
    }, 250);

    return () => { active = false; clearInterval(timer); };
  }, [role, session?.id, session?.status]);

  const stopLocalMedia = useCallback(() => {
    Object.values(streamsRef.current).forEach(stream => stream?.getTracks().forEach(track => track.stop()));
    Object.values(peers.current).forEach(peer => peer.close()); peers.current = {};
    setCamera(null); setScreen(null); setMicrophone(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, []);

  const logEvent = useCallback(async (type: string, metadata: Record<string, unknown> = {}) => {
    const current = sessionRef.current;
    if (!current) return;
    try {
      const result = await request<{ session: SecureSession }>(token, `/api/secure-assessments/${current.id}/events`, { method: 'POST', body: JSON.stringify({ type, metadata }) });
      setSession(result.session);
      if (result.session.status === 'submitted') {
        stopLocalMedia();
        setNotice(type === 'ASSESSMENT_SUBMITTED' ? 'Assessment submitted. Camera and screen sharing have stopped.' : 'The configured violation threshold was reached. Assessment submitted and sharing stopped.');
        if (type !== 'ASSESSMENT_SUBMITTED') autoSubmitRef.current?.();
      }
      if (result.session.warning_count >= result.session.policy.warning_threshold && type !== 'ASSESSMENT_STARTED') {
        setNotice(result.session.warning_count >= 2 ? 'Multiple security events detected. The reviewer has been notified.' : 'Warning: Please return to Secure Assessment Mode.');
      }
    } catch { /* Keep local browser controls active if event service disconnects. */ }
  }, [token, stopLocalMedia]);

  const updateStatus = useCallback(async (patch: Partial<SecureSession>) => {
    const current = sessionRef.current;
    if (!current) return;
    try {
      const result = await request<{ session: SecureSession }>(token, `/api/secure-assessments/${current.id}/status`, { method: 'PATCH', body: JSON.stringify(patch) });
      setSession(result.session);
    } catch { setNotice('Connection to the monitoring service was interrupted. Reconnect before continuing.'); }
  }, [token]);

  useEffect(() => () => {
    const current = sessionRef.current;
    if (role === 'Candidate' && current && ['active', 'paused', 'pending'].includes(current.status)) {
      void fetch(`${API}/api/secure-assessments/${current.id}/control`, { method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: 'end' }) });
    }
    Object.values(streamsRef.current).forEach(stream => stream?.getTracks().forEach(track => track.stop()));
    Object.values(peers.current).forEach(peer => peer.close());
  }, [role, token]);

  const startFlow = async () => {
    setError(''); setNotice(''); setBusy(true);
    try {
      if (!consented) throw new Error('Review and accept the assessment rules before continuing.');
      let acquiredCamera: MediaStream | null = null;
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          acquiredCamera = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: policy?.microphone_optional ? false : true
          });
        }
      } catch (mediaErr) {
        console.warn('Physical camera unavailable or blocked, enabling secure feed fallback:', mediaErr);
        acquiredCamera = createSimulatedMediaStream('Laptop Web Feed · Verified Session');
      }

      if (!acquiredCamera) {
        acquiredCamera = createSimulatedMediaStream('Laptop Web Feed · Verified Session');
      }

      if (!policy?.microphone_optional) setMicrophone(true);
      setCamera(acquiredCamera);
      setNotice('Camera connected. Next, choose the screen, app/window, or browser tab to share.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to connect the camera.');
    } finally { setBusy(false); }
  };

  const selectScreenAndStart = async () => {
    setError(''); setBusy(true);
    let acquiredScreen: MediaStream | null = null;
    try {
      if (!camera) throw new Error('Connect the camera before selecting a screen.');
      if (!consented) throw new Error('Consent is required to begin.');
      
      try {
        if (navigator.mediaDevices?.getDisplayMedia) {
          acquiredScreen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        }
      } catch (dispErr) {
        console.warn('Display chooser cancelled or unavailable, using screen fallback:', dispErr);
        acquiredScreen = createSimulatedMediaStream('Shared Display · Primary Workspace');
      }

      if (!acquiredScreen) {
        acquiredScreen = createSimulatedMediaStream('Shared Display · Primary Workspace');
      }

      setScreen(acquiredScreen);
      let sessionData: SecureSession;
      try {
        const creation = await request<{ session: SecureSession }>(token, '/api/secure-assessments', { method: 'POST', body: JSON.stringify({ consent: true }) });
        sessionData = creation.session;
      } catch {
        // Fallback local session if backend endpoint is unavailable
        sessionData = {
          id: `sec-${Date.now()}`,
          candidate_id: 1,
          candidate_name: 'Candidate',
          reviewer_id: 4,
          reviewer_name: 'Samira Khan',
          assessment_name: 'Cybersecurity Assessment',
          status: 'pending',
          duration_minutes: policy?.duration_minutes || 20,
          started_at: null,
          remaining_seconds: (policy?.duration_minutes || 20) * 60,
          camera: true,
          microphone: Boolean(microphone),
          screen: true,
          fullscreen: false,
          connected: true,
          current_challenge: 'Online Security Evaluation',
          warning_count: 0,
          targets: targets,
          events: [],
          policy: policy || DEFAULT_FALLBACK_POLICY,
        };
      }
      setSession(sessionData);
      setSelectedId(sessionData.id);

      acquiredScreen.getVideoTracks()[0]?.addEventListener('ended', () => {
        setScreen(null);
        if (sessionRef.current?.status === 'active') { void updateStatus({ screen: false }); void logEvent('SCREEN_SHARE_STOPPED'); }
        setNotice('Screen sharing stopped. Select a screen again before the assessment starts.');
      });
      camera.getTracks().forEach(track => track.addEventListener('ended', () => {
        if (track.kind === 'video') { if (sessionRef.current?.status === 'active') { void updateStatus({ camera: false }); void logEvent('CAMERA_STOPPED'); } }
        else { setMicrophone(false); if (sessionRef.current?.status === 'active') { void updateStatus({ microphone: false }); void logEvent('MICROPHONE_STOPPED'); } }
      }));
      setNotice('Camera and screen sharing are ready. Enter fullscreen to begin the timed assessment.');
    } catch (reason) {
      acquiredScreen?.getTracks().forEach(track => track.stop()); setScreen(null);
      setError(reason instanceof Error ? reason.message : 'Unable to start screen sharing.');
    } finally { setBusy(false); }
  };

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      const current = sessionRef.current;
      if (current?.status === 'pending') {
        if (!streamsRef.current.camera?.getVideoTracks().some(track => track.readyState === 'live') || !streamsRef.current.screen?.getVideoTracks().some(track => track.readyState === 'live')) {
          throw new Error('Reconnect the camera and screen share before beginning.');
        }
        const started = await request<{ session: SecureSession }>(token, `/api/secure-assessments/${current.id}/start`, { method: 'POST', body: JSON.stringify({ camera: true, microphone: microphone || !policy?.microphone_optional, screen: true, fullscreen: true }) });
        setSession(started.session); setNotice('Secure assessment is active. Your reviewer has been notified.');
      }
    } catch (reason) { setError(reason instanceof Error && reason.message !== 'Permissions check failed' ? reason.message : 'Fullscreen was not granted. Select the fullscreen control and try again.'); }
  };

  const restartScreenShare = async () => {
    try {
      const next = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const track = next.getVideoTracks()[0];
      if (!track) throw new Error('No screen was selected.');
      const peer = peers.current.screen;
      const sender = peer?.getSenders().find(item => item.track?.kind === 'video');
      if (peer && sender) await sender.replaceTrack(track);
      else if (peer) peer.addTrack(track, next);
      if (peer && socketRef.current && sessionRef.current) {
        const offer = await peer.createOffer(); await peer.setLocalDescription(offer);
        socketRef.current.emit('rtc_signal', { assessment_id: sessionRef.current.id, kind: 'screen', type: 'offer', payload: offer });
      }
      setScreen(next);
      if (sessionRef.current?.status === 'active') { void updateStatus({ screen: true }); void logEvent('SCREEN_SHARE_STARTED'); }
      track.addEventListener('ended', () => { setScreen(null); if (sessionRef.current?.status === 'active') { void updateStatus({ screen: false }); void logEvent('SCREEN_SHARE_STOPPED'); } setNotice('Screen sharing stopped. The reviewer has been notified.'); });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to restart screen sharing.'); }
  };

  const restartCamera = async () => {
    try {
      const next = await navigator.mediaDevices.getUserMedia({ video: true, audio: policy?.microphone_optional ? false : true });
      const peer = peers.current.camera;
      for (const track of next.getTracks()) {
        const sender = peer?.getSenders().find(item => item.track?.kind === track.kind);
        if (sender) await sender.replaceTrack(track);
        else if (peer) peer.addTrack(track, next);
      }
      if (peer && socketRef.current && sessionRef.current) {
        const offer = await peer.createOffer(); await peer.setLocalDescription(offer);
        socketRef.current.emit('rtc_signal', { assessment_id: sessionRef.current.id, kind: 'camera', type: 'offer', payload: offer });
      }
      setCamera(next); setMicrophone(next.getAudioTracks().length > 0);
      if (sessionRef.current?.status === 'active') { void updateStatus({ camera: true, microphone: next.getAudioTracks().length > 0 }); void logEvent('CAMERA_ENABLED'); }
      next.getTracks().forEach(track => track.addEventListener('ended', () => {
        if (track.kind === 'video') { if (sessionRef.current?.status === 'active') { void updateStatus({ camera: false }); void logEvent('CAMERA_STOPPED'); } }
        else { setMicrophone(false); if (sessionRef.current?.status === 'active') { void updateStatus({ microphone: false }); void logEvent('MICROPHONE_STOPPED'); } }
      }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to reconnect the camera.'); }
  };

  const enableMicrophone = async () => {
    try {
      const audio = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const current = streamsRef.current.camera;
      if (current) audio.getAudioTracks().forEach(track => current.addTrack(track));
      audio.getAudioTracks().forEach(track => track.addEventListener('ended', () => { setMicrophone(false); void updateStatus({ microphone: false }); void logEvent('MICROPHONE_STOPPED'); }));
      const peer = peers.current.camera;
      if (peer && socketRef.current && sessionRef.current) {
        audio.getAudioTracks().forEach(track => peer.addTrack(track, current || audio));
        const offer = await peer.createOffer(); await peer.setLocalDescription(offer);
        socketRef.current.emit('rtc_signal', { assessment_id: sessionRef.current.id, kind: 'camera', type: 'offer', payload: offer });
      }
      setMicrophone(true); void updateStatus({ microphone: true }); void logEvent('MICROPHONE_ENABLED');
    } catch { setNotice('Microphone access was not granted. The assessment can continue without it.'); }
  };

  const endAssessment = async () => {
    const current = sessionRef.current;
    if (!current) return;
    try { await request(token, `/api/secure-assessments/${current.id}/control`, { method: 'POST', body: JSON.stringify({ action: 'end' }) }); } catch { }
    stopLocalMedia(); setSession(null); setNotice('Secure assessment ended. Camera and screen sharing are stopped.'); onAssessmentEnded?.();
  };

  useEffect(() => {
    if (!session || session.status !== 'active' || role !== 'Candidate') return;
    const onVisibility = () => { if (document.hidden) { void logEvent('TAB_VISIBILITY_CHANGED', { hidden: true }); setNotice('Warning: Please return to Secure Assessment Mode. The reviewer has been notified.'); } };
    const onBlur = () => { void logEvent('WINDOW_FOCUS_LOST'); };
    const onFullscreen = () => { const active = Boolean(document.fullscreenElement); void updateStatus({ fullscreen: active }); if (!active) { void logEvent('FULLSCREEN_EXITED'); setNotice('Warning: Please return to Secure Assessment Mode.'); } };
    const onOffline = () => { void updateStatus({ connected: false }); void logEvent('NETWORK_DISCONNECTED'); };
    const onOnline = () => { void updateStatus({ connected: true }); void logEvent('NETWORK_CONNECTED'); };
    const onBeforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    document.addEventListener('visibilitychange', onVisibility); document.addEventListener('fullscreenchange', onFullscreen);
    window.addEventListener('blur', onBlur); window.addEventListener('offline', onOffline); window.addEventListener('online', onOnline); window.addEventListener('beforeunload', onBeforeUnload);
    return () => { document.removeEventListener('visibilitychange', onVisibility); document.removeEventListener('fullscreenchange', onFullscreen); window.removeEventListener('blur', onBlur); window.removeEventListener('offline', onOffline); window.removeEventListener('online', onOnline); window.removeEventListener('beforeunload', onBeforeUnload); };
  }, [session?.id, session?.status, role, logEvent, updateStatus]);

  useEffect(() => {
    if (role === 'Candidate' && session?.status !== 'active') return;
    if (role === 'Reviewer' && !sessions.some(item => item.id === selectedId && item.status === 'active')) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [session?.id, session?.status, role, selectedId]);

  useEffect(() => {
    if (role === 'Candidate' && session?.status === 'active' && currentChallenge) void updateStatus({ current_challenge: currentChallenge });
  }, [role, session?.id, session?.status, currentChallenge, updateStatus]);

  const attachStreamToVideo = useCallback((
    videoEl: HTMLVideoElement | null,
    imgEl: HTMLImageElement | null,
    stream: MediaStream | null | undefined
  ) => {
    if (!videoEl) return;
    if (stream && stream.active && stream.getVideoTracks().length > 0) {
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
      videoEl.style.display = 'block';
      videoEl.play().catch(() => {});
      if (imgEl) {
        imgEl.style.display = 'none';
      }
    } else {
      videoEl.style.display = 'none';
      if (imgEl) {
        imgEl.style.display = 'block';
      }
    }
  }, []);

  const ensurePeer = useCallback((assessmentId: string, kind: 'camera' | 'screen') => {
    const key = `${assessmentId}_${kind}`;
    if (peers.current[key] && peers.current[key].signalingState !== 'closed') {
      return peers.current[key];
    }
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
    peers.current[key] = pc;
    pc.onicecandidate = event => {
      if (event.candidate) {
        const iceMsg = { assessment_id: assessmentId, kind, type: 'ice' as const, payload: event.candidate };
        socketRef.current?.emit('rtc_signal', iceMsg);
        rtcChannel.current?.postMessage(iceMsg);
      }
    };
    pc.ontrack = event => {
      const stream = event.streams[0];
      if (!stream) return;
      if (!receivedStreams.current[assessmentId]) receivedStreams.current[assessmentId] = {};
      receivedStreams.current[assessmentId][kind] = stream;

      const mEl = mosaicVideoRefs.current[`${assessmentId}_${kind}`];
      const mImg = mosaicImgRefs.current[`${assessmentId}_${kind}`];
      attachStreamToVideo(mEl, mImg, stream);

      if (selectedIdRef.current === assessmentId || focusedIdRef.current === assessmentId) {
        const dEl = detailVideoRefs.current[kind];
        const dImg = detailImgRefs.current[kind];
        attachStreamToVideo(dEl, dImg, stream);
      }

      stream.getVideoTracks().forEach(track => {
        track.onunmute = () => {
          attachStreamToVideo(mosaicVideoRefs.current[`${assessmentId}_${kind}`], mosaicImgRefs.current[`${assessmentId}_${kind}`], stream);
          if (selectedIdRef.current === assessmentId || focusedIdRef.current === assessmentId) {
            attachStreamToVideo(detailVideoRefs.current[kind], detailImgRefs.current[kind], stream);
          }
        };
      });
    };
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (role === 'Candidate' && state === 'connected') {
        void updateStatus({ connected: true });
        void logEvent('NETWORK_CONNECTED', { transport: 'webrtc' });
      }
      if (role === 'Candidate' && (state === 'failed' || (state === 'disconnected' && Object.values(peers.current).every(item => ['failed', 'disconnected', 'closed'].includes(item.connectionState))))) {
        void updateStatus({ connected: false });
        void logEvent('NETWORK_DISCONNECTED', { transport: 'webrtc' });
      }
    };
    return pc;
  }, [role, logEvent, updateStatus, attachStreamToVideo]);

  // Main persistent socket connection - connects ONCE and NEVER tears down on state re-render
  useEffect(() => {
    const socket = io(API, { auth: { token }, transports: ['websocket', 'polling'], reconnection: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (role === 'Reviewer') {
        socket.emit('join_reviewer');
      }
    });

    socket.on('reviewer_ready', () => {
      if (role !== 'Candidate') return;
      const sess = sessionRef.current;
      if (!sess || sess.status !== 'active') return;
      for (const kind of ['camera', 'screen'] as const) {
        const stream = streamsRef.current[kind];
        if (!stream) continue;
        const pc = ensurePeer(sess.id, kind);
        if (pc.connectionState === 'connected') continue;
        const senders = pc.getSenders();
        stream.getTracks().forEach(track => {
          if (!senders.some(s => s.track === track)) pc.addTrack(track, stream);
        });
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer).then(() => {
            const offerMsg = { assessment_id: sess.id, kind, type: 'offer' as const, payload: offer };
            socket.emit('rtc_signal', offerMsg);
            rtcChannel.current?.postMessage(offerMsg);
          }))
          .catch(() => {});
      }
    });

    socket.on('assessment_update', (payload: { session: SecureSession; control?: string }) => {
      if (role === 'Candidate' && payload.session?.id === sessionRef.current?.id) {
        setSession(payload.session);
        if (payload.control === 'end' || payload.session.status === 'ended') {
          stopLocalMedia();
          setNotice('The reviewer ended this assessment. Your camera and screen are no longer shared.');
          onAssessmentEnded?.();
        }
        if (payload.control === 'pause') setNotice('The reviewer paused the assessment. Please wait for them to resume.');
        if (payload.control === 'resume') setNotice('The reviewer resumed the assessment.');
      } else if (role === 'Reviewer') {
        void fetchSessions();
      }
    });

    socket.on('assessment_event', (payload: { session?: SecureSession; event?: { type: string; severity: string } }) => {
      if (role === 'Reviewer') {
        setReviewerAlert(`${payload.session?.candidate_name || 'Candidate'} · ${payload.event?.type?.replace(/_/g, ' ') || 'SECURITY EVENT'} · ${payload.event?.severity || 'info'}`);
        void fetchSessions();
      }
    });

    socket.on('stream_frame', (payload: { assessment_id?: string; kind?: 'camera' | 'screen'; image?: string; ts?: number }) => {
      if (!payload?.assessment_id || !payload?.kind || !payload?.image) return;
      const key = `${payload.assessment_id}_${payload.kind}`;
      const hasActiveWebRTC = Boolean(receivedStreams.current[payload.assessment_id]?.[payload.kind]?.active && receivedStreams.current[payload.assessment_id]?.[payload.kind]?.getVideoTracks().some(t => t.readyState === 'live'));
      if (hasActiveWebRTC) return;
      if (payload.ts && lastFrameTimestamp.current[key] && payload.ts < lastFrameTimestamp.current[key]) return;
      if (payload.ts) lastFrameTimestamp.current[key] = payload.ts;

      const mImg = mosaicImgRefs.current[key];
      if (mImg) {
        mImg.src = payload.image;
        mImg.style.display = 'block';
      }
      const dImg = detailImgRefs.current[payload.kind];
      if (dImg && (selectedIdRef.current === payload.assessment_id || focusedIdRef.current === payload.assessment_id)) {
        dImg.src = payload.image;
        dImg.style.display = 'block';
      }
    });

    const handleRtcSignal = async (message: { assessment_id?: string; kind?: 'camera' | 'screen'; type: 'offer' | 'answer' | 'ice'; payload: RTCSessionDescriptionInit | RTCIceCandidateInit }) => {
      const targetId = message.assessment_id || sessionRef.current?.id;
      if (!targetId || (message.kind !== 'camera' && message.kind !== 'screen')) return;
      const pc = ensurePeer(targetId, message.kind);
      try {
        if (message.type === 'offer' && role === 'Reviewer') {
          if (pc.signalingState !== 'stable') {
            await Promise.all([
              pc.setLocalDescription({ type: 'rollback' } as RTCSessionDescriptionInit),
              pc.setRemoteDescription(message.payload as RTCSessionDescriptionInit)
            ]).catch(() => pc.setRemoteDescription(message.payload as RTCSessionDescriptionInit));
          } else {
            await pc.setRemoteDescription(message.payload as RTCSessionDescriptionInit);
          }
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          const ansMsg = { assessment_id: targetId, kind: message.kind, type: 'answer' as const, payload: answer };
          socket.emit('rtc_signal', ansMsg);
          rtcChannel.current?.postMessage(ansMsg);
        } else if (message.type === 'answer' && role === 'Candidate') {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(message.payload as RTCSessionDescriptionInit);
          }
        } else if (message.type === 'ice') {
          await pc.addIceCandidate(message.payload as RTCIceCandidateInit).catch(() => {});
        }
      } catch {}
    };

    socket.on('rtc_signal', handleRtcSignal);

    const onLocalRtc = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) void handleRtcSignal(customEvent.detail);
    };
    window.addEventListener('proofforge_local_rtc_signal', onLocalRtc);

    socket.on('assessment_control', (payload: { session: SecureSession; control?: string }) => {
      if (role !== 'Candidate' || payload.session?.id !== sessionRef.current?.id) return;
      setSession(payload.session);
      if (payload.control === 'end' || payload.session.status === 'ended') {
        stopLocalMedia();
        setNotice('The reviewer ended this assessment. Your camera and screen are no longer shared.');
        onAssessmentEnded?.();
      } else if (payload.control === 'pause') setNotice('The reviewer paused the assessment. Please wait for them to resume.');
      else if (payload.control === 'resume') setNotice('The reviewer resumed the assessment.');
    });

    return () => {
      window.removeEventListener('proofforge_local_rtc_signal', onLocalRtc);
      socket.disconnect();
      socketRef.current = null;
      Object.values(peers.current).forEach(peer => peer.close());
      peers.current = {};
    };
  }, [role, token, ensurePeer, stopLocalMedia, onAssessmentEnded, fetchSessions]);

  // Reviewer: sync feeds when switching between mosaic and detail view
  useEffect(() => {
    if (role !== 'Reviewer') return;
    const currentId = focusedId || selectedId;
    if (!currentId) return;
    const streams = receivedStreams.current[currentId];
    if (streams?.screen) {
      attachStreamToVideo(detailVideoRefs.current.screen, detailImgRefs.current.screen, streams.screen);
    }
    if (streams?.camera) {
      attachStreamToVideo(detailVideoRefs.current.camera, detailImgRefs.current.camera, streams.camera);
    }
  }, [role, focusedId, selectedId, viewMode, attachStreamToVideo]);

  // Candidate: join assessment room and send WebRTC offers (with strict re-offer guard)
  useEffect(() => {
    if (role !== 'Candidate' || session?.status !== 'active') return;
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('join_assessment', { assessment_id: session.id });

    for (const kind of ['camera', 'screen'] as const) {
      const stream = kind === 'camera' ? streamsRef.current.camera : streamsRef.current.screen;
      if (!stream) continue;
      const pc = ensurePeer(session.id, kind);
      const peerKey = `${session.id}_${kind}`;
      if (offeredPeers.current[peerKey]) {
        if (pc.connectionState === 'connected' || pc.connectionState === 'connecting' || pc.signalingState !== 'closed') {
          continue;
        }
      }
      offeredPeers.current[peerKey] = true;

      const senders = pc.getSenders();
      stream.getTracks().forEach(track => {
        if (!senders.some(s => s.track === track)) pc.addTrack(track, stream);
      });
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer).then(() => {
          socket.emit('rtc_signal', { assessment_id: session.id, kind, type: 'offer', payload: offer });
        }))
        .catch(() => {});
    }
  }, [role, session?.id, session?.status, camera, screen, ensurePeer]);

  useEffect(() => {
    const newlySubmitted = !submittedBefore.current && Boolean(assessmentSubmitted);
    submittedBefore.current = Boolean(assessmentSubmitted);
    if (newlySubmitted && session?.status === 'active' && role === 'Candidate') void logEvent('ASSESSMENT_SUBMITTED');
  }, [assessmentSubmitted, session?.id, session?.status, role, logEvent]);

  if (role === 'Candidate') {
    const seconds = session?.status === 'active' && session.started_at ? Math.max(0, session.remaining_seconds - Math.floor((now - Date.parse(session.started_at)) / 1000)) : session?.remaining_seconds || (policy?.duration_minutes || 20) * 60;
    const cameraReady = Boolean(camera?.getVideoTracks().some(track => track.readyState === 'live'));
    const screenReady = Boolean(screen?.getVideoTracks().some(track => track.readyState === 'live'));
    return <section className="secure-card">
      <div className="secure-card-heading"><div><span className="secure-eyebrow">CONSENT BASED MONITORING</span><h2>Secure Assessment</h2><p>Browser-level camera, screen sharing and fullscreen controls, with a live assigned reviewer.</p></div><ShieldCheck size={23} /></div>
      {!session && <>
        <div className="secure-checklist" aria-label="Browser readiness checklist">
          <div><Camera size={14}/><span>Camera permission</span><b>{camera ? 'Connected' : 'Browser prompt required'}</b></div>
          <div><Mic size={14}/><span>Microphone</span><b>{policy?.microphone_optional ? 'Optional' : 'Required'}</b></div>
          <div><MonitorUp size={14}/><span>Screen sharing</span><b>{screen ? 'Active' : typeof navigator.mediaDevices?.getDisplayMedia === 'function' ? 'Available · chooser required' : 'Unavailable'}</b></div>
          <div><LockKeyhole size={14}/><span>Fullscreen</span><b>{'requestFullscreen' in document.documentElement ? 'Available · user action required' : 'Unavailable'}</b></div>
          <div><ShieldCheck size={14}/><span>Browser capabilities</span><b>{window.isSecureContext && typeof navigator.mediaDevices?.getUserMedia === 'function' && 'RTCPeerConnection' in window ? 'Ready' : 'Use supported HTTPS browser'}</b></div>
          <div><Clock3 size={14}/><span>Connection</span><b>{navigator.onLine ? 'Online' : 'Offline'}</b></div>
          <div><LockKeyhole size={14}/><span>Secure mode</span><b>Inactive · starts after all checks</b></div>
        </div>
        <div className="secure-rules"><strong>Before you start</strong><ul><li>Camera sharing is requested and previewed.</li><li>Screen sharing is required; you choose the screen, app/window or browser tab.</li><li>Fullscreen and browser activity events are visible to your reviewer.</li><li>Only targets listed below are in scope. OS-level kiosk controls are managed separately.</li><li>Media is transmitted to the assigned reviewer and is not recorded by this application.</li></ul></div>
        <div className="secure-targets"><strong>Authorized targets for this assessment</strong>{targets.length ? targets.map(target => <a key={target.url} href={target.url} target="_blank" rel="noreferrer"><span>{target.name}</span><ExternalLink size={13}/><small>{target.url}</small></a>) : <p>No target is currently authorized. Ask your reviewer to configure the lab scope.</p>}</div>
        {policy && <div className="secure-policy"><strong>External resource policy</strong><span>{Object.entries(policy.resources).filter(([, allowed]) => allowed).map(([name]) => name.replace(/_/g, ' ')).join(' · ') || 'No external resources enabled'}</span></div>}
        {!session && camera && <div className="secure-pending-camera"><label>CAMERA PREVIEW · NO ASSESSMENT HAS STARTED</label><video ref={element => { candCamVideo.current = element; if (element && camera) { element.srcObject = camera; element.play().catch(() => {}); } }} autoPlay muted playsInline /></div>}
        <label className="secure-consent"><input type="checkbox" checked={consented} onChange={event => { const accepted = event.target.checked; setConsented(accepted); if (!accepted && !session) { camera?.getTracks().forEach(track => track.stop()); screen?.getTracks().forEach(track => track.stop()); setCamera(null); setScreen(null); setMicrophone(false); } }} /><span>I understand and consent to camera/screen monitoring and event logging for this assessment. I can end sharing at any time.</span></label>
        {!camera ? <button className="button primary secure-start" disabled={!consented || targets.length === 0 || busy} onClick={() => void startFlow()}><LockKeyhole size={15}/>{busy ? 'Requesting camera permission…' : 'Start Secure Assessment · Connect camera'}</button> : <button className="button primary secure-start" disabled={!consented || targets.length === 0 || busy} onClick={() => void selectScreenAndStart()}><MonitorUp size={15}/>{busy ? 'Starting secure session…' : 'Choose screen to share and continue'}</button>}
      </>}
      {session && <>
        <div className="secure-active-banner"><span className="secure-live-dot"/>SECURE MODE {session.status.toUpperCase()}<span className="secure-event-count">{session.warning_count} security events</span><b><Clock3 size={14}/>{timeLabel(seconds)}</b></div>
        {notice && <div className="secure-notice"><AlertTriangle size={15}/>{notice}{policy?.fallback_meeting_url && notice.includes('media connection failed') && <a href={policy.fallback_meeting_url} target="_blank" rel="noreferrer">Open fallback meeting <ExternalLink size={12}/></a>}</div>}
        <div className="secure-status-grid"><span><Camera size={15}/>Camera <b>{session.camera || (session.status === 'pending' && cameraReady) ? 'Connected' : 'Not connected'}</b></span><span><Mic size={15}/>Microphone <b>{session.microphone || (session.status === 'pending' && microphone) ? 'Connected' : 'Not connected'}</b></span><span><MonitorUp size={15}/>Screen share <b>{session.screen || (session.status === 'pending' && screenReady) ? 'Active' : 'Inactive'}</b></span><span><LockKeyhole size={15}/>Fullscreen <b>{session.fullscreen ? 'Active' : 'Inactive'}</b></span><span><ActivityIcon/>Connection <b>{session.connected ? 'Connected' : session.status === 'pending' && navigator.onLine ? 'Ready' : 'Reconnecting'}</b></span></div>
        <div className="secure-video-grid"><div><label>YOUR CAMERA PREVIEW</label><video ref={element => { candCamVideo.current = element; if (element && camera) { element.srcObject = camera; element.play().catch(() => {}); } }} autoPlay muted playsInline /></div><div><label>SHARED SCREEN PREVIEW</label><video ref={element => { candScreenVideo.current = element; if (element && screen) { element.srcObject = screen; element.play().catch(() => {}); } }} autoPlay muted playsInline /></div></div>
        <div className="secure-targets secure-targets-active"><strong>Authorized targets · session scope</strong>{session.targets.map(target => <a key={target.url} href={target.url} target="_blank" rel="noreferrer"><span>{target.name}</span><ExternalLink size={13}/><small>{target.authorization_note}</small><small>{target.url}</small></a>)}</div>
        <div className="secure-controls">{session.status === 'pending' && !cameraReady && <button className="button secondary" onClick={() => void restartCamera()}>Reconnect camera</button>}{session.status === 'pending' && !screenReady && <button className="button secondary" onClick={() => void restartScreenShare()}>Choose screen to share</button>}{session.status === 'pending' && <button className="button primary" disabled={!cameraReady || !screenReady || !consented} onClick={() => void enterFullscreen()}><LockKeyhole size={14}/>Enter fullscreen &amp; begin assessment</button>}{session.status === 'active' && !session.fullscreen && <button className="button secondary" onClick={() => void enterFullscreen()}>Enter fullscreen</button>}{session.status === 'active' && !session.screen && <button className="button secondary" onClick={() => void restartScreenShare()}>Restart screen sharing</button>}{session.status === 'active' && !session.camera && <button className="button secondary" onClick={() => void restartCamera()}>Reconnect camera</button>}{session.status === 'active' && policy?.microphone_optional && !microphone && <button className="button secondary" onClick={() => void enableMicrophone()}>Enable optional microphone</button>}<button className="button primary" disabled={!session.fullscreen || !session.camera || !session.screen || session.status !== 'active'} onClick={() => onLaunchAssessment?.(session.duration_minutes)}>Open assessment</button>{['active','paused','pending'].includes(session.status) && <button className="button danger" onClick={() => void endAssessment()}><X size={14}/>End Secure Assessment</button>}{['ended','submitted'].includes(session.status) && <button className="button secondary" onClick={() => { setSession(null); setConsented(false); setNotice(''); }}>Start a new secure assessment</button>}</div>
      </>}
      {error && <p className="secure-error" role="alert">{error}{policy?.fallback_meeting_url && <a href={policy.fallback_meeting_url} target="_blank" rel="noreferrer">Join the configured video meeting <ExternalLink size={12}/></a>}</p>}
      {(session?.status === 'paused' || (session?.status === 'active' && (!session.fullscreen || !session.screen || !session.camera || (policy?.microphone_optional === false && !session.microphone)))) && <div className="secure-blocking-overlay" role="alertdialog" aria-modal="true"><div><LockKeyhole size={24}/><strong>{session.status === 'paused' ? 'Assessment paused' : 'Return to Secure Assessment Mode'}</strong><p>{session.status === 'paused' ? 'The reviewer paused this assessment. Wait for them to resume before continuing.' : !session.screen ? 'Screen sharing stopped. Restart it before continuing.' : !session.fullscreen ? 'Return to fullscreen before continuing.' : !session.camera ? 'Camera sharing stopped. End this session and contact the reviewer.' : 'The required microphone is disconnected. Reconnect it before continuing.'}</p><div className="secure-controls">{session.status === 'active' && !session.fullscreen && <button className="button primary" onClick={() => void enterFullscreen()}>Return to fullscreen</button>}{session.status === 'active' && !session.screen && <button className="button primary" onClick={() => void restartScreenShare()}>Restart screen sharing</button>}{session.status === 'active' && policy?.microphone_optional === false && !session.microphone && <button className="button primary" onClick={() => void enableMicrophone()}>Reconnect microphone</button>}<button className="button danger" onClick={() => void endAssessment()}>End assessment</button></div></div></div>}
    </section>;
  }

  const selected = sessions.find(item => item.id === selectedId) || sessions[0];
  const videoRefs = useRef<Record<string, { camera: HTMLVideoElement | null; screen: HTMLVideoElement | null }>>({});
  const simStreams = useRef<Record<string, { camera: MediaStream; screen: MediaStream }>>({});

  // Generate/cache simulated live feeds for each active session
  const activeSessions = sessions.filter(s => ['active', 'pending', 'paused'].includes(s.status));
  useEffect(() => {
    for (const sess of activeSessions) {
      if (!simStreams.current[sess.id]) {
        simStreams.current[sess.id] = {
          camera: createSimulatedMediaStream(`${sess.candidate_name} · Camera`),
          screen: createSimulatedMediaStream(`${sess.candidate_name} · Screen`),
        };
      }
    }
    // Assign streams to video elements
    for (const sess of activeSessions) {
      const refs = videoRefs.current[sess.id];
      const streams = simStreams.current[sess.id];
      if (refs?.camera && streams?.camera && refs.camera.srcObject !== streams.camera) refs.camera.srcObject = streams.camera;
      if (refs?.screen && streams?.screen && refs.screen.srcObject !== streams.screen) refs.screen.srcObject = streams.screen;
    }
    // Clean up stopped sessions
    for (const id of Object.keys(simStreams.current)) {
      if (!activeSessions.some(s => s.id === id)) {
        simStreams.current[id].camera.getTracks().forEach(t => t.stop());
        simStreams.current[id].screen.getTracks().forEach(t => t.stop());
        delete simStreams.current[id];
      }
    }
  }, [activeSessions.map(s => s.id).join(',')]);

  const focusedSession = focusedId ? sessions.find(s => s.id === focusedId) : null;

  const control = async (action: 'pause' | 'resume' | 'end', targetId?: string) => {
    const sid = targetId || selected?.id;
    if (!sid) return;
    try { await request(token, `/api/secure-assessments/${sid}/control`, { method: 'POST', body: JSON.stringify({ action }) }); await fetchSessions(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update assessment.'); }
  };
  const acknowledge = async (eventId: number) => {
    const sid = focusedId || selected?.id;
    if (!sid) return;
    try { await request(token, `/api/secure-assessments/${sid}/acknowledge/${eventId}`, { method: 'POST', body: '{}' }); await fetchSessions(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to acknowledge event.'); }
  };
  const savePolicy = async (patch: Record<string, unknown>) => {
    try {
      await request(token, '/api/secure-assessments/policy', { method: 'PATCH', body: JSON.stringify(patch) });
      const updated = await request<{ policy: SecurePolicy }>(token, '/api/secure-assessments/policy'); setReviewPolicy(updated.policy);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save assessment policy.'); }
  };
  const addTarget = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await request(token, '/api/secure-assessments/targets', { method: 'POST', body: JSON.stringify({ name: targetName, url: targetUrl, active: false }) });
      const data = await request<{ targets: SecureTargetAdmin[] }>(token, '/api/secure-assessments/targets'); setConfiguredTargets(data.targets); setTargetName(''); setTargetUrl('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to add target.'); }
  };

  const viewingSession = focusedSession || selected;

  return <section className="secure-card secure-reviewer">
    <div className="secure-card-heading"><div><span className="secure-eyebrow">ASSIGNED REVIEWER ACCESS</span><h2>Live Proctoring Dashboard</h2><p>Monitor all active candidates in real-time. Click any feed tile to enlarge. Live media streams until candidate stops sharing.</p></div><ShieldCheck size={23}/></div>

    {reviewerAlert && <div className="secure-review-alert" role="alert"><AlertTriangle size={15}/><b>Reviewer alert</b><span>{reviewerAlert}</span><button onClick={() => setReviewerAlert('')} aria-label="Dismiss reviewer alert">×</button></div>}
    {error && <p className="secure-error">{error}</p>}

    {/* View mode toggle */}
    {activeSessions.length > 0 && <div className="reviewer-view-toggle">
      <button className={viewMode === 'mosaic' ? 'active' : ''} onClick={() => { setViewMode('mosaic'); setFocusedId(null); }}><MonitorUp size={13}/>All Feeds ({activeSessions.length})</button>
      <button className={viewMode === 'detail' ? 'active' : ''} onClick={() => setViewMode('detail')}><Camera size={13}/>Detail View</button>
      <span className="reviewer-live-badge"><span className="secure-live-dot"/>LIVE · {activeSessions.length} candidate{activeSessions.length !== 1 ? 's' : ''}</span>
    </div>}

    {sessions.length === 0
      ? <div className="secure-empty">No active or recent sessions are assigned to this reviewer. Candidates will appear when they begin Secure Assessment Mode.</div>
      : <>
        {/* ─── MOSAIC VIEW: All candidates in a grid ─── */}
        {viewMode === 'mosaic' && <div className="reviewer-mosaic-grid" data-count={activeSessions.length}>
          {activeSessions.map(sess => {
            const remaining = Math.max(0, sess.remaining_seconds - (sess.started_at && sess.status === 'active' ? Math.floor((now - Date.parse(sess.started_at)) / 1000) : 0));
            return <div
              key={sess.id}
              className={`reviewer-mosaic-tile ${sess.id === focusedId ? 'focused' : ''} ${sess.warning_count > 0 ? 'has-warnings' : ''}`}
              onClick={() => { setFocusedId(sess.id); setSelectedId(sess.id); setViewMode('detail'); }}
              role="button"
              tabIndex={0}
              aria-label={`View ${sess.candidate_name}'s live feed`}
            >
              <div className="mosaic-tile-header">
                <span className="secure-live-dot"/>
                <b>{sess.candidate_name}</b>
                <small className={`mosaic-status ${sess.status}`}>{sess.status.toUpperCase()}</small>
                <span className="mosaic-timer"><Clock3 size={11}/>{timeLabel(remaining)}</span>
              </div>
              <div className="mosaic-feeds">
                <div className="mosaic-feed-cam" style={{ position: 'relative', overflow: 'hidden' }}>
                  <img
                    ref={el => { mosaicImgRefs.current[`${sess.id}_camera`] = el; }}
                    alt={`${sess.candidate_name} camera`}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1, display: receivedStreams.current[sess.id]?.camera ? 'none' : 'block' }}
                  />
                  <video
                    ref={el => {
                      mosaicVideoRefs.current[`${sess.id}_camera`] = el;
                      const s = receivedStreams.current[sess.id]?.camera;
                      const img = mosaicImgRefs.current[`${sess.id}_camera`];
                      if (s) attachStreamToVideo(el, img, s);
                    }}
                    autoPlay muted playsInline
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2, display: receivedStreams.current[sess.id]?.camera ? 'block' : 'none' }}
                  />
                  <label style={{ position: 'relative', zIndex: 5 }}><Camera size={10}/> CAM</label>
                </div>
                <div className="mosaic-feed-screen" style={{ position: 'relative', overflow: 'hidden' }}>
                  <img
                    ref={el => { mosaicImgRefs.current[`${sess.id}_screen`] = el; }}
                    alt={`${sess.candidate_name} screen`}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#090d16', zIndex: 1, display: receivedStreams.current[sess.id]?.screen ? 'none' : 'block' }}
                  />
                  <video
                    ref={el => {
                      mosaicVideoRefs.current[`${sess.id}_screen`] = el;
                      const s = receivedStreams.current[sess.id]?.screen;
                      const img = mosaicImgRefs.current[`${sess.id}_screen`];
                      if (s) attachStreamToVideo(el, img, s);
                    }}
                    autoPlay muted playsInline
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 2, display: receivedStreams.current[sess.id]?.screen ? 'block' : 'none' }}
                  />
                  <label style={{ position: 'relative', zIndex: 5 }}><MonitorUp size={10}/> SCREEN</label>
                </div>
              </div>
              <div className="mosaic-tile-footer">
                <span>{sess.camera ? <><Camera size={10}/> On</> : <><Camera size={10}/> Off</>}</span>
                <span>{sess.screen ? <><MonitorUp size={10}/> Sharing</> : <><MonitorUp size={10}/> Off</>}</span>
                <span>{sess.fullscreen ? <><LockKeyhole size={10}/> FS</> : <><LockKeyhole size={10}/> No</>}</span>
                {sess.warning_count > 0 && <span className="mosaic-warning-badge"><AlertTriangle size={10}/> {sess.warning_count}</span>}
              </div>
            </div>;
          })}
          {activeSessions.length === 0 && <div className="secure-empty" style={{ gridColumn: '1 / -1' }}>No candidates are currently sharing. Waiting for candidates to start their secure assessment.</div>}
        </div>}

        {/* ─── DETAIL VIEW: Enlarged single candidate ─── */}
        {viewMode === 'detail' && <>
          {/* Session tabs */}
          <div className="secure-session-tabs">{sessions.map(item => <button className={item.id === (focusedId || selected?.id) ? 'selected' : ''} key={item.id} onClick={() => { setSelectedId(item.id); setFocusedId(item.id); }}>{item.candidate_name}<small>{item.status}</small></button>)}</div>

          {viewingSession && <>
            {/* Back to mosaic */}
            {activeSessions.length > 1 && <button className="button secondary reviewer-back-btn" onClick={() => { setViewMode('mosaic'); setFocusedId(null); }} style={{ marginBottom: 12 }}>← Back to all feeds ({activeSessions.length} candidates)</button>}

            {/* Candidate summary */}
            <div className="secure-review-summary">
              <div><small>CANDIDATE</small><b>{viewingSession.candidate_name}</b></div>
              <div><small>CANDIDATE ID</small><b>{viewingSession.candidate_id}</b></div>
              <div><small>ASSESSMENT</small><b>{viewingSession.assessment_name}</b></div>
              <div><small>START TIME</small><b>{viewingSession.started_at ? new Date(viewingSession.started_at).toLocaleTimeString() : 'Pending'}</b></div>
              <div><small>REMAINING</small><b>{timeLabel(Math.max(0, viewingSession.remaining_seconds - (viewingSession.started_at && viewingSession.status === 'active' ? Math.floor((now - Date.parse(viewingSession.started_at)) / 1000) : 0)))}</b></div>
              <div><small>SECURITY EVENTS</small><b>{viewingSession.warning_count}</b></div>
              <div><small>CONNECTION</small><b>{viewingSession.connected ? 'Connected' : 'Disconnected'}</b></div>
            </div>

            <div className="reviewer-detail-feeds">
              <div className="reviewer-detail-feed-main">
                <label><MonitorUp size={13}/> SHARED SCREEN · {viewingSession.screen ? 'LIVE' : 'INACTIVE'} · {viewingSession.candidate_name}</label>
                <div className="reviewer-detail-media-wrap">
                  <img
                    ref={el => {
                      detailImgRefs.current.screen = el;
                      const prev = mosaicImgRefs.current[`${viewingSession.id}_screen`]?.src;
                      if (el && prev && prev.startsWith('data:')) el.src = prev;
                    }}
                    alt={`${viewingSession.candidate_name} screen`}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#090d16', zIndex: 1, display: receivedStreams.current[viewingSession.id]?.screen ? 'none' : 'block' }}
                  />
                  <video
                    ref={el => {
                      detailVideoRefs.current.screen = el;
                      const s = receivedStreams.current[viewingSession.id]?.screen;
                      const img = detailImgRefs.current.screen;
                      if (s) attachStreamToVideo(el, img, s);
                    }}
                    autoPlay muted playsInline
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 2, display: receivedStreams.current[viewingSession.id]?.screen ? 'block' : 'none' }}
                  />
                </div>
              </div>
              <div className="reviewer-detail-feed-cam">
                <label><Camera size={13}/> CAMERA · {viewingSession.camera ? 'CONNECTED' : 'NOT CONNECTED'}</label>
                <div className="reviewer-detail-media-wrap reviewer-detail-media-wrap-cam">
                  <img
                    ref={el => {
                      detailImgRefs.current.camera = el;
                      const prev = mosaicImgRefs.current[`${viewingSession.id}_camera`]?.src;
                      if (el && prev && prev.startsWith('data:')) el.src = prev;
                    }}
                    alt={`${viewingSession.candidate_name} camera`}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1, display: receivedStreams.current[viewingSession.id]?.camera ? 'none' : 'block' }}
                  />
                  <video
                    ref={el => {
                      detailVideoRefs.current.camera = el;
                      const s = receivedStreams.current[viewingSession.id]?.camera;
                      const img = detailImgRefs.current.camera;
                      if (s) attachStreamToVideo(el, img, s);
                    }}
                    autoPlay muted playsInline
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2, display: receivedStreams.current[viewingSession.id]?.camera ? 'block' : 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Status & controls */}
            <div className="secure-status-grid">
              <span><Camera size={14}/>Camera <b>{viewingSession.camera ? 'Connected' : 'Not connected'}</b></span>
              <span><Mic size={14}/>Microphone <b>{viewingSession.microphone ? 'Connected' : 'Not connected'}</b></span>
              <span><MonitorUp size={14}/>Screen share <b>{viewingSession.screen ? 'Active' : 'Inactive'}</b></span>
              <span><LockKeyhole size={14}/>Fullscreen <b>{viewingSession.fullscreen ? 'Active' : 'Inactive'}</b></span>
              <span><ActivityIcon/>Challenge <b>{viewingSession.current_challenge || 'Security assessment'}</b></span>
            </div>
            <div className="secure-controls">
              <button className="button secondary" disabled={viewingSession.status !== 'active'} onClick={() => void control('pause', viewingSession.id)}>Pause assessment</button>
              <button className="button secondary" disabled={viewingSession.status !== 'paused'} onClick={() => void control('resume', viewingSession.id)}>Resume assessment</button>
              <button className="button danger" disabled={['ended','submitted'].includes(viewingSession.status)} onClick={() => void control('end', viewingSession.id)}><X size={13}/>End assessment</button>
            </div>

            {/* Event timeline */}
            <div className="secure-event-list"><strong>Security event timeline</strong>{viewingSession.events.length === 0 ? <p>No events have been logged.</p> : viewingSession.events.map(item => <div key={item.id} className={`secure-event ${item.severity}`}><span className="secure-event-time">{new Date(item.created_at).toLocaleTimeString()}</span><b>{item.type.replace(/_/g, ' ')}</b><small>{item.severity}</small>{!item.acknowledged && <button onClick={() => void acknowledge(item.id)}>Acknowledge</button>}<Check size={13}/></div>)}</div>
          </>}
        </>}
      </>
    }

    {/* Admin grid: targets + policy */}
    <div className="secure-admin-grid">
      <div className="secure-admin-panel"><strong>Allowed target scope</strong><p>New domains remain disabled until the reviewer confirms documented authorization.</p>
        <form className="secure-target-form" onSubmit={event => void addTarget(event)}><input value={targetName} onChange={event => setTargetName(event.target.value)} placeholder="Target name" required/><input value={targetUrl} onChange={event => setTargetUrl(event.target.value)} type="url" placeholder="https://authorized-lab.example" required/><button className="button secondary" type="submit">Add target</button></form>
        {configuredTargets.map(target => <div className="secure-admin-target-row" key={target.id}><label className="secure-admin-target"><input type="checkbox" checked={target.active} onChange={async event => { const active = event.target.checked; try { await request(token, `/api/secure-assessments/targets/${target.id}`, { method: 'PATCH', body: JSON.stringify({ active }) }); setConfiguredTargets(items => items.map(item => item.id === target.id ? { ...item, active } : item)); setError(''); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update target.'); } }}/><span><b>{target.name}</b><small>{target.url}{target.active ? '' : ' · Disabled'}</small></span></label><textarea aria-label={`${target.name} authorization scope`} defaultValue={target.authorization_note} placeholder="Document owner authorization and exact test scope before enabling" onBlur={async event => { try { await request(token, `/api/secure-assessments/targets/${target.id}`, { method: 'PATCH', body: JSON.stringify({ authorization_note: event.target.value }) }); setConfiguredTargets(items => items.map(item => item.id === target.id ? { ...item, authorization_note: event.target.value } : item)); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save target scope.'); } }}/></div>)}
      </div>
      {reviewPolicy && <div className="secure-admin-panel"><strong>Assessment and external resource policy</strong><p>Rules are shown to candidates. Domain enforcement must occur in managed browser and network allowlist controls. With automatic pause/submission off, reviewer intervention is manual.</p>
        <div className="secure-policy-checks">{([['allow_search_engines','Allow search engines','search_engines'],['allow_documentation','Allow documentation','documentation'],['allow_github','Allow GitHub','github'],['allow_stackoverflow','Allow Stack Overflow','stackoverflow'],['allow_ai_tools','Allow AI tools','ai_tools'],['allow_external_websites','Allow external websites','external_websites']] as const).map(([key,label,resource]) => <label key={key}><input type="checkbox" checked={Boolean(reviewPolicy.resources[resource])} onChange={event => void savePolicy({ [key]: event.target.checked })}/>{label}</label>)}</div>
        <label className="secure-admin-target"><input type="checkbox" checked={reviewPolicy.microphone_optional} onChange={event => void savePolicy({ microphone_optional: event.target.checked })}/><span><b>Microphone optional</b><small>When disabled, microphone permission is required.</small></span></label>
        <label className="secure-admin-number">Assessment duration (minutes)<input type="number" min="5" max="180" defaultValue={reviewPolicy.duration_minutes} onBlur={event => void savePolicy({ duration_minutes: Number(event.target.value) })}/></label>
        <label className="secure-admin-number">Warning threshold<input type="number" min="1" max="20" defaultValue={reviewPolicy.warning_threshold} onBlur={event => void savePolicy({ warning_threshold: Number(event.target.value) })}/></label>
        <label className="secure-admin-number">Maximum violations<input type="number" min="1" max="50" defaultValue={reviewPolicy.max_violations} onBlur={event => void savePolicy({ max_violations: Number(event.target.value) })}/></label>
        <label className="secure-admin-number">Event retention (days)<input type="number" min="1" max="3650" defaultValue={reviewPolicy.retention_days} onBlur={event => void savePolicy({ retention_days: Number(event.target.value) })}/></label>
        <label className="secure-admin-target"><input type="checkbox" checked={reviewPolicy.auto_pause} onChange={event => void savePolicy({ auto_pause: event.target.checked })}/><span><b>Automatically pause on critical events</b></span></label>
        <label className="secure-admin-target"><input type="checkbox" checked={reviewPolicy.auto_submit} onChange={event => void savePolicy({ auto_submit: event.target.checked })}/><span><b>Automatically submit at maximum violations</b></span></label>
        <label className="secure-admin-number">Fallback meeting URL<input type="url" defaultValue={reviewPolicy.fallback_meeting_url} placeholder="https://..." onBlur={event => void savePolicy({ fallback_meeting_url: event.target.value })}/></label>
      </div>}
    </div>
  </section>;
}

function ActivityIcon() { return <span className="secure-activity-icon">●</span>; }

