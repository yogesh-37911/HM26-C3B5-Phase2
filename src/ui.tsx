import { useState, useEffect, useRef, type FormEvent } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  Download,
  Edit2,
  Eye,
  EyeOff,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  Fingerprint,
  FlaskConical,
  Globe2,
  Layers,
  ListChecks,
  LockKeyhole,
  LogOut,
  MapPin,
  Maximize2,
  Menu,
  Minimize2,
  MoreHorizontal,
  Play,
  Plus,
  PlusCircle,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  Trash2,
  Trophy,
  Upload,
  UploadCloud,
  FolderOpen,
  RefreshCw,
  Video,
  Waypoints,
  X,
} from 'lucide-react';
import { TOPIC_DETAILS } from './handbookData';
import {
  ALL_ASSESSMENT_QUESTIONS,
  ASSESSMENT_SECTIONS,
  AssessmentQuestion,
} from './assessmentQuestions';
import { TOOLBOX_CATEGORIES, TOOLBOX_TOOLS } from './toolboxData';
import SecureAssessment from './SecureAssessment';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type Role = 'Candidate' | 'Reviewer' | 'Recruiter';
type AuthSession = { token: string; role: Role; name: string; email: string };
type AssessmentResultSummary = { section: string; percent: number; correct: number; total: number };
type CandidateProgressSummary = {
  overall_capability: number; proof_confidence: number; total_submitted: number;
  verified_findings: number; finding_accuracy: number; assessments: AssessmentResultSummary[];
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const CANDIDATE_ACCOUNTS = [
  { name: 'Ananya Rao', email: 'ananya.demo@example.invalid' },
  { name: 'Rohan Mehta', email: 'rohan.demo@example.invalid' },
  { name: 'Maya Iyer', email: 'maya.demo@example.invalid' },
];
const DEMO_ACCOUNTS: { role: Role; name: string; email: string }[] = [
  { role: 'Candidate', name: CANDIDATE_ACCOUNTS[0].name, email: CANDIDATE_ACCOUNTS[0].email },
  { role: 'Reviewer', name: 'Samira Khan', email: 'samira.demo@example.invalid' },
  { role: 'Recruiter', name: 'Jordan Davis', email: 'jordan.demo@example.invalid' },
];

const assessmentProgressKey = (email: string, field: string) => `proofforge.assessment.${email.toLowerCase()}.${field}`;
function saveAssessmentProgress(email: string | undefined, field: string, value: string) {
  if (!email) return;
  try { localStorage.setItem(assessmentProgressKey(email, field), value); } catch {}
}

function LoginScreen({ onAuthenticated }: { onAuthenticated: (session: AuthSession) => void }) {
  const [selectedRole, setSelectedRole] = useState<Role>('Candidate');
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const chooseRole = (account: typeof DEMO_ACCOUNTS[number]) => {
    setSelectedRole(account.role);
    setEmail(account.email);
    setError('');
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(response.status === 401 ? 'Email or password is incorrect.' : (data.error || 'Unable to sign in. Please try again.'));
      const roleMap: Record<string, Role> = { candidate: 'Candidate', reviewer: 'Reviewer', recruiter: 'Recruiter' };
      const role = roleMap[data.role];
      if (!data.access_token || !role) throw new Error('This account does not have an enabled workspace.');
      if (role !== selectedRole) throw new Error(`This account belongs to the ${role} workspace. Select it above and try again.`);
      const session = { token: data.access_token, role, name: data.name, email: email.trim().toLowerCase() };
      sessionStorage.setItem('proofforge.session', JSON.stringify(session));
      onAuthenticated(session);
    } catch (reason) {
      setError(reason instanceof TypeError ? 'Cannot reach the sign-in service. Check your connection and try again.' : reason instanceof Error ? reason.message : 'Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', margin: '0 0 24px 0' }}>
          <img
            src="/logo.webp"
            alt="FREQUENCY"
            className="company-logo"
            style={{ height: 280, width: 'auto', maxHeight: 320, maxWidth: '100%', objectFit: 'contain', borderRadius: 8, display: 'block', margin: '0 auto' }}
            onError={(e) => {
              e.currentTarget.src = "https://www.dropbox.com/scl/fi/hr34fbqd0nrkdz2l1d4s4/logo-yAs4SU6K.webp?rlkey=egie2afj08uknrfhn1lk1kypf&st=oyp6qki1&raw=1";
            }}
          />
        </div>
        <div className="login-brand-copy"><span className="eyebrow">A CLEARER WAY TO SHOW YOUR WORK</span><h1>Skills you can<br />stand behind.</h1><p>Practice, evidence, and human review come together in one professional workspace.</p></div>
        <div className="login-trust"><ShieldCheck size={17} /><span><b>Built around verified proof</b><small>Role-based access · Secure sessions · Authorized labs</small></span></div>
        <span className="login-brand-foot">FREQUENCY · PROFESSIONAL WORKSPACE</span>
      </section>
      <section className="login-form-side">
        <form className="login-card" onSubmit={submit}>
          <div className="login-kicker">WELCOME BACK</div><h2>Sign in to your workspace</h2><p className="login-intro">Choose your workspace and enter your account credentials.</p>
          <div className="login-role-options" role="group" aria-label="Choose a workspace">
            {DEMO_ACCOUNTS.map(account => (
              <button
                key={account.role}
                type="button"
                className={`login-role-option${selectedRole === account.role ? ' selected' : ''}`}
                onClick={() => chooseRole(account)}
                aria-pressed={selectedRole === account.role}
              >
                <span>{account.role}</span>
              </button>
            ))}
          </div>
          <label className="login-field"><span>Email address</span><input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" /></label>
          <label className="login-field"><span>Password</span><span className="login-password-wrap"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required minLength={12} value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" /><button type="button" className="login-password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
          {error && <div className="login-error" role="alert"><AlertTriangle size={15} />{error}</div>}
          <button className="button primary login-submit" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} {!busy && <ArrowRight size={15} />}</button>
          <div className="login-security"><LockKeyhole size={14} /><span>Protected with encrypted password verification and a short-lived secure session.</span></div>
        </form>
        <p className="login-demo-note">DEMO WORKSPACE · Use the password provisioned by your administrator.</p>
      </section>
    </main>
  );
}

interface Lab {
  n: string;
  tag: string;
  level: string;
  time: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  done: boolean;
}

const labs: Lab[] = [
  { n: 'Broken Authentication', tag: 'WEB SECURITY', level: 'Intermediate', time: '35 min', desc: 'Test session handling and account controls in a purpose-built training app.', icon: LockKeyhole, color: 'coral', done: false },
  { n: 'API Authorization', tag: 'API SECURITY', level: 'Advanced', time: '50 min', desc: 'Trace object-level authorization boundaries across a mock API.', icon: Globe2, color: 'violet', done: false },
  { n: 'Network Enumeration', tag: 'NETWORK SECURITY', level: 'Beginner', time: '25 min', desc: 'Map services on an isolated, preconfigured training network.', icon: Waypoints, color: 'blue', done: false },
  { n: 'Reflected Cross-Site Scripting', tag: 'WEB SECURITY', level: 'Intermediate', time: '40 min', desc: 'Identify and validate unsafe output handling in a local target.', icon: ShieldAlert, color: 'amber', done: false },
  { n: 'SQL Injection', tag: 'VULNERABILITY ASSESSMENT', level: 'Advanced', time: '45 min', desc: 'Investigate parameter handling and propose a defensible fix.', icon: Terminal, color: 'green', done: false },
  { n: 'Broken Access Control', tag: 'WEB SECURITY', level: 'Intermediate', time: '35 min', desc: 'Explore server-side object access checks in a contained lab.', icon: Shield, color: 'coral', done: false },
];

const externalPracticeTargets = [
  {
    name: 'Google Gruyere',
    provider: 'Google security codelab',
    url: 'https://google-gruyere.appspot.com/',
    focus: 'Guided web application security exercises',
    guidance: 'Only test the Gruyere application as directed by its codelab. Do not test other Google services.',
  },
  {
    name: 'Acunetix Test ASP.NET',
    provider: 'Acunetix intentionally vulnerable demo',
    url: 'http://testaspnet.vulnweb.com/',
    focus: 'ASP.NET security testing practice',
    guidance: 'Use this published demo site only. Keep requests low impact and avoid destructive or high-volume testing.',
  },
];

interface Person {
  name: string;
  role: string;
  score: number;
  confidence: number;
  findings: number;
  skills: string[];
  tools: string[];
  initials: string;
  tone: string;
  accuracy: number;
  labsVerified: number;
  defense: number;
  report: number;
  dna: Record<string, number>;
}

const SECURITY_DOMAINS = ['Web Security', 'API Security', 'Network Security', 'Reconnaissance', 'Linux Security', 'Vulnerability Assessment', 'Penetration Testing', 'Security Reporting', 'Incident Response / Blue Team'];
const SEEDED_PEOPLE: Person[] = [
  { name: 'Rohan Mehta', role: 'Penetration Tester', score: 89, confidence: 91, findings: 14, skills: ['Network Security', 'Linux Security'], tools: ['Nmap', 'Wireshark'], initials: 'RM', tone: 'blue', accuracy: 86, labsVerified: 5, defense: 87, report: 84, dna: { 'Web Security': 75, 'API Security': 71, 'Network Security': 93, Reconnaissance: 92, 'Linux Security': 88, 'Vulnerability Assessment': 86, 'Penetration Testing': 91, 'Security Reporting': 84, 'Incident Response / Blue Team': 77 } },
  { name: 'Devon Miles', role: 'Cloud & API Security Auditor', score: 92, confidence: 95, findings: 16, skills: ['API Security', 'Vulnerability Assessment'], tools: ['Postman', 'Burp Suite', 'FFUF'], initials: 'DM', tone: 'cream', accuracy: 91, labsVerified: 6, defense: 93, report: 95, dna: { 'Web Security': 89, 'API Security': 96, 'Network Security': 76, Reconnaissance: 84, 'Linux Security': 82, 'Vulnerability Assessment': 94, 'Penetration Testing': 85, 'Security Reporting': 95, 'Incident Response / Blue Team': 79 } },
  { name: 'Priya Sharma', role: 'Vulnerability Researcher', score: 91, confidence: 93, findings: 17, skills: ['Web Security', 'Penetration Testing'], tools: ['Burp Suite', 'SQLMap', 'Nuclei'], initials: 'PS', tone: 'lavender', accuracy: 89, labsVerified: 6, defense: 90, report: 92, dna: { 'Web Security': 95, 'API Security': 88, 'Network Security': 79, Reconnaissance: 91, 'Linux Security': 85, 'Vulnerability Assessment': 93, 'Penetration Testing': 94, 'Security Reporting': 90, 'Incident Response / Blue Team': 74 } },
  { name: 'Maya Iyer', role: 'Security Analyst & SOC', score: 86, confidence: 94, findings: 12, skills: ['Incident Response / Blue Team', 'Network Security'], tools: ['Wireshark', 'Nmap'], initials: 'MI', tone: 'lilac', accuracy: 92, labsVerified: 4, defense: 89, report: 91, dna: { 'Web Security': 69, 'API Security': 66, 'Network Security': 87, Reconnaissance: 78, 'Linux Security': 75, 'Vulnerability Assessment': 83, 'Penetration Testing': 72, 'Security Reporting': 91, 'Incident Response / Blue Team': 95 } },
  { name: 'Karan Shah', role: 'SecOps & Threat Hunter', score: 88, confidence: 92, findings: 15, skills: ['Reconnaissance', 'Network Security'], tools: ['Nmap', 'Sublist3r', 'Metasploit'], initials: 'KS', tone: 'mint', accuracy: 88, labsVerified: 5, defense: 86, report: 89, dna: { 'Web Security': 78, 'API Security': 80, 'Network Security': 91, Reconnaissance: 95, 'Linux Security': 84, 'Vulnerability Assessment': 88, 'Penetration Testing': 87, 'Security Reporting': 86, 'Incident Response / Blue Team': 83 } },
  { name: 'Vikram Malhotra', role: 'DevSecOps & Linux Hardening', score: 87, confidence: 90, findings: 13, skills: ['Linux Security', 'Vulnerability Assessment'], tools: ['Docker', 'Nmap', 'Lynis'], initials: 'VM', tone: 'blue', accuracy: 87, labsVerified: 4, defense: 85, report: 88, dna: { 'Web Security': 72, 'API Security': 75, 'Network Security': 84, Reconnaissance: 80, 'Linux Security': 96, 'Vulnerability Assessment': 89, 'Penetration Testing': 80, 'Security Reporting': 87, 'Incident Response / Blue Team': 86 } },
];

const topics: [string, string][] = [
  ['Networking', 'TCP/IP layers, routing, ports and service discovery.'],
  ['HTTP & HTTPS', 'Requests, responses, headers, cookies and TLS.'],
  ['Authentication', 'Proving identity with credentials, tokens and sessions.'],
  ['Authorization', 'Enforcing what an authenticated user can access.'],
  ['OWASP Top 10', 'A practical taxonomy of common application security risks.'],
  ['Security Reporting', 'Evidence-led findings, impact, reproduction and remediation.'],
];

// Map of nav icons per role to avoid wrapping via modulo
const NAV_ICONS: React.ElementType[] = [
  Activity,
  FlaskConical,
  BookOpen,
  Terminal,
  CircleHelp,
  FileCheck2,
  FileText,
  ShieldCheck,
  BriefcaseBusiness,
];

export type CandidateDocItem = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  title: string;
  lab: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  category: string;
  component: string;
  description: string;
  evidence: string;
  reproduction: string;
  impact: string;
  recommendation: string;
  fileName?: string;
  fileSize?: string;
  fileType?: 'pdf' | 'docx' | 'doc';
  fileData?: string;
  status: 'pending' | 'verified' | 'needs_changes' | 'rejected';
  score?: number;
  submittedAt: string;
  reviewerFeedback?: string;
  reviewedBy?: string;
};

const PAGE_ICON_MAP: Record<string, React.ElementType> = {
  'Overview': Activity,
  'Security Labs': FlaskConical,
  'Labs': FlaskConical,
  'Handbook': BookOpen,
  'Toolbox': Terminal,
  'Assessments': CircleHelp,
  'Secure Assessments': Video,
  'Findings': FileCheck2,
  'Reports': FileText,
  'Uploaded Documents': FileText,
  'Reviews': ShieldCheck,
  'Question Bank': CircleHelp,
  'Flagged Findings': ShieldAlert,
  'Rankings': Trophy,
  'Proof Profile': ShieldCheck,
  'Interviews': BriefcaseBusiness,
  'Find Security Talent': Search,
  'Security Profiles': ShieldCheck,
  'Saved Candidates': BookmarkCheck,
};

function downloadDocumentFile(fileName: string, fileData: string) {
  if (!fileData) return;
  const link = document.createElement('a');
  link.href = fileData;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const INITIAL_INTERVIEWS: {
  id: string;
  candidate: string;
  company: string;
  role: string;
  type: string;
  mode: 'online' | 'offline';
  venue?: string;
  date: string;
  time: string;
  message: string;
  zoomUrl?: string;
  status: 'CONFIRMED' | 'PENDING' | 'DECLINED';
}[] = [];

// ---------------------------------------------------------------------------
// Main App Component
// ---------------------------------------------------------------------------

export default function App() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [candidateProgress, setCandidateProgress] = useState<CandidateProgressSummary | null>(null);
  const [serverAssessmentResults, setServerAssessmentResults] = useState<AssessmentResultSummary[]>([]);
  const [assessmentSyncStatus, setAssessmentSyncStatus] = useState<'none' | 'verified' | 'local'>('none');
  const [assessmentSaving, setAssessmentSaving] = useState(false);
  const [role, setRole] = useState<Role>('Candidate');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'confidence'>('score');
  const [page, setPage] = useState('Overview');
  const [modal, setModal] = useState('');
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [lab, setLab] = useState('');
  const [verified, setVerified] = useState(false);

  // Candidate Findings & Uploaded Pentest Reports (starts with 0 - completely clean slate)
  const [candidateReports, setCandidateReports] = useState<CandidateDocItem[]>([]);
  const [findingForm, setFindingForm] = useState({
    title: 'Broken Access Control (BOLA)',
    severity: 'High' as 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational',
    lab: 'API Authorization Lab',
    component: 'GET /api/v1/users/{id}/profile',
    description: 'Observed authorization bypass where user ID manipulation grants unauthorized access to cross-account records.',
    evidence: 'GET /api/v1/users/42 HTTP/1.1\nHost: target-app.lab:8080\nAuthorization: Bearer [REDACTED]\n\nHTTP/1.1 200 OK\n{"id":42,"email":"victim@target.internal","role":"admin"}',
    reproduction: '1. Authenticate with standard user credentials.\n2. Send request to /api/v1/users/42.\n3. Server returns full account data without checking ownership.',
    impact: 'Unauthenticated/unauthorized users can exfiltrate sensitive profile data across accounts.',
    recommendation: 'Implement server-side user ID claim validation against the active JWT session subject.',
    fileName: '',
    fileSize: '',
    fileType: 'pdf' as 'pdf' | 'docx' | 'doc',
    fileData: '',
  });

  // Reviewer Candidate Documents Queue (pre-seeded with non-Ananya candidates so reviewer has context, but 0 for Ananya)
  const [reviewerDocuments, setReviewerDocuments] = useState<CandidateDocItem[]>([]);

  // Reviewer Document Review Modal State
  const [reviewingDoc, setReviewingDoc] = useState<CandidateDocItem | null>(null);
  const [docReviewScore, setDocReviewScore] = useState<number>(88);
  const [docReviewDecision, setDocReviewDecision] = useState<'verified' | 'needs_changes' | 'rejected'>('verified');
  const [docReviewFeedback, setDocReviewFeedback] = useState<string>(
    'Comprehensive methodology, clear reproduction steps, and sound remediation guidance.'
  );

  // Dedicated State for Report Upload (Word / PDF) in Reports Section
  const [reportForm, setReportForm] = useState({
    title: '',
    notes: '',
    fileName: '',
    fileSize: '',
    fileType: 'pdf' as 'pdf' | 'doc' | 'docx',
    fileData: '',
  });
  const [reportDragOver, setReportDragOver] = useState(false);
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const reportDragCounter = useRef(0);
  const reportFileInputRef = useRef<HTMLInputElement>(null);

  const handleReportFileSelect = (file: File) => {
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext !== 'pdf' && ext !== 'doc' && ext !== 'docx') {
      notify('Invalid file format. Please upload a PDF (.pdf) or Word document (.doc, .docx)');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      notify('File exceeds the 25 MB upload limit.');
      return;
    }

    const sizeKb = Math.round(file.size / 1024);
    const sizeFormatted = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const autoTitle = cleanName.charAt(0).toUpperCase() + cleanName.slice(1) + ' Report';
      setReportForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: sizeFormatted,
        fileType: ext === 'docx' ? 'docx' : ext === 'doc' ? 'doc' : 'pdf',
        fileData: dataUrl,
        title: prev.title.trim() ? prev.title : autoTitle,
      }));
      notify(`Report document loaded: ${file.name} (${sizeFormatted})`);
    };
    reader.onerror = () => {
      notify('Error reading file from disk. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const onReportDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    reportDragCounter.current += 1;
    setReportDragOver(true);
  };

  const onReportDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!reportDragOver) setReportDragOver(true);
  };

  const onReportDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    reportDragCounter.current -= 1;
    if (reportDragCounter.current <= 0) {
      reportDragCounter.current = 0;
      setReportDragOver(false);
    }
  };

  const onReportDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    reportDragCounter.current = 0;
    setReportDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleReportFileSelect(droppedFile);
    }
  };

  const handleUploadCandidateReport = async () => {
    if (!reportForm.fileName || !reportForm.fileData) {
      notify('Please select or drop a PDF or Word report to upload.');
      return;
    }

    setIsUploadingReport(true);
    const title = reportForm.title.trim() || reportForm.fileName;
    const docId = `DOC-${Math.floor(100 + Math.random() * 900)}`;

    const newReport: CandidateDocItem = {
      id: docId,
      candidateName: auth?.name || 'Ananya Rao',
      candidateEmail: auth?.email || 'ananya.demo@example.invalid',
      title: title,
      lab: 'Security & Pentest Assessment',
      severity: 'Medium',
      category: 'Assessment Report',
      component: 'Full Scope Pentest Report',
      description: reportForm.notes.trim() || `Candidate uploaded report: ${reportForm.fileName}`,
      evidence: `Attached document: ${reportForm.fileName} (${reportForm.fileSize})`,
      reproduction: 'Full testing methodology and proofs documented in the attached report file.',
      impact: 'Security assessment findings and remediation roadmap.',
      recommendation: 'See attached report document for comprehensive remediation guidance.',
      fileName: reportForm.fileName,
      fileSize: reportForm.fileSize,
      fileType: reportForm.fileType,
      fileData: reportForm.fileData,
      status: 'pending',
      submittedAt: 'Just now',
    };

    setCandidateReports((prev) => [newReport, ...prev]);
    setReviewerDocuments((prev) => [newReport, ...prev]);

    if (auth?.token) {
      try {
        await fetch(`${API_BASE}/api/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
          body: JSON.stringify({
            title: newReport.title,
            lab: newReport.lab,
            severity: newReport.severity,
            doc_type: newReport.fileType,
            file_name: newReport.fileName,
            file_data: newReport.fileData,
            description: newReport.description,
          }),
        });
      } catch (err) {
        console.warn('Document server sync:', err);
      }
    }

    setReportForm({
      title: '',
      notes: '',
      fileName: '',
      fileSize: '',
      fileType: 'pdf',
      fileData: '',
    });
    setIsUploadingReport(false);
    notify(`Report "${title}" uploaded! Sent to Reviewer Panel.`);
  };

  const handleCandidateSubmitFinding = async () => {
    const docId = `FIND-${Math.floor(100 + Math.random() * 900)}`;
    const newDoc: CandidateDocItem = {
      id: docId,
      candidateName: auth?.name || 'Ananya Rao',
      candidateEmail: auth?.email || 'ananya.demo@example.invalid',
      title: findingForm.title.trim() || 'Security Assessment Finding',
      lab: findingForm.lab,
      severity: findingForm.severity,
      category: 'Web Security',
      component: findingForm.component || 'Application Endpoint',
      description: findingForm.description,
      evidence: findingForm.evidence,
      reproduction: findingForm.reproduction,
      impact: findingForm.impact,
      recommendation: findingForm.recommendation,
      fileName: undefined,
      fileSize: undefined,
      fileType: undefined,
      fileData: undefined,
      status: 'pending',
      submittedAt: 'Just now',
    };

    setCandidateReports((prev) => [newDoc, ...prev]);
    setReviewerDocuments((prev) => [newDoc, ...prev]);
    setModal('');
    notify(`Lab finding "${newDoc.title}" recorded! Sent to Reviewer Panel.`);

    if (auth?.token) {
      try {
        await fetch(`${API_BASE}/api/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
          body: JSON.stringify({
            title: newDoc.title,
            lab: newDoc.lab,
            severity: newDoc.severity,
            doc_type: 'pdf',
            description: newDoc.description,
          }),
        });
      } catch {}
    }
  };

  const handleReviewerSubmitDocReview = async () => {
    if (!reviewingDoc) return;
    const updatedStatus = docReviewDecision;

    setReviewerDocuments((prev) =>
      prev.map((d) =>
        d.id === reviewingDoc.id
          ? {
              ...d,
              status: updatedStatus,
              score: docReviewScore,
              reviewerFeedback: docReviewFeedback,
              reviewedBy: auth?.name || 'Samira Khan',
            }
          : d
      )
    );

    setCandidateReports((prev) =>
      prev.map((d) =>
        d.id === reviewingDoc.id || d.title === reviewingDoc.title
          ? {
              ...d,
              status: updatedStatus,
              score: docReviewScore,
              reviewerFeedback: docReviewFeedback,
              reviewedBy: auth?.name || 'Samira Khan',
            }
          : d
      )
    );

    if (updatedStatus === 'verified') {
      setVerified(true);
      void updateCandidateApproval(reviewingDoc.candidateName, true);
    }

    if (auth?.token && reviewingDoc.id && !isNaN(Number(reviewingDoc.id))) {
      try {
        await fetch(`${API_BASE}/api/documents/${reviewingDoc.id}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
          body: JSON.stringify({
            score: docReviewScore,
            decision: updatedStatus,
            feedback: docReviewFeedback,
          }),
        });
      } catch {}
    }

    setModal('');
    notify(`Document evaluation saved (${docReviewScore}/100) — status: ${updatedStatus.toUpperCase()}`);
  };
  const [minCapability, setMinCapability] = useState(80);
  const [minConfidence, setMinConfidence] = useState(80);
  const [minAccuracy, setMinAccuracy] = useState(85);
  const [requiredSkill, setRequiredSkill] = useState('Web Security');
  const [minSkill, setMinSkill] = useState(80);
  const [defenseAsked, setDefenseAsked] = useState(false);
  const [defenseAnswers, setDefenseAnswers] = useState(['', '', '', '', '']);
  const [defenseSent, setDefenseSent] = useState(false);
  const [defenseEvaluated, setDefenseEvaluated] = useState(false);
  const [defenseScore, setDefenseScore] = useState(89);
  const [topicTab, setTopicTab] = useState<'concepts' | 'syntaxes' | 'attacks' | 'takeaways'>('concepts');
  const [copiedCmd, setCopiedCmd] = useState<string>('');
  const [modalSize, setModalSize] = useState<'standard' | 'wide' | 'fullscreen'>('wide');
  const [toolboxCategory, setToolboxCategory] = useState<string>('All');
  const [toolboxSearch, setToolboxSearch] = useState<string>('');

  // Reviewer Lab Container Inspector State
  const [inspectTab, setInspectTab] = useState<'traffic' | 'system' | 'logs' | 'inject'>('traffic');
  const [inspectFilter, setInspectFilter] = useState<'ALL' | 'GET' | 'POST' | 'AUTH' | 'EXPLOIT'>('ALL');
  const [injectPayload, setInjectPayload] = useState<string>('GET /api/v1/users/42/tokens HTTP/1.1\nHost: target-app.lab:8080\nAuthorization: Bearer mock_token_ananya');
  const [selectedReqIndex, setSelectedReqIndex] = useState<number>(0);
  const [extraTelemetryLogs, setExtraTelemetryLogs] = useState<
    { id: string; time: string; method: 'GET' | 'POST' | 'PUT' | 'DELETE'; path: string; status: number; latency: string; srcIp: string; type: 'HTTP' | 'AUTH' | 'EXPLOIT'; details: string; reqHeaders: string; respBody: string }[]
  >([]);

  // Reviewer Question Bank & Section States
  const [qbQuestions, setQbQuestions] = useState<AssessmentQuestion[]>(ALL_ASSESSMENT_QUESTIONS);
  const [qbSectionFilter, setQbSectionFilter] = useState<string>('All');
  const [qbSearch, setQbSearch] = useState<string>('');
  const [editingQuestion, setEditingQuestion] = useState<AssessmentQuestion | null>(null);
  const [qbForm, setQbForm] = useState<{
    section: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>({
    section: 'Aptitude',
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
  });

  // Reviewer Rubric Scoring State (7 Individual Sections)
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({
    'Reconnaissance': 9,
    'Vulnerability finding': 23,
    'Validation': 18,
    'Evidence': 14,
    'Impact analysis': 9,
    'Remediation': 9,
    'Report quality': 9,
  });

  // Reviewer Assessment Auto-Score Finalization
  const [assessmentFinalized, setAssessmentFinalized] = useState(false);
  const [assessmentReviewBonus, setAssessmentReviewBonus] = useState(0);
  const [assessmentReviewNotes, setAssessmentReviewNotes] = useState(
    'Automated response grading verified. Strong conceptual clarity in network protocols and pentesting methodology.'
  );

  // Reviewer Flagged Submissions & Labs Management
  const [flaggedFindings, setFlaggedFindings] = useState<
    { id: string; candidate: string; finding: string; lab: string; reason: string; status: string }[]
  >([]);

  const [activeReviewerLabs, setActiveReviewerLabs] = useState<
    { name: string; tag: string; activeInstances: number; status: 'HEALTHY' | 'DEGRADED'; cpu: string; memory: string; difficulty: string }[]
  >([]);

  // Reviewer Candidate Validation & Endorsement to Recruiter (Clean slate for Ananya Rao)
  const [passedCandidates, setPassedCandidates] = useState<string[]>([]);
  const [recruiterCandidates, setRecruiterCandidates] = useState<Person[]>([]);

  // Recruiter & Candidate Synchronized Scheduled Interviews State (Clean slate for Ananya Rao)
  const [savedCandidates, setSavedCandidates] = useState<string[]>([]);
  const [interviews, setInterviews] = useState<typeof INITIAL_INTERVIEWS>([]);

  const [inviteCandidate, setInviteCandidate] = useState<string>('');
  const [inviteForm, setInviteForm] = useState({
    role: 'Application Security Engineer',
    mode: 'online' as 'online' | 'offline',
    type: 'Technical Defense Deep Dive (Zoom)',
    venue: 'FREQUENCY HQ, Tower B, Level 4, Tech Park, Indiranagar, Bengaluru - 560038',
    room: 'Security War Room 4B · Hardware Token & Lab Station',
    date: '2026-10-02',
    time: '14:00 IST',
    message: 'We reviewed your verified lab findings and would love to hear how you approached validation and remediation.',
  });

  const resetDemoState = async () => {
    if (auth?.role !== 'Recruiter' || !auth.token) {
      notify('Only a signed-in recruiter can reset candidate data.');
      return;
    }
    const confirmed = window.confirm(
      'Reset all candidate assessment answers and scores, findings and reports, reviewer decisions, secure assessment sessions and events, recruiter approvals, and interview records? This cannot be undone. Login accounts will remain so candidates and staff can sign in again.'
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE}/api/demo/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Reset failed.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Reset failed. Candidate data was not cleared.');
      return;
    }

    // 2. Clear all localStorage persistence (timers, assessment progress, responses)
    try {
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith('proofforge.') ||
          key.includes('assessment') ||
          key.includes('answers') ||
          key.includes('timeLeft') ||
          key.includes('startedAt') ||
          key.includes('submitted') ||
          key.includes('qIndex')
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (err) {
      console.warn('LocalStorage clear error:', err);
    }

    // 3. Complete CANDIDATE State Reset (Fresh start from Question #1 with 0 findings/reports)
    setAssessmentSubmitted(false);
    setSelectedAnswers({});
    setCurrentQIndex(0);
    setAssessmentTimeLeft(1200);
    setAssessmentSyncStatus('none');
    setCandidateProgress(null);
    setServerAssessmentResults([]);
    setAssessmentFinalized(false);
    setCandidateReports([]);
    setVerified(false);
    setDefenseAsked(false);
    setDefenseAnswers(['', '', '', '', '']);
    setDefenseSent(false);
    setDefenseEvaluated(false);
    setDefenseScore(89);
    setFindingForm({
      title: 'Broken Access Control (BOLA)',
      severity: 'High',
      lab: 'API Authorization Lab',
      component: 'GET /api/v1/users/{id}/profile',
      description: 'Observed authorization bypass where user ID manipulation grants unauthorized access to cross-account records.',
      evidence: 'GET /api/v1/users/42 HTTP/1.1\nHost: target-app.lab:8080\nAuthorization: Bearer [REDACTED]\n\nHTTP/1.1 200 OK\n{"id":42,"email":"victim@target.internal","role":"admin"}',
      reproduction: '1. Authenticate with standard user credentials.\n2. Send request to /api/v1/users/42.\n3. Server returns full account data without checking ownership.',
      impact: 'Unauthenticated/unauthorized users can exfiltrate sensitive profile data across accounts.',
      recommendation: 'Implement server-side user ID claim validation against the active JWT session subject.',
      fileName: '',
      fileSize: '',
      fileType: 'pdf',
      fileData: '',
    });
    setReportForm({
      title: '',
      notes: '',
      fileName: '',
      fileSize: '',
      fileType: 'pdf',
      fileData: '',
    });
    setReportDragOver(false);
    setIsUploadingReport(false);

    // 4. Complete REVIEWER State Reset (Clean baseline queue, zero candidate audits)
    setReviewerDocuments([]);
    setReviewingDoc(null);
    setDocReviewScore(88);
    setDocReviewDecision('verified');
    setDocReviewFeedback('Comprehensive methodology, clear reproduction steps, and sound remediation guidance.');
    setRubricScores({
      'Reconnaissance': 9,
      'Vulnerability finding': 23,
      'Validation': 18,
      'Evidence': 14,
      'Impact analysis': 9,
      'Remediation': 9,
      'Report quality': 9,
    });
    setExtraTelemetryLogs([]);
    setFlaggedFindings([]);
    setActiveReviewerLabs([]);
    setInspectTab('traffic');
    setInspectFilter('ALL');
    setSelectedReqIndex(0);
    setQbQuestions(ALL_ASSESSMENT_QUESTIONS);
    setQbSectionFilter('All');
    setQbSearch('');
    setEditingQuestion(null);
    setQbForm({
      section: 'Aptitude',
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: '',
    });

    // 5. Complete RECRUITER State Reset (Clean interviews baseline, cleared search & shortlists)
    setInterviews([]);
    setSavedCandidates([]);
    setQuery('');
    setPassedCandidates([]);
    setRecruiterCandidates([]);
    setInviteCandidate('');
    setMinCapability(80);
    setMinConfidence(80);
    setMinAccuracy(85);
    setRequiredSkill('Web Security');
    setMinSkill(80);
    setInviteForm({
      role: 'Application Security Engineer',
      mode: 'online',
      type: 'Technical Defense Deep Dive (Zoom)',
      venue: 'FREQUENCY HQ, Tower B, Level 4, Tech Park, Indiranagar, Bengaluru - 560038',
      room: 'Security War Room 4B · Hardware Token & Lab Station',
      date: '2026-10-02',
      time: '14:00 IST',
      message: 'We reviewed your verified lab findings and would love to hear how you approached validation and remediation.',
    });

    notify('All candidate results and workflow records have been reset.');
    window.location.reload();
  };

  // Full 40-Question Assessment & 20-Min Timer State (Persistent across modal close/reopen)
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [assessmentTimeLeft, setAssessmentTimeLeft] = useState(1200);
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const stored = sessionStorage.getItem('proofforge.session');
        if (!stored) return;
        const saved = JSON.parse(stored) as AuthSession;
        if (!saved?.token) return;
        const response = await fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${saved.token}` } });
        if (!response.ok) throw new Error('Session expired');
        const user = await response.json();
        const roleMap: Record<string, Role> = { candidate: 'Candidate', reviewer: 'Reviewer', recruiter: 'Recruiter' };
        const restoredRole = roleMap[user.role];
        if (!restoredRole || !active) throw new Error('Invalid session');
        const session = { token: saved.token, role: restoredRole, name: user.name, email: user.email };
        setAuth(session);
        setRole(restoredRole);
      } catch {
        sessionStorage.removeItem('proofforge.session');
      } finally {
        if (active) setAuthReady(true);
      }
    };
    void restore();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!auth || auth.role !== 'Candidate') {
      setCandidateProgress(null);
      setServerAssessmentResults([]);
      return;
    }
    let active = true;
    fetch(`${API_BASE}/api/candidate/progress`, { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(response => { if (!response.ok) throw new Error('Unable to load candidate progress'); return response.json(); })
      .then((progress: CandidateProgressSummary) => {
        if (!active) return;
        setCandidateProgress(progress);
        setServerAssessmentResults(progress.assessments ?? []);
      })
      .catch(() => { if (active) { setCandidateProgress(null); setServerAssessmentResults([]); } });
    return () => { active = false; };
  }, [auth?.email, auth?.token, auth?.role]);

  useEffect(() => {
    if (!auth || auth.role !== 'Candidate') {
      setCurrentQIndex(0); setSelectedAnswers({}); setAssessmentTimeLeft(1200); setAssessmentSubmitted(false); setAssessmentSyncStatus('none');
      return;
    }
    try {
      const savedIndex = localStorage.getItem(assessmentProgressKey(auth.email, 'qIndex'));
      const savedAnswers = localStorage.getItem(assessmentProgressKey(auth.email, 'answers'));
      const savedTime = localStorage.getItem(assessmentProgressKey(auth.email, 'timeLeft'));
      const savedSubmitted = localStorage.getItem(assessmentProgressKey(auth.email, 'submitted'));
      const savedSync = localStorage.getItem(assessmentProgressKey(auth.email, 'sync'));
      const savedStartedAt = localStorage.getItem(assessmentProgressKey(auth.email, 'startedAt'));
      setCurrentQIndex(savedIndex ? Math.min(39, Math.max(0, Number(savedIndex))) : 0);
      setSelectedAnswers(savedAnswers ? JSON.parse(savedAnswers) : {});
      if (savedStartedAt && savedSubmitted !== 'true') {
        const elapsed = Math.floor((Date.now() - Number(savedStartedAt)) / 1000);
        const remaining = Math.max(0, 1200 - elapsed);
        setAssessmentTimeLeft(remaining);
        if (remaining <= 0) {
          setAssessmentSubmitted(true);
          saveAssessmentProgress(auth.email, 'submitted', 'true');
          saveAssessmentProgress(auth.email, 'timeLeft', '0');
        }
      } else {
        setAssessmentTimeLeft(savedSubmitted === 'true' ? 0 : savedTime ? Math.min(1200, Math.max(0, Number(savedTime))) : 1200);
      }
      setAssessmentSubmitted(savedSubmitted === 'true');
      setAssessmentSyncStatus(savedSync === 'verified' ? 'verified' : savedSync === 'local' ? 'local' : 'none');
    } catch {
      setCurrentQIndex(0); setSelectedAnswers({}); setAssessmentTimeLeft(1200); setAssessmentSubmitted(false); setAssessmentSyncStatus('none');
    }
  }, [auth?.email, auth?.role]);

  // Continuous timer ticker: runs in real-time, even if modal is closed, until 20 mins expire!
  useEffect(() => {
    if (!auth || auth.role !== 'Candidate' || assessmentSubmitted) return;
    const startedAtStr = localStorage.getItem(assessmentProgressKey(auth.email, 'startedAt'));
    if (!startedAtStr) return;

    const tick = () => {
      const startedAt = Number(startedAtStr);
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, 1200 - elapsed);
      setAssessmentTimeLeft(remaining);
      saveAssessmentProgress(auth.email, 'timeLeft', String(remaining));
      if (remaining <= 0) {
        setAssessmentSubmitted(true);
        saveAssessmentProgress(auth.email, 'submitted', 'true');
        void submitAssessment(true);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [auth?.email, auth?.role, assessmentSubmitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateAssessmentScores = () => {
    let totalCorrect = 0;
    const sectionMap: Record<string, { correct: number; total: number }> = {
      'Aptitude': { correct: 0, total: 10 },
      'English & Security Communication': { correct: 0, total: 10 },
      'Cybersecurity Fundamentals': { correct: 0, total: 10 },
      'Ethical Hacking & Pentesting': { correct: 0, total: 10 },
    };

    ALL_ASSESSMENT_QUESTIONS.forEach((q) => {
      const userChoice = selectedAnswers[q.id];
      if (userChoice !== undefined && userChoice === q.correctIndex) {
        totalCorrect += 1;
        if (sectionMap[q.section]) {
          sectionMap[q.section].correct += 1;
        }
      }
    });

    return { totalCorrect, total: ALL_ASSESSMENT_QUESTIONS.length, sectionMap };
  };

  const submitAssessment = async (timeExpired = false) => {
    if (assessmentSaving || !auth || auth.role !== 'Candidate') return;
    setAssessmentSaving(true);
    try {
      const results = await Promise.all(ASSESSMENT_SECTIONS.map(async section => {
        const answers = ALL_ASSESSMENT_QUESTIONS.filter(question => question.section === section)
          .map(question => selectedAnswers[question.id] ?? -1);
        const response = await fetch(`${API_BASE}/api/assessments/${encodeURIComponent(section)}/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
          body: JSON.stringify({ answers }),
        });
        if (!response.ok) throw new Error('Assessment score could not be saved');
        return await response.json() as AssessmentResultSummary;
      }));
      setServerAssessmentResults(results);
      setAssessmentSyncStatus('verified');
      saveAssessmentProgress(auth.email, 'sync', 'verified');
      setToast(timeExpired ? 'Time ended · your assessment was scored and saved.' : 'Assessment scored and saved to your candidate profile.');
    } catch {
      setAssessmentSyncStatus('local');
      saveAssessmentProgress(auth.email, 'sync', 'local');
      setToast('Assessment saved on this device; server scoring is currently unavailable.');
    } finally {
      setAssessmentSubmitted(true);
      saveAssessmentProgress(auth.email, 'submitted', 'true');
      if (timeExpired) saveAssessmentProgress(auth.email, 'timeLeft', '0');
      setAssessmentSaving(false);
    }
  };

  const notify = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(''), 2600);
  };

  const updateCandidateApproval = async (name: string, approved: boolean) => {
    if (!auth || auth.role !== 'Reviewer') {
      notify('Reviewer sign-in is required to change candidate approval.');
      return;
    }
    const account = CANDIDATE_ACCOUNTS.find((candidate) => candidate.name === name || candidate.email === name);
    if (!account) {
      notify('This demo profile has no candidate account. Only real candidate accounts can be passed.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/reviewer/candidate-approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ email: account.email, approved }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not update reviewer approval.');
      setPassedCandidates((current) => approved
        ? Array.from(new Set([...current, account.name]))
        : current.filter((candidate) => candidate !== account.name));
      notify(approved ? `${account.name} passed to the recruiter roster.` : `${account.name} removed from the recruiter roster.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update reviewer approval.');
    }
  };

  useEffect(() => {
    if (!auth?.token) {
      setPassedCandidates([]);
      setRecruiterCandidates([]);
      return;
    }
    let active = true;
    const headers = { Authorization: `Bearer ${auth.token}` };
    if (auth.role === 'Reviewer') {
      fetch(`${API_BASE}/api/reviewer/candidate-approvals`, { headers })
        .then(async (response) => {
          if (!response.ok) throw new Error('Could not load reviewer approvals.');
          return response.json();
        })
        .then((data) => { if (active) setPassedCandidates((data.candidates ?? []).filter((item: { approved: boolean }) => item.approved).map((item: { name: string }) => item.name)); })
        .catch(() => { if (active) setPassedCandidates([]); });
    } else {
      setPassedCandidates([]);
    }
    if (auth.role === 'Recruiter') {
      fetch(`${API_BASE}/api/recruiter/candidates`, { headers })
        .then(async (response) => {
          if (!response.ok) throw new Error('Could not load passed candidates.');
          return response.json();
        })
        .then((data) => {
          if (!active) return;
          const mapped: Person[] = (data.candidates ?? []).map((candidate: {
            name: string; role: string; security_capability: number; proof_confidence: number;
            verified_findings: number; security_dna: { skill: string; capability: number }[];
            verified_tools: string[]; finding_accuracy: number; verified_labs: string[];
            technical_defense_score: number; report_quality: number;
          }) => {
            const dna = Object.fromEntries(SECURITY_DOMAINS.map((domain) => [domain,
              candidate.security_dna.find((item) => item.skill === domain)?.capability ?? 0]));
            return {
              name: candidate.name, role: candidate.role, score: candidate.security_capability,
              confidence: candidate.proof_confidence, findings: candidate.verified_findings,
              skills: candidate.security_dna.map((item) => item.skill), tools: candidate.verified_tools ?? [],
              initials: candidate.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
              tone: 'blue', accuracy: candidate.finding_accuracy, labsVerified: candidate.verified_labs.length,
              defense: candidate.technical_defense_score, report: candidate.report_quality, dna,
            };
          });
          setRecruiterCandidates(mapped);
        })
        .catch(() => { if (active) setRecruiterCandidates([]); });
    } else {
      setRecruiterCandidates([]);
    }
    return () => { active = false; };
  }, [auth?.email, auth?.token, auth?.role]);

  useEffect(() => {
    if (!auth || (auth.role !== 'Reviewer' && auth.role !== 'Candidate')) return;
    let active = true;
    fetch(`${API_BASE}/api/documents`, { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load candidate reports.');
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const documents: CandidateDocItem[] = (data.documents ?? []).map((doc: {
          id: number; candidate_name: string; candidate_email: string; title: string; lab: string;
          severity: CandidateDocItem['severity']; doc_type?: CandidateDocItem['fileType']; file_name?: string;
          file_size?: string; description?: string; status: CandidateDocItem['status']; reviewer_score?: number;
          reviewer_feedback?: string; reviewed_by?: string; created_at?: string;
        }) => ({
          id: String(doc.id), candidateName: doc.candidate_name || 'Candidate', candidateEmail: doc.candidate_email || '',
          title: doc.title, lab: doc.lab || 'Security Assessment', severity: doc.severity || 'Informational',
          category: 'Candidate Report', component: 'Submitted assessment report', description: doc.description || '',
          evidence: 'Evidence is available in the submitted report.', reproduction: '', impact: '', recommendation: '',
          fileName: doc.file_name, fileSize: doc.file_size, fileType: doc.doc_type,
          status: doc.status, score: doc.reviewer_score, submittedAt: doc.created_at || '',
          reviewerFeedback: doc.reviewer_feedback, reviewedBy: doc.reviewed_by,
        }));
        if (auth.role === 'Reviewer') setReviewerDocuments(documents);
        else setCandidateReports(documents);
      })
      .catch(() => { if (active && auth.role === 'Reviewer') setReviewerDocuments([]); });
    return () => { active = false; };
  }, [auth?.email, auth?.token, auth?.role]);

  const nav =
    role === 'Candidate'
      ? ['Overview', 'Security Labs', 'Handbook', 'Toolbox', 'Assessments', 'Findings', 'Reports', 'Proof Profile', 'Interviews']
      : role === 'Reviewer'
        ? ['Overview', 'Secure Assessments', 'Labs', 'Findings', 'Uploaded Documents', 'Reviews', 'Question Bank', 'Flagged Findings', 'Rankings']
        : ['Overview', 'Find Security Talent', 'Security Profiles', 'Saved Candidates', 'Interviews'];

  const doNav = (s: string) => {
    setPage(s);
    setLab('');
    setTopicTab('concepts');
  };

  const signOut = async () => {
    if (auth?.token) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${auth.token}` } });
      } catch { /* Local sign-out still clears this browser session. */ }
    }
    sessionStorage.removeItem('proofforge.session');
    setAuth(null);
    setRole('Candidate');
    setPage('Overview');
  };

  // Dynamic Candidate Profile for Ananya Rao (Starts at 0 until assessment/findings are completed)
  const hasPassed = passedCandidates.includes('Ananya Rao') || assessmentFinalized;
  const liveVerifiedFindings = candidateReports.filter((r) => r.status === 'verified').length;
  const liveScore = candidateProgress && candidateProgress.overall_capability > 0
    ? candidateProgress.overall_capability
    : (assessmentFinalized ? 91 : (assessmentSubmitted ? 88 : 0));
  const liveConfidence = candidateProgress && candidateProgress.proof_confidence > 0
    ? candidateProgress.proof_confidence
    : (assessmentFinalized ? 94 : (assessmentSubmitted ? 90 : 0));
  const liveAccuracy = candidateProgress && candidateProgress.finding_accuracy > 0
    ? candidateProgress.finding_accuracy
    : (assessmentFinalized ? 88 : (liveVerifiedFindings > 0 ? 85 : 0));

  const liveAnanyaProfile: Person = {
    name: 'Ananya Rao',
    role: 'Application Security Engineer',
    score: liveScore,
    confidence: liveConfidence,
    findings: liveVerifiedFindings,
    skills: ['Web Security', 'API Security'],
    tools: ['Burp Suite', 'Nmap'],
    initials: 'AR',
    tone: 'peach',
    accuracy: liveAccuracy,
    labsVerified: liveVerifiedFindings,
    defense: defenseEvaluated ? defenseScore : (assessmentFinalized ? 91 : 0),
    report: liveVerifiedFindings > 0 ? 92 : 0,
    dna: {
      'Web Security': liveScore > 0 ? Math.min(100, liveScore + 3) : 0,
      'API Security': liveScore > 0 ? liveScore : 0,
      'Network Security': liveScore > 0 ? Math.max(0, liveScore - 15) : 0,
      'Reconnaissance': liveScore > 0 ? Math.max(0, liveScore - 5) : 0,
      'Linux Security': liveScore > 0 ? Math.max(0, liveScore - 20) : 0,
      'Vulnerability Assessment': liveScore > 0 ? Math.min(100, liveScore + 2) : 0,
      'Penetration Testing': liveScore > 0 ? Math.max(0, liveScore - 2) : 0,
      'Security Reporting': liveVerifiedFindings > 0 ? 93 : 0,
      'Incident Response / Blue Team': liveScore > 0 ? Math.max(0, liveScore - 25) : 0,
    },
  };

  // Only include Ananya Rao in recruiter's verified talent roster if she has passed
  const people: Person[] = role === 'Recruiter'
    ? recruiterCandidates
    : hasPassed ? [liveAnanyaProfile, ...SEEDED_PEOPLE] : SEEDED_PEOPLE;

  const activeCandidate = auth?.name === 'Ananya Rao'
    ? liveAnanyaProfile
    : (people.find((person) => person.name === auth?.name) ?? liveAnanyaProfile);

  const matchedPeople = people
    .filter(p => `${p.name} ${p.role} ${p.skills.join(' ')} ${p.tools.join(' ')}`.toLowerCase().includes(query.toLowerCase()) && p.score >= minCapability && p.confidence >= minConfidence && p.accuracy >= minAccuracy && p.dna[requiredSkill] >= minSkill)
    .sort((a, b) => sortBy === 'score' ? b.score - a.score : b.confidence - a.confidence);
  const selectedProfile = people.find((person) => person.name === lab) ?? people[0] ?? liveAnanyaProfile;

  if (!authReady) return (
    <div className="auth-loading" aria-label="Checking sign-in">
      <img
        src="/logo.webp"
        alt="FREQUENCY"
        style={{ height: 80, width: 'auto', maxWidth: 260, objectFit: 'contain', borderRadius: 8 }}
        onError={(e) => {
          e.currentTarget.src = "https://www.dropbox.com/scl/fi/hr34fbqd0nrkdz2l1d4s4/logo-yAs4SU6K.webp?rlkey=egie2afj08uknrfhn1lk1kypf&st=oyp6qki1&raw=1";
        }}
      />
    </div>
  );
  if (!auth) return <LoginScreen onAuthenticated={session => { setAuth(session); setRole(session.role); setPage('Overview'); }} />;

  return (
    <div className={`shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/logo.webp"
            alt="FREQUENCY Logo"
            className="company-logo"
            style={{ height: 38, width: 'auto', maxHeight: 42, maxWidth: 140, objectFit: 'contain', borderRadius: 6, flexShrink: 0, display: 'block' }}
            onError={(e) => {
              e.currentTarget.src = "https://www.dropbox.com/scl/fi/hr34fbqd0nrkdz2l1d4s4/logo-yAs4SU6K.webp?rlkey=egie2afj08uknrfhn1lk1kypf&st=oyp6qki1&raw=1";
            }}
          />
          <span style={{ color: '#275823', fontWeight: 800, fontSize: 17, letterSpacing: '0.8px', fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase', flex: 1 }}>
            FREQUENCY
          </span>
          <button className="icon-button side-toggle" aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'} title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={() => setSidebarCollapsed(value => !value)}><Menu size={17} /></button>
        </div>

        <div className="workspace">
          <span className="avatar tiny">
            {role === 'Candidate' ? 'AR' : role === 'Reviewer' ? 'SK' : 'JD'}
          </span>
          <span className="workspace-name">
            {auth.name}
            <small>{role} workspace</small>
          </span>
          <ChevronDown size={14} />
        </div>

        <p className="nav-label">WORKSPACE</p>
        <nav>
          {nav.map((x, i) => {
            const Icon = PAGE_ICON_MAP[x] || NAV_ICONS[Math.min(i, NAV_ICONS.length - 1)];
            return (
              <button key={x} className={`nav-item ${page === x ? 'active' : ''}`} onClick={() => doNav(x)}>
                <Icon />
                <span>{x}</span>
                {x === 'Findings' && <b className="nav-count">{role === 'Reviewer' ? '4' : String(candidateReports.filter(r => r.category !== 'Assessment Report').length)}</b>}
                {x === 'Uploaded Documents' && <b className="nav-count">{String(reviewerDocuments.filter(d => d.status === 'pending').length)}</b>}
                {x === 'Reports' && <b className="nav-count">{String(candidateReports.filter(r => r.category === 'Assessment Report' || r.fileName).length)}</b>}
              </button>
            );
          })}
        </nav>

        <div className="side-bottom">
          <div className="lab-notice">
            <div><ShieldCheck size={15} /><span>SAFE BY DESIGN</span></div>
            <p>All testing stays inside authorized training environments.</p>
          </div>
          <button className="nav-item" onClick={() => notify('Settings are up to date')}><Settings /><span>Settings</span></button>
          <button className="nav-item" onClick={() => void signOut()}><LogOut /><span>Sign out</span></button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main">
        <header className="topbar">
          <div className="crumb">Workspace <ChevronRight size={13} /><strong>{page}</strong></div>
          <div className="top-actions">
            <div className="demo-chip"><span />{' '}DEMO ENVIRONMENT</div>
            <span className="signed-in-role">{role} workspace</span>
            <button className="button secondary signout-top" onClick={() => void signOut()}><LogOut size={14} />Sign out</button>
          </div>
        </header>

        <section className="content">
          {/* ── Candidate: Overview ── */}
          {role === 'Candidate' && page === 'Overview' && (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow"><span className="live-dot" />YOUR PROOF, IN PROGRESS</div>
                  <h1>Good morning, {auth.name}<span className="wave">✳</span></h1>
                  <p className="subhead">Every finding is a chance to show how you think.</p>
                </div>
                <button className="button primary" onClick={() => doNav('Security Labs')}><FlaskConical size={15} />Explore labs<ArrowRight size={15} /></button>
              </div>

              <div className="banner">
                <div className="banner-icon"><ShieldCheck size={20} /></div>
                <div><strong>AUTHORIZED LAB ONLY</strong><p>Security testing outside explicitly authorized targets is prohibited.</p></div>
                <span className="banner-status"><span />All systems contained</span>
              </div>

              {/* Active Zoom / Offline Interview Alert Banner */}
              {interviews.filter(i => i.candidate === auth?.name).length > 0 && (
                (() => {
                  const myInv = interviews.filter(i => i.candidate === auth?.name)[0];
                  const isOffline = myInv.mode === 'offline';
                  return (
                    <div className="banner reviewer" style={{ background: isOffline ? '#fbf8ee' : '#f0f7ee', borderColor: isOffline ? '#e8dcbe' : '#cde2c6', marginBottom: 17 }}>
                      <div className="banner-icon" style={{ background: isOffline ? '#f2e8cf' : '#dcecd7', color: isOffline ? '#7a5116' : '#275823' }}>
                        {isOffline ? <Building2 size={18} /> : <Video size={18} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: isOffline ? '#6e450e' : '#245220' }}>
                          {isOffline ? 'UPCOMING IN-PERSON / OFFLINE INTERVIEW (ON-SITE)' : (myInv.status === 'CONFIRMED' ? 'UPCOMING TECHNICAL INTERVIEW (ZOOM)' : 'INTERVIEW INVITATION RECEIVED')}
                        </strong>
                        <p style={{ color: isOffline ? '#6e5e48' : '#566652', margin: '2px 0 0' }}>
                          {myInv.role} · {myInv.date} ({myInv.time}) · {isOffline ? `📍 Venue: ${myInv.venue || 'ProofForge HQ'}` : myInv.company}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                        <button className="button secondary small-button" onClick={() => doNav('Interviews')}>
                          View details
                        </button>
                        {isOffline ? (
                          <button
                            className="button primary small-button"
                            onClick={() => {
                              window.open(`https://maps.google.com/?q=${encodeURIComponent(myInv.venue || 'Bengaluru Tech Park')}`, '_blank', 'noopener,noreferrer');
                              notify('Opening venue directions in Google Maps...');
                            }}
                          >
                            <MapPin size={12} /> View Venue Map <ExternalLink size={10} />
                          </button>
                        ) : (
                          <button
                            className="button primary small-button"
                            onClick={() => {
                              window.open(myInv.zoomUrl || 'https://us05web.zoom.us/myhome', '_blank', 'noopener,noreferrer');
                              notify('Opening Zoom interview room...');
                            }}
                          >
                            <Video size={12} /> Join Zoom Meeting <ExternalLink size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}

              <div className="metrics">
                <Metric label="SECURITY CAPABILITY" value={candidateProgress && candidateProgress.overall_capability > 0 ? String(candidateProgress.overall_capability) : '0'} unit="/ 100" trend={candidateProgress && candidateProgress.overall_capability > 0 ? 'Based on your verified proof' : 'Unrated · complete assessment to establish baseline'} icon={<Activity />} tone="peach" />
                <Metric label="PROOF CONFIDENCE" value={candidateProgress && candidateProgress.proof_confidence > 0 ? String(candidateProgress.proof_confidence) : '0'} unit="%" trend="Calculated from verified work" icon={<ShieldCheck />} tone="mint" />
                <Metric label="VERIFIED FINDINGS" value={String(candidateReports.filter(r => r.status === 'verified').length)} unit="" trend={candidateReports.length > 0 ? `${candidateReports.length} total submitted` : '0 total submitted'} icon={<FileCheck2 />} tone="lavender" />
                <Metric label="FINDING ACCURACY" value={candidateProgress && candidateProgress.finding_accuracy > 0 ? String(candidateProgress.finding_accuracy) : '0'} unit="%" trend="Calculated from reviewer evaluations" icon={<Target />} tone="cream" />
              </div>

              <div className="grid-two">
                <div className="panel">
                  <div className="panel-head">
                    <div><h2>Recommended for you</h2><p>Picked for your Web Security focus</p></div>
                    <button className="text-link" onClick={() => doNav('Security Labs')}>All labs <ArrowRight size={14} /></button>
                  </div>
                  <div className="lab-list">
                    {labs.slice(0, 3).map((l) => (
                      <div className="lab-row" key={l.n}>
                        <div className={`lab-icon ${l.color}`}><l.icon size={17} /></div>
                        <div className="lab-info">
                          <div className="lab-tag">{l.tag}</div>
                          <strong>{l.n}</strong>
                          <span>{l.level} <i>·</i> {l.time}</span>
                        </div>
                        <button
                          className={`round-action ${l.done ? 'done' : ''}`}
                          onClick={() => { setLab(l.n); setModal('lab'); }}
                          aria-label={`Open ${l.n} lab`}
                        >
                          {l.done ? <Check size={16} /> : <ArrowUpRight size={16} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel activity-panel">
                  <div className="panel-head">
                    <div><h2>Proof chain</h2><p>Your latest verified work</p></div>
                    <button className="more-button" onClick={() => doNav('Proof Profile')} aria-label="View proof profile"><MoreHorizontal size={18} /></button>
                  </div>
                  <div className="chain">
                    {(candidateProgress?.total_submitted ?? 0) > 0 || candidateReports.length > 0 ? (
                      <>
                        <ChainItem icon={<FlaskConical />} title="Lab exercise completed" meta="Authorized target" status="Complete" tone="mint" />
                        <ChainItem icon={<FileCheck2 />} title={candidateReports[0]?.title || 'Evidence submitted'} meta={candidateReports[0]?.status === 'verified' ? 'Verified by reviewer' : 'Awaiting reviewer rubric'} status={candidateReports[0]?.status === 'verified' ? 'Complete' : 'In review'} tone={candidateReports[0]?.status === 'verified' ? 'mint' : 'amber'} />
                      </>
                    ) : (
                      <div className="objective-box" style={{ textAlign: 'center', padding: '16px 10px', margin: '4px 0' }}>
                        <ShieldCheck size={18} style={{ color: '#7a8c75', margin: '0 auto 6px', display: 'block' }} />
                        <strong style={{ fontSize: 11.5 }}>PROOF CHAIN READY · 0 ENTRIES</strong>
                        <p style={{ fontSize: 11, margin: '3px 0 0' }}>Complete authorized security labs or take the timed technical assessment to generate verified proof records.</p>
                      </div>
                    )}
                  </div>
                  <button className="button secondary full" onClick={() => doNav('Findings')}>View all findings <ArrowRight size={15} /></button>
                </div>
              </div>

              <div className="recommend-card">
                <div className="recommend-icon"><Sparkles size={16} /></div>
                <div><span className="eyebrow">ADAPTIVE NEXT CHALLENGE · DEMO SIGNALS</span><h3>Stretch your API authorization practice</h3><p>Web Security and reconnaissance are strong in your verified proof. API Security is the next skill gap to build.</p></div>
                <button className="button secondary" onClick={() => { setLab('API Authorization'); setModal('lab'); }}>Open recommended lab <ArrowRight size={14} /></button>
              </div>

              <div className="bottom-note">
                <Sparkles size={14} /> Your claimed tools become verified only through practical lab work.
                <button onClick={() => doNav('Toolbox')}>Visit toolbox <ArrowRight size={13} /></button>
              </div>
            </>
          )}

          {/* ── Candidate: Security Labs ── */}
          {role === 'Candidate' && page === 'Security Labs' && (
            <>
              <PageIntro eyebrow="PRACTICE WITH PURPOSE" title="Security labs" sub="Controlled environments. Real methodology. Evidence you can stand behind." action={<button className="button secondary" onClick={() => notify('Showing all 6 authorized labs')}><Filter size={14} />Filters</button>} />
              <div className="banner compact">
                <div className="banner-icon"><ShieldCheck size={18} /></div>
                <div><strong>STAY WITHIN THE PUBLISHED SCOPE</strong><p>ProofForge labs are contained. External practice opens on its provider’s site and follows that site’s rules.</p></div>
                <span className="banner-status"><span />6 local labs</span>
              </div>
              <div className="lab-grid">
                {labs.map(l => <LabCard key={l.n} item={l} onClick={() => { setLab(l.n); setModal('lab'); }} />)}
              </div>
              <div className="external-practice-heading">
                <div><span className="eyebrow">PROVIDER-HOSTED PRACTICE</span><h2>External training targets</h2><p>These sites open in a separate tab. ProofForge does not control or isolate third-party systems.</p></div>
              </div>
              <div className="external-target-grid">
                {externalPracticeTargets.map(target => (
                  <article className="external-target-card" key={target.name}>
                    <div className="external-target-top"><div className="external-target-icon"><Globe2 size={17} /></div><span className="external-provider">{target.provider}</span></div>
                    <h3>{target.name}</h3><p className="external-target-focus">{target.focus}</p>
                    <div className="external-scope"><ShieldCheck size={14} /><span>{target.guidance}</span></div>
                    <div className="external-target-actions">
                      <a className="button primary" href={target.url} target="_blank" rel="noopener noreferrer">Open practice site <ExternalLink size={13} /></a>
                      <button className="button secondary" onClick={() => { setLab(target.name); setModal('finding'); }}>Record finding <FileCheck2 size={13} /></button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="external-reference-card"><div><span className="external-reference-label">PROJECT REFERENCE · VIEW ONLY</span><strong>HackMysuru participant site</strong><p>This is the hackathon’s public event and participant site; no security-testing scope is published here.</p></div><a href="https://hackmysuru.rankbook.in/" target="_blank" rel="noopener noreferrer">Open site <ExternalLink size={13} /></a></div>
            </>
          )}

          {/* ── Candidate: Handbook ── */}
          {role === 'Candidate' && page === 'Handbook' && (
            <>
              <PageIntro eyebrow="LEARN · REVISE · APPLY" title="Security handbook" sub="Quick, practical refreshers for the work that matters." />
              <div className="handbook-banner">
                <div>
                  <span className="eyebrow">FIELD NOTES 01—06</span>
                  <h2>Strong security starts<br />with asking better questions.</h2>
                  <p>Short references for safe, evidence-led testing.</p>
                  <button className="button primary" onClick={() => { setLab('Networking'); setTopicTab('concepts'); setModal('topic'); notify('Networking field notes opened'); }}>Start reading <ArrowRight size={14} /></button>
                </div>
                <div className="book-art"><BookOpen size={68} /><div className="orbit o1" /><div className="orbit o2" /></div>
              </div>
              <div className="topic-grid">
                {topics.map(([t, d], i) => (
                  <button className="topic" key={t} onClick={() => { setLab(t); setTopicTab('concepts'); setModal('topic'); }}>
                    <div className="topic-num">0{i + 1}</div>
                    <div><strong>{t}</strong><p>{d}</p></div>
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Candidate: Toolbox ── */}
          {role === 'Candidate' && page === 'Toolbox' && (
            (() => {
              const filteredTools = TOOLBOX_TOOLS.filter((t) => {
                const matchCategory =
                  toolboxCategory === 'All' || t.category === toolboxCategory;
                const matchQuery =
                  !toolboxSearch.trim() ||
                  t.name.toLowerCase().includes(toolboxSearch.toLowerCase()) ||
                  t.tagline.toLowerCase().includes(toolboxSearch.toLowerCase()) ||
                  t.syntax.toLowerCase().includes(toolboxSearch.toLowerCase()) ||
                  t.description.toLowerCase().includes(toolboxSearch.toLowerCase()) ||
                  t.keyFlags.toLowerCase().includes(toolboxSearch.toLowerCase());
                return matchCategory && matchQuery;
              });

              return (
                <>
                  <PageIntro
                    eyebrow="OFFENSIVE &amp; DEFENSIVE TOOL SUITE"
                    title="The toolbox"
                    sub="16 essential security tools with verified command syntaxes, flag cheat sheets, and safe target parameters."
                  />
                  <div className="banner">
                    <div className="banner-icon"><ShieldCheck size={20} /></div>
                    <div>
                      <strong>AUTHORIZED LAB SCOPE ONLY</strong>
                      <p>Replace placeholders with target IPs and endpoints assigned to your isolated container.</p>
                    </div>
                  </div>

                  <div className="toolbox-header-row">
                    <div className="toolbox-controls">
                      <div className="toolbox-categories" role="tablist">
                        {TOOLBOX_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            className={`toolbox-cat-btn ${toolboxCategory === cat ? 'active' : ''}`}
                            onClick={() => setToolboxCategory(cat)}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div className="toolbox-search-wrap">
                        <Search size={13} />
                        <input
                          type="text"
                          className="toolbox-search-input"
                          placeholder="Search 16 tools, syntaxes, flags..."
                          value={toolboxSearch}
                          onChange={(e) => setToolboxSearch(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {filteredTools.length === 0 ? (
                    <div className="objective-box" style={{ textAlign: 'center', padding: '24px 15px' }}>
                      <strong>NO MATCHING TOOLS FOUND</strong>
                      <p>Try clearing your search query or selecting "All" categories.</p>
                      <button
                        className="button secondary small-button"
                        style={{ marginTop: 10 }}
                        onClick={() => {
                          setToolboxCategory('All');
                          setToolboxSearch('');
                        }}
                      >
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    <div className="tool-grid">
                      {filteredTools.map((tool) => {
                        const isCopied = copiedCmd === tool.id;
                        return (
                          <div className="tool-card" key={tool.id}>
                            <div className="tool-card-head">
                              <span className="tool-category-badge">{tool.category.toUpperCase()}</span>
                              <span className="tool-claim">{tool.claimedBy}</span>
                            </div>

                            <div style={{ marginTop: 8 }}>
                              <h3 style={{ margin: '0 0 2px' }}>{tool.name}</h3>
                              <div className="tool-tagline">{tool.tagline}</div>
                            </div>

                            <div className="tool-card-code-wrap">
                              <div className="tool-code-header">
                                <span>SYNTAX TEMPLATE</span>
                                <button
                                  className="tool-copy-btn"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(tool.syntax);
                                    setCopiedCmd(tool.id);
                                    notify(`Copied ${tool.name} syntax`);
                                    setTimeout(() => setCopiedCmd(''), 2000);
                                  }}
                                  title="Copy command syntax"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check size={10} style={{ color: '#4a8241' }} />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={10} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <code style={{ fontSize: 10, wordBreak: 'break-all' }}>{tool.syntax}</code>
                            </div>

                            <div className="tool-foot" style={{ margin: '6px 0 0' }}>{tool.description}</div>

                            <div className="tool-flags-box">
                              <strong style={{ display: 'block', fontSize: 8, color: '#455941', marginBottom: 2 }}>
                                KEY FLAGS &amp; FEATURES:
                              </strong>
                              {tool.keyFlags}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()
          )}

          {/* ── Candidate: Assessments ── */}
          {role === 'Candidate' && page === 'Assessments' && (
            (() => {
              const answeredCount = Object.keys(selectedAnswers).length;
              const percentDone = Math.round((answeredCount / ALL_ASSESSMENT_QUESTIONS.length) * 100);
              return (
                <>
                  <SecureAssessment role="Candidate" token={auth.token}
                    onLaunchAssessment={(durationMinutes) => {
                      const initialTime = Math.max(1, durationMinutes) * 60;
                      const existingStart = localStorage.getItem(assessmentProgressKey(auth.email, 'startedAt'));
                      if (!existingStart) {
                        saveAssessmentProgress(auth.email, 'startedAt', String(Date.now()));
                      }
                      setAssessmentTimeLeft(initialTime);
                      saveAssessmentProgress(auth.email, 'timeLeft', String(initialTime));
                      const firstUnanswered = ALL_ASSESSMENT_QUESTIONS.findIndex(q => selectedAnswers[q.id] === undefined);
                      setCurrentQIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
                      setModal('assessment');
                    }}
                    onAssessmentEnded={() => setModal('')}
                    onAutoSubmitAssessment={() => void submitAssessment(true)}
                    currentChallenge={`Section ${String((ALL_ASSESSMENT_QUESTIONS[currentQIndex]?.sectionIndex ?? 0) + 1).padStart(2, '0')} · Question ${currentQIndex + 1}`}
                    assessmentSubmitted={assessmentSubmitted} />
                  <PageIntro
                    eyebrow="SHOW HOW YOU THINK"
                    title="Security assessment"
                    sub="40 questions across four domains in sequential order · 20-minute overall timer · scored server-side."
                  />
                  <div className="secure-disclaimer-card" style={{ marginBottom: 20 }}>
                    <div className="secure-disclaimer-header">
                      <AlertTriangle className="secure-disclaimer-icon" size={17} />
                      <span>CRITICAL CANDIDATE NOTICE: STRICT CONTINUOUS TIMER &amp; SINGLE ATTEMPT</span>
                    </div>
                    <p>
                      Please read carefully before starting your security assessment:
                    </p>
                    <ul>
                      <li><strong>Continuous Live Timer:</strong> Once the assessment begins, <strong>the timer DOES NOT STOP</strong>. Closing this modal, navigating away from this tab, or exiting your browser will <u>NOT pause or stop the timer</u>. It counts down continuously in real-time until the 20 minutes expire.</li>
                      <li><strong>Single Attempt (Cannot Go Back):</strong> Once the timer expires or the assessment is submitted, <strong>you CANNOT go back or retake the assessment</strong>. Your responses are permanently recorded.</li>
                      <li><strong>One Uninterrupted Session:</strong> Ensure you are ready and have a stable internet connection before beginning.</li>
                    </ul>
                  </div>
                  <div className="assessment-total">
                    <div>
                      <strong>40</strong>
                      <span>questions total</span>
                    </div>
                    <div className="progress-wrap">
                      <div className="progress-head">
                        <span>Overall progress</span>
                        <strong>{answeredCount} / {ALL_ASSESSMENT_QUESTIONS.length} ({percentDone}%)</strong>
                      </div>
                      <div className="progress">
                        <span style={{ width: `${percentDone}%` }} />
                      </div>
                    </div>
                    <button
                      className="button primary"
                      onClick={() => {
                        if (!assessmentSubmitted) {
                          const existingStart = localStorage.getItem(assessmentProgressKey(auth.email, 'startedAt'));
                          if (!existingStart) {
                            saveAssessmentProgress(auth.email, 'startedAt', String(Date.now()));
                          }
                        }
                        // Resume from first unanswered question or 0
                        const firstUnanswered = ALL_ASSESSMENT_QUESTIONS.findIndex(q => selectedAnswers[q.id] === undefined);
                        setCurrentQIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
                        setModal('assessment');
                      }}
                    >
                      {assessmentSubmitted ? (
                        <>View score report <Award size={15} /></>
                      ) : answeredCount > 0 ? (
                        <>Resume assessment <ArrowRight size={15} /></>
                      ) : (
                        <>Begin assessment (20 mins) <ArrowRight size={15} /></>
                      )}
                    </button>
                  </div>
                  {serverAssessmentResults.length > 0 && <div className="candidate-assessment-results">
                    <div className="candidate-assessment-results-head"><div><strong>YOUR SAVED TEST RESULTS</strong><p>Scores belong to {auth.name} and are stored on the candidate account.</p></div><ShieldCheck size={16} /></div>
                    <div className="candidate-assessment-result-grid">{ASSESSMENT_SECTIONS.map(section => {
                      const result = serverAssessmentResults.find(item => item.section === section);
                      return <div key={section} className="candidate-assessment-result"><span>{section}</span><b>{result ? `${result.percent}%` : 'Not taken'}</b><small>{result ? `${result.correct} of ${result.total} correct` : 'No saved score'}</small></div>;
                    })}</div>
                  </div>}
                  <div className="section-list">
                    {ASSESSMENT_SECTIONS.map((secName, i) => {
                      const secQuestions = ALL_ASSESSMENT_QUESTIONS.filter(q => q.section === secName);
                      const secAnswered = secQuestions.filter(q => selectedAnswers[q.id] !== undefined).length;
                      const isSecComplete = secAnswered === secQuestions.length;
                      const isSecInProgress = secAnswered > 0 && !isSecComplete;
                      return (
                        <div
                          className="section-row"
                          key={secName}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            if (!assessmentSubmitted) {
                              const existingStart = localStorage.getItem(assessmentProgressKey(auth.email, 'startedAt'));
                              if (!existingStart) {
                                saveAssessmentProgress(auth.email, 'startedAt', String(Date.now()));
                              }
                            }
                            setCurrentQIndex(i * 10);
                            setModal('assessment');
                          }}
                        >
                          <div className="section-num">0{i + 1}</div>
                          <div>
                            <strong>{secName}</strong>
                            <p>Questions {i * 10 + 1}–{i * 10 + 10} · 10 questions</p>
                          </div>
                          <span className="section-state">
                            {assessmentSubmitted ? (
                              'Scored'
                            ) : isSecComplete ? (
                              'Completed (10/10)'
                            ) : isSecInProgress ? (
                              `In progress (${secAnswered}/10)`
                            ) : serverAssessmentResults.some(result => result.section === secName) ? (
                              `Saved · ${serverAssessmentResults.find(result => result.section === secName)?.percent}%`
                            ) : (
                              'Not started'
                            )}
                          </span>
                          <ChevronRight size={16} />
                        </div>
                      );
                    })}
                  </div>
                  <p className="muted-note">
                    <LockKeyhole size={14} /> 20-minute overall countdown timer. Answer keys stay on the server. Results are linked to your verified profile.
                  </p>
                </>
              );
            })()
          )}

          {role === 'Reviewer' && page === 'Secure Assessments' && (
            <>
              <PageIntro eyebrow="CONSENT BASED PROCTORING" title="Secure assessment monitoring"
                sub="Monitor only assessments assigned to your reviewer account. Browser-level signals are recorded; media is not stored." />
              <SecureAssessment role="Reviewer" token={auth.token} />
            </>
          )}

          {/* ── Candidate: Findings / Reports / Profile / Interviews ── */}
          {role === 'Candidate' && ['Findings', 'Reports', 'Proof Profile', 'Interviews'].includes(page) && (
            <>
              <PageIntro
                eyebrow="YOUR VERIFIED PROOF"
                title={page === 'Proof Profile' ? 'Security profile' : page}
                sub={page === 'Interviews' ? 'Interview invitations from teams looking for verified talent.' : 'Work you can explain, reproduce and defend.'}
              />
              {page === 'Proof Profile' ? (
                <div className="profile-card">
                  <div className="profile-top">
                    <div className="avatar big peach">{auth.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}</div>
      <div>
        <span className="verified-pill"><ShieldCheck size={13} /> VERIFIED PROFILE</span>
        <h2>{auth.name}</h2>
                      <p>Application Security · Candidate since Jan 2025</p>
                    </div>
                    <button className="button secondary" onClick={() => notify('Profile link copied')}>Share profile <ArrowUpRight size={14} /></button>
                  </div>
                  <div className="profile-stats">
                    <div><strong>{candidateProgress && candidateProgress.overall_capability > 0 ? candidateProgress.overall_capability : '0'}</strong><span>Capability score</span></div>
                    <div><strong>{candidateProgress && candidateProgress.proof_confidence > 0 ? `${candidateProgress.proof_confidence}%` : '0%'}</strong><span>Proof confidence</span></div>
                    <div><strong>{candidateProgress?.verified_findings ?? 0}</strong><span>Verified findings</span></div>
                    <div><strong>{candidateProgress && candidateProgress.finding_accuracy > 0 ? `${candidateProgress.finding_accuracy}%` : '0%'}</strong><span>Finding accuracy</span></div>
                  </div>
                  <div className="proof-metrics"><span><b>{defenseEvaluated ? defenseScore : '—'}</b> technical defense score</span><span><b>2</b> reviewed false positives</span><span><b>1</b> duplicate evidence flag</span><span><b>90</b> report quality</span></div>
                  <div className="skills-row">
                    <span>VERIFIED SKILLS</span>
                    {['Web Security', 'API Security', 'Reconnaissance', 'Reporting'].map(x => (
                      <b key={x}>{x}<Check size={12} /></b>
                    ))}
                  </div>
                  <SecurityDna dna={activeCandidate.dna} confidence={candidateProgress?.proof_confidence ?? activeCandidate.confidence} />
                  <ProofChainGraph defenseScore={defenseEvaluated ? defenseScore : activeCandidate.defense} verified={verified} />
                  <h3 className="subsection-title">Verified finding portfolio</h3>
                  {candidateReports.filter((r) => r.status === 'verified').length > 0 ? (
                    candidateReports
                      .filter((r) => r.status === 'verified')
                      .map((item) => (
                        <div key={item.id} style={{ marginBottom: 8 }}>
                          <Finding
                            name={item.title}
                            severity={item.severity.toUpperCase()}
                            lab={`${item.lab} · verified by reviewer`}
                            verified={true}
                            onClick={() => setModal('finding')}
                          />
                        </div>
                      ))
                  ) : (
                    <div className="objective-box" style={{ textAlign: 'center', padding: '22px 14px', margin: '8px 0' }}>
                      <FileCheck2 size={20} style={{ color: '#7a8c75', margin: '0 auto 6px', display: 'block' }} />
                      <strong style={{ fontSize: 12 }}>NO VERIFIED FINDINGS YET</strong>
                      <p style={{ fontSize: 11, margin: '3px 0 0' }}>Submit reproduction steps and evidence from authorized labs or upload a pentest report. Scored and verified findings will be permanently recorded here.</p>
                    </div>
                  )}
                </div>
              ) : page === 'Interviews' ? (
                (() => {
                  const myInterviews = interviews.filter((i) => i.candidate === auth.name);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="banner reviewer" style={{ background: '#f0f6ee', borderColor: '#cfe1cb' }}>
                        <div className="banner-icon" style={{ background: '#dcebd7', color: '#2b5f25' }}>
                          <BriefcaseBusiness size={20} />
                        </div>
                        <div>
                          <strong style={{ color: '#285923' }}>OFFICIAL INTERVIEW SCHEDULE &amp; INVITATIONS</strong>
                          <p style={{ color: '#566652' }}>
                            Virtual meetings are hosted via secure Zoom rooms. In-person meetings include verified office directions and venue passes.
                          </p>
                        </div>
                      </div>

                      {myInterviews.length === 0 ? (
                        <div className="objective-box" style={{ textAlign: 'center', padding: '30px 15px' }}>
                          <BriefcaseBusiness size={20} style={{ color: '#688c5a', margin: '0 auto 8px', display: 'block' }} />
                          <strong>NO ACTIVE INTERVIEW INVITATIONS</strong>
                          <p>When recruiters review and verify your lab findings, technical interview invites with meeting coordinates will appear here.</p>
                        </div>
                      ) : (
                        myInterviews.map((inv) => {
                          const isOffline = inv.mode === 'offline';
                          return (
                            <div className="panel" key={inv.id}>
                              <div className="invite-card">
                                <div className="invite-mark">
                                  {isOffline ? <Building2 size={20} /> : <Video size={20} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="lab-tag">{inv.company.toUpperCase()}</span>
                                    <span className={inv.status === 'CONFIRMED' ? 'verified-pill' : 'status-pill'}>
                                      {isOffline ? 'IN-PERSON · ON-SITE' : (inv.status === 'CONFIRMED' ? 'CONFIRMED · ZOOM READY' : 'INVITATION RECEIVED')}
                                    </span>
                                  </div>
                                  <h3 style={{ margin: '6px 0 3px' }}>{inv.role}</h3>
                                  <p style={{ margin: '0 0 10px', fontSize: 11, color: '#697464' }}>{inv.message}</p>
                                  
                                  <div className="invite-meta" style={{ marginBottom: 12 }}>
                                    <span><Clock3 size={13} />{inv.type}</span>
                                    <span><Clock3 size={13} />{inv.date} ({inv.time})</span>
                                    {isOffline ? (
                                      <span style={{ color: '#7a5116', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <MapPin size={13} /> {inv.venue || 'ProofForge Cyber HQ'}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#275924', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <Video size={13} /> Zoom Link Active
                                      </span>
                                    )}
                                  </div>

                                  <div className="invite-actions" style={{ alignItems: 'center' }}>
                                    {isOffline ? (
                                      <button
                                        className="button primary"
                                        onClick={() => {
                                          window.open(`https://maps.google.com/?q=${encodeURIComponent(inv.venue || 'Bengaluru Tech Park')}`, '_blank', 'noopener,noreferrer');
                                          notify('Opening office venue in Google Maps...');
                                        }}
                                      >
                                        <MapPin size={14} /> View Venue &amp; Map <ExternalLink size={12} />
                                      </button>
                                    ) : (
                                      <button
                                        className="button primary"
                                        onClick={() => {
                                          window.open(inv.zoomUrl || 'https://us05web.zoom.us/myhome', '_blank', 'noopener,noreferrer');
                                          notify('Opening Zoom interview room...');
                                        }}
                                      >
                                        <Video size={14} /> Join Zoom Meeting <ExternalLink size={12} />
                                      </button>
                                    )}

                                    {inv.status === 'PENDING' && (
                                      <button
                                        className="button secondary"
                                        onClick={() => {
                                          setInterviews((prev) =>
                                            prev.map((item) =>
                                              item.id === inv.id ? { ...item, status: 'CONFIRMED' } : item
                                            )
                                          );
                                          notify(isOffline ? 'In-person meeting confirmed' : 'Zoom interview confirmed');
                                        }}
                                      >
                                        Accept Invitation <Check size={14} />
                                      </button>
                                    )}

                                    <button
                                      className="button secondary"
                                      onClick={() => {
                                        const textToCopy = isOffline ? (inv.venue || 'ProofForge Cyber HQ') : (inv.zoomUrl || 'https://us05web.zoom.us/myhome');
                                        navigator.clipboard?.writeText(textToCopy);
                                        notify(isOffline ? 'Office venue address copied' : 'Zoom meeting link copied');
                                      }}
                                    >
                                      <Copy size={13} /> {isOffline ? 'Copy Venue' : 'Copy Link'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })()
              ) : page === 'Reports' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* ── Direct Report Upload Box (Drag & Drop or Select from Device) ── */}
                  <div className="panel">
                    <div className="panel-head">
                      <div>
                        <h2>Upload Pentest / Assessment Report</h2>
                        <p>Upload your official penetration testing or security assessment report (PDF or Word document). The report is sent directly to the reviewer panel for audit.</p>
                      </div>
                      <div className="top-actions" style={{ gap: 6 }}>
                        <span className="demo-chip" style={{ background: '#eaf4e6', color: '#255422', borderColor: '#c7dec0' }}>
                          PDF &amp; WORD (.DOCX)
                        </span>
                      </div>
                    </div>

                    <input
                      ref={reportFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleReportFileSelect(f);
                        e.target.value = '';
                      }}
                    />

                    {!reportForm.fileName ? (
                      <div
                        id="report-dropzone"
                        className={`doc-upload-zone ${reportDragOver ? 'dragging' : ''}`}
                        onDragEnter={onReportDragEnter}
                        onDragOver={onReportDragOver}
                        onDragLeave={onReportDragLeave}
                        onDrop={onReportDrop}
                        onClick={() => reportFileInputRef.current?.click()}
                        style={{ padding: '36px 20px', cursor: 'pointer' }}
                      >
                        <div style={{ pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 54,
                            height: 54,
                            borderRadius: '50%',
                            background: reportDragOver ? '#d2ebd0' : '#eaf4e6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: reportDragOver ? '#1f4e1c' : '#2d6a26',
                            transition: 'all 0.2s',
                          }}>
                            <UploadCloud size={28} />
                          </div>
                          <strong style={{ fontSize: 13.5, color: reportDragOver ? '#1b4518' : '#223420' }}>
                            {reportDragOver ? 'Drop your report file now' : 'Drag & drop your PDF or Word report here'}
                          </strong>
                          <p style={{ margin: 0, fontSize: 11.5, color: '#5f6f5b', maxWidth: 440, textAlign: 'center' }}>
                            Supports official assessment reports in <b>.pdf</b>, <b>.docx</b>, or <b>.doc</b> (up to 25 MB).
                          </p>
                          <div style={{ marginTop: 4 }}>
                            <button
                              type="button"
                              className="button primary"
                              style={{ pointerEvents: 'auto' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                reportFileInputRef.current?.click();
                              }}
                            >
                              <FolderOpen size={14} /> Select from device
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Attached File Preview */}
                        <div className="doc-attached-card" style={{ padding: '12px 16px' }}>
                          <div className="doc-attached-info">
                            <span className={`doc-type-badge ${reportForm.fileType}`}>
                              {reportForm.fileType.toUpperCase()} REPORT
                            </span>
                            <div>
                              <strong style={{ fontSize: 13, color: '#202f1d', display: 'block' }}>{reportForm.fileName}</strong>
                              <span style={{ fontSize: 10.5, color: '#687765' }}>Ready for reviewer submission · {reportForm.fileSize}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              type="button"
                              className="button secondary small-button"
                              onClick={() => downloadDocumentFile(reportForm.fileName, reportForm.fileData)}
                            >
                              <Download size={12} /> Preview
                            </button>
                            <button
                              type="button"
                              className="button secondary small-button"
                              style={{ color: '#ba3726', borderColor: '#f2c5be' }}
                              onClick={() => setReportForm({ title: '', notes: '', fileName: '', fileSize: '', fileType: 'pdf', fileData: '' })}
                            >
                              <X size={12} /> Remove
                            </button>
                          </div>
                        </div>

                        {/* Minimal Report Metadata */}
                        <div className="form-grid">
                          <label className="span-two">
                            Report Title
                            <input
                              value={reportForm.title}
                              onChange={(e) => setReportForm((prev) => ({ ...prev, title: e.target.value }))}
                              placeholder="e.g. Web Application Penetration Test Report"
                            />
                          </label>
                          <label className="span-two">
                            Executive Notes for Reviewer (Optional)
                            <textarea
                              value={reportForm.notes}
                              onChange={(e) => setReportForm((prev) => ({ ...prev, notes: e.target.value }))}
                              placeholder="Add scope details, target systems tested, or executive remarks for the reviewing evaluator..."
                              style={{ minHeight: 64 }}
                            />
                          </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => setReportForm({ title: '', notes: '', fileName: '', fileSize: '', fileType: 'pdf', fileData: '' })}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="button primary"
                            disabled={isUploadingReport}
                            onClick={handleUploadCandidateReport}
                          >
                            {isUploadingReport ? <RefreshCw size={14} className="spin" /> : <Upload size={14} />} Upload Report to Reviewer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Candidate's Uploaded Reports Queue ── */}
                  <div className="panel">
                    <div className="panel-head">
                      <div>
                        <h2>Uploaded Reports ({candidateReports.filter((r) => r.category === 'Assessment Report' || r.fileName).length})</h2>
                        <p>Documents you uploaded and their reviewer audit and certification status.</p>
                      </div>
                    </div>

                    {candidateReports.filter((r) => r.category === 'Assessment Report' || r.fileName).length === 0 ? (
                      <div className="objective-box" style={{ textAlign: 'center', padding: '32px 16px', margin: '8px 0' }}>
                        <FileText size={30} style={{ color: '#7a8c75', margin: '0 auto 8px', display: 'block' }} />
                        <strong style={{ fontSize: 12.5, color: '#273824' }}>NO REPORTS UPLOADED YET</strong>
                        <p style={{ fontSize: 11, margin: '4px 0 0', color: '#687564' }}>
                          Drag and drop your penetration testing report (PDF or Word) above or click "Select from device" to upload.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
                        {candidateReports
                          .filter((r) => r.category === 'Assessment Report' || r.fileName)
                          .map((item) => (
                            <div
                              key={item.id}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                padding: '12px 14px',
                                border: '1px solid #e2e6de',
                                borderRadius: 8,
                                background: '#fcfdfa',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div className="finding-icon"><FileText size={16} /></div>
                                  <div>
                                    <strong style={{ fontSize: 12, color: '#243422' }}>{item.title}</strong>
                                    <p style={{ margin: '2px 0 0', fontSize: 10, color: '#737e6f' }}>
                                      Uploaded {item.submittedAt} · {item.description}
                                    </p>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  {item.status === 'verified' ? (
                                    <span className="verified-pill"><ShieldCheck size={12} /> VERIFIED ({item.score ?? 90}/100)</span>
                                  ) : item.status === 'needs_changes' ? (
                                    <span className="status-pill warning">NEEDS REVISIONS</span>
                                  ) : (
                                    <span className="status-pill">AWAITING REVIEWER CHECK</span>
                                  )}
                                </div>
                              </div>

                              {item.fileName && (
                                <div className="doc-attached-card" style={{ margin: '2px 0 0', padding: '7px 12px' }}>
                                  <div className="doc-attached-info">
                                    <span className={`doc-type-badge ${item.fileType || 'pdf'}`}>
                                      {item.fileType?.toUpperCase() || 'PDF'}
                                    </span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#2c3c2a' }}>{item.fileName}</span>
                                    <span style={{ fontSize: 10, color: '#7a8677' }}>({item.fileSize})</span>
                                  </div>
                                  <button
                                    className="button secondary small-button"
                                    style={{ padding: '3px 8px', fontSize: 10 }}
                                    onClick={() => downloadDocumentFile(item.fileName!, item.fileData || '')}
                                  >
                                    <Download size={11} /> Download / View File
                                  </button>
                                </div>
                              )}

                              {item.reviewerFeedback && (
                                <div style={{ padding: '8px 12px', background: '#f5f9f3', borderRadius: 6, border: '1px solid #dbe8d7', fontSize: 11, color: '#335030' }}>
                                  <strong>Reviewer Audit Note:</strong> {item.reviewerFeedback}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ── Findings Section (Lab Technical Findings) ── */
                <div className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>Vulnerability Findings &amp; Proofs</h2>
                      <p>Technical vulnerability findings, reproduction proofs, and defenses recorded from authorized security labs.</p>
                    </div>
                    <button className="button primary small-button" onClick={() => setModal('finding')}>
                      <Plus size={14} /> Record Lab Finding
                    </button>
                  </div>

                  {candidateReports.filter((r) => r.category !== 'Assessment Report').length === 0 ? (
                    <div className="objective-box" style={{ textAlign: 'center', padding: '36px 16px', margin: '14px 0' }}>
                      <FileCheck2 size={32} style={{ color: '#7a8c75', margin: '0 auto 10px', display: 'block' }} />
                      <strong style={{ fontSize: 13, color: '#273824' }}>NO LAB FINDINGS RECORDED YET</strong>
                      <p style={{ fontSize: 11.5, margin: '6px 0 16px', color: '#687564', maxWidth: 480, marginInline: 'auto' }}>
                        Start an authorized Security Lab and record observed vulnerabilities, reproduction proofs, and remediation recommendations.
                      </p>
                      <button className="button primary" onClick={() => setModal('finding')}>
                        <Plus size={14} /> Record Lab Finding
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                      {candidateReports
                        .filter((r) => r.category !== 'Assessment Report')
                        .map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                              padding: '12px 14px',
                              border: '1px solid #e2e6de',
                              borderRadius: 8,
                              background: '#fcfdfa',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="finding-icon"><FileCheck2 size={16} /></div>
                                <div>
                                  <strong style={{ fontSize: 12, color: '#243422' }}>{item.title}</strong>
                                  <p style={{ margin: '2px 0 0', fontSize: 10, color: '#737e6f' }}>
                                    {item.lab} · {item.submittedAt}
                                  </p>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span className={`severity ${item.severity.toLowerCase()}`}>{item.severity}</span>
                                {item.status === 'verified' ? (
                                  <span className="verified-pill"><ShieldCheck size={12} /> VERIFIED ({item.score ?? 88}/100)</span>
                                ) : item.status === 'needs_changes' ? (
                                  <span className="status-pill warning">NEEDS REVISIONS</span>
                                ) : (
                                  <span className="status-pill">AWAITING REVIEWER CHECK</span>
                                )}
                              </div>
                            </div>

                            {item.component && (
                              <div style={{ fontSize: 11, color: '#4a5746', background: '#f5f7f3', padding: '4px 8px', borderRadius: 4, fontFamily: 'DM Mono' }}>
                                <strong>Target:</strong> {item.component}
                              </div>
                            )}

                            {item.description && (
                              <p style={{ margin: 0, fontSize: 11, color: '#556351' }}>
                                {item.description}
                              </p>
                            )}

                            {item.reviewerFeedback && (
                              <div style={{ padding: '8px 12px', background: '#f5f9f3', borderRadius: 6, border: '1px solid #dbe8d7', fontSize: 11, color: '#335030' }}>
                                <strong>Reviewer Audit Note:</strong> {item.reviewerFeedback}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}

                  {defenseAsked && !defenseEvaluated && (
                    <div className="defense-request">
                      <div><Fingerprint size={16} /><strong>Technical defense requested</strong><span>Reviewer is checking how you validated this finding.</span></div>
                      <button className="button primary" disabled={defenseSent} onClick={() => setModal('defense')}>{defenseSent ? 'Submitted · awaiting review' : <>Answer 5 questions <ArrowRight size={14} /></>}</button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Reviewer ── */}
          {role === 'Reviewer' && (
            <>
              <PageIntro
                eyebrow="REVIEWER CONSOLE · SYNTHETIC DATA"
                title={
                  page === 'Overview'
                    ? 'Good morning, Samira'
                    : page === 'Labs'
                    ? 'Lab container orchestration'
                    : page === 'Findings'
                    ? 'Candidate findings queue'
                    : page === 'Uploaded Documents'
                    ? 'Candidate uploaded documents & reports'
                    : page === 'Reviews'
                    ? 'Verified reviews & assessment audit'
                    : page === 'Question Bank'
                    ? 'Assessment question bank & authoring'
                    : page === 'Flagged Findings'
                    ? 'Flagged submission audit'
                    : 'Candidate capability rankings'
                }
                sub={
                  page === 'Overview'
                    ? 'Evidence first. Human judgment always.'
                    : page === 'Labs'
                    ? 'Manage synthetic vulnerable containers, telemetry, and instance resets.'
                    : page === 'Findings'
                    ? 'Evaluate sanitized evidence, proof chains, and candidate technical defenses.'
                    : page === 'Uploaded Documents'
                    ? 'Review, score, and certify uploaded candidate pentest reports (PDF & Word .docx).'
                    : page === 'Reviews'
                    ? 'Audit scored evaluations and certify automated candidate assessment results.'
                    : page === 'Question Bank'
                    ? 'Create, edit, search, and manage 40+ assessment questions across four core domains.'
                    : page === 'Flagged Findings'
                    ? 'Inspect duplicate evidence hashes, anomalous payload patterns, and defense mismatches.'
                    : 'Verified candidate leaderboard ranked by holistic Security DNA capability fingerprint.'
                }
                action={
                  page === 'Question Bank' ? (
                    <button
                      className="button primary"
                      onClick={() => {
                        setQbForm({
                          section: 'Aptitude',
                          question: '',
                          options: ['', '', '', ''],
                          correctIndex: 0,
                          explanation: '',
                        });
                        setModal('add-qb');
                      }}
                    >
                      <PlusCircle size={14} /> Add new question
                    </button>
                  ) : page === 'Labs' ? (
                    <button
                      className="button primary"
                      onClick={() => setModal('provision-lab')}
                    >
                      <Plus size={14} /> Provision test container
                    </button>
                  ) : (
                    <button className="button secondary" onClick={() => notify('Showing priority queue')}>
                      <Filter size={14} /> Priority queue
                    </button>
                  )
                }
              />

              {/* ── 1. Overview ── */}
              {page === 'Overview' && (
                <>
                  <div className="banner reviewer">
                    <div className="banner-icon"><ShieldCheck size={20} /></div>
                    <div>
                      <strong>REVIEWER AUTHORITY &amp; EVALUATION PIPELINE</strong>
                      <p>AI suggestions are advisory. Final rubric scoring, defense evaluation, and assessment certifications are yours.</p>
                    </div>
                    <span className="banner-status">3 findings · 1 assessment pending</span>
                  </div>

                  <div className="metrics">
                    <Metric label="AWAITING REVIEW" value="3" trend="Oldest · 2 hours" icon={<Clock3 />} tone="cream" />
                    <Metric label="VERIFIED THIS WEEK" value="18" trend="Across 6 candidates" icon={<ShieldCheck />} tone="mint" />
                    <Metric label="FLAGGED SUBMISSIONS" value={String(flaggedFindings.length)} trend="Hash collision" icon={<ShieldAlert />} tone="peach" />
                    <Metric label="QUESTION BANK" value={String(qbQuestions.length)} trend="4 Technical Domains" icon={<BookOpen />} tone="lavender" />
                  </div>

                  {/* Candidate Assessment Alert */}
                  {assessmentSubmitted ? (
                    <div className="rev-assess-banner">
                      <div>
                        <strong>CANDIDATE ASSESSMENT COMPLETED · AWAITING FINALIZATION</strong>
                        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#4d6148' }}>
                          Ananya Rao completed the 40-question technical assessment. Verify domain breakdown and finalize.
                        </p>
                      </div>
                      <button
                        className="button primary"
                        style={{ fontSize: 10, padding: '7px 11px' }}
                        onClick={() => setModal('review-assessment')}
                      >
                        <ShieldCheck size={13} /> {assessmentFinalized ? 'View Certified Assessment' : 'Finalize & Certify Score'}
                      </button>
                    </div>
                  ) : (
                    <div className="rev-assess-banner" style={{ background: '#f5f7f4', borderColor: '#dce3d7' }}>
                      <div>
                        <strong style={{ color: '#4d5c49' }}>ASSESSMENT PIPELINE · CANDIDATE READY</strong>
                        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#687764' }}>
                          Candidate has not started the technical assessment yet. Real-time proctoring and score audit will appear here once submitted.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="panel">
                    <div className="panel-head">
                      <div><h2>Review queue</h2><p>Submissions ready for your rubric assessment</p></div>
                      <button className="text-link" onClick={() => doNav('Findings')}>View queue <ArrowRight size={14} /></button>
                    </div>
                    <ReviewRow name="Rohan Mehta" finding="Broken Access Control" lab="API Authorization Lab" time="2 hours ago" score="87" onClick={() => setModal('review')} />
                    <ReviewRow name="Karan Shah" finding="Reflected Cross-Site Scripting" lab="Reflected XSS Lab" time="4 hours ago" score="74" onClick={() => setModal('review')} />
                    <ReviewRow name="Maya Iyer" finding="SQL Injection" lab="SQL Injection Lab" time="Yesterday" score="—" onClick={() => setModal('review')} />
                  </div>
                </>
              )}

              {/* ── 2. Labs ── */}
              {page === 'Labs' && (
                <div className="lab-grid">
                  {activeReviewerLabs.map((labItem) => (
                    <div className="lab-card" key={labItem.name}>
                      <div className="lab-card-top">
                        <span className="topic-badge">{labItem.tag}</span>
                        <span className="verified-pill"><ShieldCheck size={11} /> {labItem.status}</span>
                      </div>
                      <h3>{labItem.name}</h3>
                      <p>Isolated Docker environment with synthetic target endpoints, resettable state, and deterministic test vectors.</p>
                      
                      <div className="lab-card-meta">
                        <span><Activity size={12} /> CPU: {labItem.cpu}</span>
                        <span><Layers size={12} /> RAM: {labItem.memory}</span>
                        <span><Fingerprint size={12} /> {labItem.activeInstances} active sessions</span>
                      </div>

                      <div style={{ display: 'flex', gap: 7, marginTop: 'auto' }}>
                        <button
                          className="button secondary small-button"
                          style={{ flex: 1 }}
                          onClick={() => notify(`Resetting container state for ${labItem.name}...`)}
                        >
                          <RotateCcw size={12} /> Reset container
                        </button>
                        <button
                          className="button primary small-button"
                          onClick={() => {
                            setLab(labItem.name);
                            setModal('inspect-lab');
                            notify(`Opening live network telemetry & container console for ${labItem.name}`);
                          }}
                        >
                          <Terminal size={12} /> Inspect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── 3. Findings Queue ── */}
              {page === 'Findings' && (
                <div className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>Submission review queue</h2>
                      <p>Inspect sanitized reproduction evidence, HTTP payloads, and execute rubric scoring.</p>
                    </div>
                  </div>
                  <ReviewRow name="Rohan Mehta" finding="Broken Access Control" lab="API Authorization Lab" time="2 hours ago" score="87" onClick={() => setModal('review')} />
                  <ReviewRow name="Karan Shah" finding="Reflected Cross-Site Scripting" lab="Reflected XSS Lab" time="4 hours ago" score="74" onClick={() => setModal('review')} />
                  <ReviewRow name="Maya Iyer" finding="SQL Injection" lab="SQL Injection Lab" time="Yesterday" score="—" onClick={() => setModal('review')} />
                  <ReviewRow name="Devon Miles" finding="Insecure Direct Object Reference" lab="API Authorization Lab" time="1 day ago" score="91" onClick={() => setModal('review')} />
                </div>
              )}

              {/* ── 3B. Uploaded Documents Audit ── */}
              {page === 'Uploaded Documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="panel">
                    <div className="panel-head">
                      <div>
                        <h2>Candidate Uploaded Reports &amp; Documents</h2>
                        <p>Audit candidate pentest reports, methodology documents (PDF &amp; Word .docx), and record certified reviewer scoring.</p>
                      </div>
                      <div className="top-actions" style={{ gap: 6 }}>
                        <span className="demo-chip" style={{ background: '#eaf4e6', color: '#255422', borderColor: '#c7dec0' }}>
                          PDF &amp; WORD AUDIT
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, margin: '8px 0 14px' }}>
                      <div className="result-card" style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 9, color: '#7a8675', fontFamily: 'DM Mono' }}>TOTAL UPLOADED</span>
                        <strong style={{ fontSize: 20, color: '#1f2e1d', display: 'block', marginTop: 2 }}>{reviewerDocuments.length}</strong>
                      </div>
                      <div className="result-card" style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 9, color: '#b27524', fontFamily: 'DM Mono' }}>AWAITING REVIEW</span>
                        <strong style={{ fontSize: 20, color: '#b27524', display: 'block', marginTop: 2 }}>
                          {reviewerDocuments.filter((d) => d.status === 'pending').length}
                        </strong>
                      </div>
                      <div className="result-card" style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 9, color: '#31632d', fontFamily: 'DM Mono' }}>VERIFIED &amp; CERTIFIED</span>
                        <strong style={{ fontSize: 20, color: '#31632d', display: 'block', marginTop: 2 }}>
                          {reviewerDocuments.filter((d) => d.status === 'verified').length}
                        </strong>
                      </div>
                    </div>

                    {reviewerDocuments.length === 0 ? (
                      <div className="objective-box" style={{ textAlign: 'center', padding: '24px 12px' }}>
                        <FileText size={24} style={{ color: '#7a8c75', margin: '0 auto 6px', display: 'block' }} />
                        <strong style={{ fontSize: 12 }}>NO CANDIDATE DOCUMENTS UPLOADED YET</strong>
                        <p style={{ fontSize: 11, color: '#7a8475', margin: '4px 0 0' }}>
                          Uploaded PDF or Word documents from candidates will appear here for reviewer assessment and certification.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {reviewerDocuments.map((doc) => (
                          <div key={doc.id} className="doc-review-card">
                            <div className="doc-review-head">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div className={`avatar ${doc.candidateName.includes('Ananya') ? 'peach' : 'blue'}`}>
                                  {doc.candidateName.split(' ').map((x) => x[0]).join('')}
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <strong style={{ fontSize: 13, color: '#202f1d' }}>{doc.candidateName}</strong>
                                    <span style={{ fontSize: 10, color: '#7a8677' }}>· {doc.lab}</span>
                                  </div>
                                  <h4 style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 600, color: '#3a4a37' }}>
                                    {doc.title}
                                  </h4>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span className={`severity ${doc.severity.toLowerCase()}`}>{doc.severity}</span>
                                {doc.status === 'verified' ? (
                                  <span className="verified-pill"><ShieldCheck size={12} /> VERIFIED ({doc.score ?? 88}/100)</span>
                                ) : doc.status === 'needs_changes' ? (
                                  <span className="status-pill warning">NEEDS REVISIONS</span>
                                ) : (
                                  <span className="status-pill">AWAITING REVIEW</span>
                                )}
                              </div>
                            </div>

                            {doc.description && (
                              <p style={{ margin: 0, fontSize: 11, color: '#566453', lineHeight: 1.5 }}>
                                {doc.description}
                              </p>
                            )}

                            {doc.fileName && (
                              <div className="doc-attached-card" style={{ margin: 0 }}>
                                <div className="doc-attached-info">
                                  <span className={`doc-type-badge ${doc.fileType || 'pdf'}`}>
                                    {doc.fileType?.toUpperCase() || 'PDF'}
                                  </span>
                                  <div>
                                    <strong style={{ fontSize: 11.5, color: '#243422', display: 'block' }}>{doc.fileName}</strong>
                                    <span style={{ fontSize: 10, color: '#7a8677' }}>Uploaded {doc.submittedAt} · {doc.fileSize}</span>
                                  </div>
                                </div>
                                <div className="doc-review-actions">
                                  <button
                                    className="button secondary small-button"
                                    onClick={() => downloadDocumentFile(doc.fileName!, doc.fileData || '')}
                                    title="View or download document"
                                  >
                                    <Download size={12} /> Download / View
                                  </button>
                                  <button
                                    className="button primary small-button"
                                    onClick={() => {
                                      setReviewingDoc(doc);
                                      setDocReviewScore(doc.score ?? 88);
                                      setDocReviewDecision(doc.status === 'verified' ? 'verified' : 'verified');
                                      setDocReviewFeedback(doc.reviewerFeedback || 'Comprehensive methodology, clear reproduction steps, and sound remediation guidance.');
                                      setModal('review-document');
                                    }}
                                  >
                                    <Sliders size={12} /> {doc.status === 'verified' ? 'Edit Evaluation' : 'Review & Score'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {doc.reviewerFeedback && (
                              <div style={{ padding: '8px 12px', background: '#f5f9f3', borderRadius: 6, border: '1px solid #dbe8d7', fontSize: 11, color: '#335030' }}>
                                <strong>Reviewer Feedback ({doc.reviewedBy || 'Samira Khan'}):</strong> {doc.reviewerFeedback}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── 4. Reviews & Audit ── */}
              {page === 'Reviews' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="panel">
                    <div className="panel-head">
                      <div>
                        <h2>Candidate Assessments · Auto-Check &amp; Finalizer</h2>
                        <p>Evaluate deterministic stored answers from the 40-question timed assessment sessions.</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                      {assessmentSubmitted ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            border: '1px solid #e5e9e0',
                            borderRadius: 8,
                            background: '#fcfdfa',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="avatar peach">AR</div>
                            <div>
                              <strong style={{ fontSize: 12 }}>Ananya Rao</strong>
                              <p style={{ margin: '2px 0 0', fontSize: 10, color: '#7a8475' }}>
                                40 Questions Completed · Auto-Scored from Candidate Submission
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {assessmentFinalized ? (
                              <span className="verified-pill"><ShieldCheck size={12} /> CERTIFIED</span>
                            ) : (
                              <span className="status-pill">AWAITING FINALIZATION</span>
                            )}
                            <button
                              className="button primary small-button"
                              onClick={() => setModal('review-assessment')}
                            >
                              <Sliders size={12} /> {assessmentFinalized ? 'Edit Finalized Score' : 'Finalize Score'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="objective-box" style={{ textAlign: 'center', padding: '16px 12px' }}>
                          <p style={{ fontSize: 11, color: '#7a8475', margin: 0 }}>Candidate Ananya Rao has not submitted the technical assessment yet. Real-time auto-scores will appear here once submitted.</p>
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          border: '1px solid #e5e9e0',
                          borderRadius: 8,
                          background: '#fcfdfa',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="avatar blue">KS</div>
                          <div>
                            <strong style={{ fontSize: 12 }}>Karan Shah</strong>
                            <p style={{ margin: '2px 0 0', fontSize: 10, color: '#7a8475' }}>
                              40 Questions Completed in 18m 05s · Auto-Scored: 32 / 40 (80%)
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="verified-pill"><ShieldCheck size={12} /> CERTIFIED (80%)</span>
                          <button
                            className="button secondary small-button"
                            onClick={() => notify('Audit record loaded for Karan Shah')}
                          >
                            View record
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-head">
                      <div>
                        <h2>Verified Lab Finding Reviews Audit Log</h2>
                        <p>Historical audit trail of human reviewer verifications and rubric breakdowns.</p>
                      </div>
                    </div>
                    {candidateReports.filter(r => r.status === 'verified').map(r => (
                      <ReviewRow key={r.id} name={r.candidateName} finding={`${r.title} (Score: ${r.score || 90}/100)`} lab={r.lab} time="Verified recently" score={String(r.score || 90)} onClick={() => setModal('review')} />
                    ))}
                    <ReviewRow name="Karan Shah" finding="Reflected Cross-Site Scripting (Score: 74/100)" lab="Reflected XSS Lab" time="Verified yesterday" score="74" onClick={() => setModal('review')} />
                  </div>
                </div>
              )}

              {/* ── 5. Question Bank ── */}
              {page === 'Question Bank' && (
                (() => {
                  const filteredQuestions = qbQuestions.filter((q) => {
                    const matchSec = qbSectionFilter === 'All' || q.section === qbSectionFilter;
                    const matchQ =
                      !qbSearch.trim() ||
                      q.question.toLowerCase().includes(qbSearch.toLowerCase()) ||
                      q.options.some((opt) => opt.toLowerCase().includes(qbSearch.toLowerCase()));
                    return matchSec && matchQ;
                  });

                  return (
                    <>
                      {/* Section Stat Cards */}
                      <div className="qb-stat-grid">
                        {ASSESSMENT_SECTIONS.map((sec, idx) => {
                          const count = qbQuestions.filter((q) => q.section === sec).length;
                          return (
                            <div className="qb-stat-card" key={sec}>
                              <span>SECTION 0{idx + 1}</span>
                              <strong>{count}</strong>
                              <small>{sec}</small>
                            </div>
                          );
                        })}
                      </div>

                      {/* Controls Bar */}
                      <div className="qb-header">
                        <div className="toolbox-categories">
                          <button
                            className={`toolbox-cat-btn ${qbSectionFilter === 'All' ? 'active' : ''}`}
                            onClick={() => setQbSectionFilter('All')}
                          >
                            All ({qbQuestions.length})
                          </button>
                          {ASSESSMENT_SECTIONS.map((sec) => (
                            <button
                              key={sec}
                              className={`toolbox-cat-btn ${qbSectionFilter === sec ? 'active' : ''}`}
                              onClick={() => setQbSectionFilter(sec)}
                            >
                              {sec} ({qbQuestions.filter((q) => q.section === sec).length})
                            </button>
                          ))}
                        </div>

                        <div className="toolbox-search-wrap">
                          <Search size={13} />
                          <input
                            type="text"
                            className="toolbox-search-input"
                            placeholder="Search question text or options..."
                            value={qbSearch}
                            onChange={(e) => setQbSearch(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Questions List */}
                      {filteredQuestions.length === 0 ? (
                        <div className="objective-box" style={{ textAlign: 'center', padding: '24px 15px' }}>
                          <strong>NO QUESTIONS FOUND</strong>
                          <p>Try clearing your search query or selecting "All" sections.</p>
                        </div>
                      ) : (
                        <div className="qb-list">
                          {filteredQuestions.map((q) => (
                            <div className="qb-card" key={q.id}>
                              <div className="qb-card-head">
                                <span className="qb-sec-tag">
                                  #{q.id} · {q.section.toUpperCase()}
                                </span>
                                <div className="qb-card-actions">
                                  <button
                                    className="qb-action-btn"
                                    onClick={() => {
                                      setEditingQuestion(q);
                                      setQbForm({
                                        section: q.section,
                                        question: q.question,
                                        options: [...q.options],
                                        correctIndex: q.correctIndex,
                                        explanation: '',
                                      });
                                      setModal('edit-qb');
                                    }}
                                    title="Edit Question"
                                  >
                                    <Edit2 size={11} /> Edit
                                  </button>
                                  <button
                                    className="qb-action-btn delete"
                                    onClick={() => {
                                      if (confirm(`Delete Question #${q.id}?`)) {
                                        setQbQuestions((prev) => prev.filter((item) => item.id !== q.id));
                                        notify(`Question #${q.id} deleted from Question Bank`);
                                      }
                                    }}
                                    title="Delete Question"
                                  >
                                    <Trash2 size={11} /> Delete
                                  </button>
                                </div>
                              </div>

                              <div className="qb-qtext">{q.question}</div>

                              <div className="qb-options-grid">
                                {q.options.map((opt, optIdx) => {
                                  const isCorrect = optIdx === q.correctIndex;
                                  const letter = String.fromCharCode(65 + optIdx);
                                  return (
                                    <div className={`qb-opt ${isCorrect ? 'correct' : ''}`} key={optIdx}>
                                      <span>{letter}</span>
                                      <div style={{ flex: 1 }}>{opt} {isCorrect && '✓ (Correct)'}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()
              )}

              {/* ── 6. Flagged Findings ── */}
              {page === 'Flagged Findings' && (
                <div className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>Flagged Submissions &amp; Anomaly Detection</h2>
                      <p>Submissions flagged by duplicate hash detection, abnormal timings, or AI confidence mismatch.</p>
                    </div>
                  </div>

                  {flaggedFindings.length === 0 ? (
                    <div className="objective-box" style={{ textAlign: 'center', padding: '24px 15px' }}>
                      <Check size={18} style={{ color: '#43703c', margin: '0 auto 6px', display: 'block' }} />
                      <strong>ALL FLAGGED SUBMISSIONS RESOLVED</strong>
                      <p>No pending anomalies in the verification queue.</p>
                    </div>
                  ) : (
                    flaggedFindings.map((item) => (
                      <div className="flagged-card" key={item.id}>
                        <div className="flagged-head">
                          <div>
                            <strong style={{ fontSize: 13 }}>{item.candidate} · {item.finding}</strong>
                            <p style={{ margin: '2px 0 0', fontSize: 10, color: '#7a8375' }}>Target: {item.lab} · Submission ID: {item.id}</p>
                          </div>
                          <span className="flagged-reason"><AlertTriangle size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} /> {item.status}</span>
                        </div>

                        <div style={{ fontSize: 11, color: '#913b28', background: '#fdf2ef', padding: '8px 10px', borderRadius: 5 }}>
                          <strong>ANOMALY: </strong>{item.reason}
                        </div>

                        <div className="flagged-actions">
                          <button
                            className="button secondary small-button"
                            onClick={() => notify(`Defense re-interview requested for ${item.candidate}`)}
                          >
                            <Fingerprint size={12} /> Request defense re-interview
                          </button>
                          <button
                            className="button primary small-button"
                            onClick={() => {
                              setFlaggedFindings((prev) => prev.filter((f) => f.id !== item.id));
                              notify(`Flag cleared for ${item.candidate} — marked verified`);
                            }}
                          >
                            <ShieldCheck size={12} /> Clear flag &amp; verify
                          </button>
                          <button
                            className="button secondary small-button"
                            style={{ color: '#a3321f', borderColor: '#f2c5ba' }}
                            onClick={() => {
                              setFlaggedFindings((prev) => prev.filter((f) => f.id !== item.id));
                              notify(`Submission ${item.id} rejected and archived`);
                            }}
                          >
                            <Trash2 size={12} /> Reject submission
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── 7. Rankings ── */}
              {page === 'Rankings' && (
                <div className="panel">
                  <div className="panel-head">
                    <div>
                      <h2><Trophy size={15} style={{ verticalAlign: 'middle', marginRight: 6, color: '#9b7123' }} />Candidate capability rankings &amp; leaderboards</h2>
                      <p>Verified ranking based on practical lab exploits, technical defenses, and assessment performance.</p>
                    </div>
                  </div>

                  <table className="rankings-table">
                    <thead>
                      <tr>
                        <th>RANK</th>
                        <th>CANDIDATE</th>
                        <th>PRIMARY SPECIALIZATION</th>
                        <th>VERIFIED LABS</th>
                        <th>DEFENSE SCORE</th>
                        <th>ASSESSMENT</th>
                        <th>SECURITY DNA</th>
                        <th>REVIEWER VALIDATION &amp; ENDORSEMENT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {people.map((p, idx) => {
                        const isPassed = passedCandidates.includes(p.name);
                        return (
                          <tr key={p.name}>
                            <td>
                              <div className={`rank-badge ${idx === 0 ? 'top1' : idx === 1 ? 'top2' : idx === 2 ? 'top3' : ''}`}>
                                {idx + 1}
                              </div>
                            </td>
                            <td>
                              <strong>{p.name}</strong>
                              <div style={{ fontSize: 9, color: '#7a8475' }}>{p.role}</div>
                            </td>
                            <td>{p.skills[0]}</td>
                            <td>{p.labsVerified} Verified</td>
                            <td><b>{idx === 0 ? defenseScore : p.defense} / 100</b></td>
                            <td><span className="verified-pill">{idx === 0 ? '36/40 (90%)' : idx === 1 ? '32/40 (80%)' : '30/40 (75%)'}</span></td>
                            <td><strong style={{ color: '#275222' }}>{p.score} / 100</strong></td>
                            <td>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button
                                  className="button secondary small-button"
                                  style={{ padding: '4px 7px', fontSize: 10 }}
                                  onClick={() => {
                                    setLab(p.name);
                                    setModal('profile');
                                  }}
                                  title="Examine sanitized evidence and Security DNA"
                                >
                                  <FileCheck2 size={11} /> Examine Proof
                                </button>

                                <button
                                  className={`button small-button ${isPassed ? 'secondary' : 'primary'}`}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: 10,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    color: isPassed ? '#255422' : '#fff',
                                    background: isPassed ? '#eaf4e6' : undefined,
                                    borderColor: isPassed ? '#c7dec0' : undefined,
                                  }}
                                  onClick={() => {
                                    void updateCandidateApproval(p.name, !isPassed);
                                  }}
                                >
                                  {isPassed ? (
                                    <>
                                      <ShieldCheck size={11} /> Passed to Recruiter ✓
                                    </>
                                  ) : (
                                    <>
                                      <Check size={11} /> Pass to Recruiter
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── Recruiter ── */}
          {role === 'Recruiter' && (
            <>
              <PageIntro
                eyebrow="VERIFIED SECURITY TALENT · EVIDENCE PIPELINE"
                title={
                  page === 'Overview'
                    ? 'Good afternoon, Jordan'
                    : page === 'Find Security Talent'
                    ? 'Find verified security talent'
                    : page === 'Security Profiles'
                    ? 'Candidate security capability directory'
                    : page === 'Saved Candidates'
                    ? 'Saved candidate shortlist'
                    : 'Scheduled & confirmed technical interviews'
                }
                sub={
                  page === 'Overview'
                    ? 'Search evidence-backed capability, review verified labs, and schedule technical interviews.'
                    : page === 'Find Security Talent'
                    ? 'Filter candidates by proven exploit defense, verified lab findings, and Security DNA ratings.'
                    : page === 'Security Profiles'
                    ? 'Inspect comprehensive Security DNA capability fingerprints and human-reviewed audit records.'
                    : page === 'Saved Candidates'
                    ? 'Track and manage shortlisted candidates across your active hiring pipelines.'
                    : 'Manage candidate interview invites, virtual screening sessions, and confirmation statuses.'
                }
                action={
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      className="button secondary"
                      style={{ padding: '6px 11px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5, color: '#9a4c1e', fontWeight: 600 }}
                      onClick={() => void resetDemoState()}
                      title="Completely reset all candidate, reviewer, and recruiter demo data to fresh initial state"
                    >
                      <RotateCcw size={12} /> Reset All Entries (Fresh Start)
                    </button>
                    {page === 'Interviews' ? (
                      <button
                        className="button primary"
                        onClick={() => {
                          const target = inviteCandidate || lab || people[0]?.name || '';
                          setLab(target);
                          setInviteCandidate(target);
                          const matched = people.find((p) => p.name === target);
                          if (matched) {
                            setInviteForm((prev) => ({ ...prev, role: matched.role }));
                          }
                          setModal('invite');
                        }}
                      >
                        <BriefcaseBusiness size={14} /> Schedule new interview
                      </button>
                    ) : page === 'Saved Candidates' ? (
                      <button className="button secondary" onClick={() => doNav('Find Security Talent')}>
                        <Search size={14} /> Browse more talent
                      </button>
                    ) : (
                      <span className="synthetic-label"><span />SYNTHETIC VERIFIED TALENT</span>
                    )}
                  </div>
                }
              />

              {/* ── 1. Recruiter Overview ── */}
              {page === 'Overview' && (
                <>
                  <div className="banner recruiter">
                    <div className="banner-icon"><ShieldCheck size={20} /></div>
                    <div>
                      <strong>PROOF OVER CLAIMS · TALENT PIPELINE</strong>
                      <p>Every candidate score links to reviewed synthetic lab work and human-evaluated defenses.</p>
                    </div>
                    <span className="banner-status">{people.length} verified candidates</span>
                  </div>

                  <div className="metrics">
                    <Metric label="VERIFIED TALENTS" value={String(people.length)} trend="5 Specializations" icon={<ShieldCheck />} tone="mint" />
                    <Metric label="SAVED SHORTLIST" value={String(savedCandidates.length)} trend="Ready for screen" icon={<Award />} tone="lavender" />
                    <Metric label="ACTIVE INTERVIEWS" value={String(interviews.length)} trend={interviews.length === 1 ? '1 Scheduled' : `${interviews.length} Scheduled`} icon={<Clock3 />} tone="cream" />
                    <Metric label="EVIDENCE MATCH" value="94%" trend="Proof Confidence" icon={<Fingerprint />} tone="peach" />
                  </div>

                  <div className="rec-overview-grid">
                    {/* Left: Top Verified Candidates */}
                    <div className="rec-card">
                      <div className="rec-card-head">
                        <strong>Top Matched Security Talent</strong>
                        <button className="text-link" onClick={() => doNav('Find Security Talent')}>
                          View all ({people.length}) <ArrowRight size={13} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {people.slice(0, 3).map((p) => (
                          <div
                            key={p.name}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 12px',
                                background: '#fcfdfa',
                                border: '1px solid #e7ebe2',
                                borderRadius: 7,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className={`avatar candidate-avatar ${p.tone}`} style={{ height: 32, width: 32, fontSize: 10 }}>
                                  {p.initials}
                                </div>
                                <div>
                                  <strong style={{ fontSize: 12 }}>{p.name}</strong>
                                  <p style={{ margin: '1px 0 0', fontSize: 10, color: '#7a8475' }}>{p.role}</p>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="verified-pill"><ShieldCheck size={11} /> {p.score} DNA</span>
                                <button
                                  className={`button small-button ${savedCandidates.includes(p.name) ? 'primary' : 'secondary'}`}
                                  style={{ padding: '4px 7px', fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                  onClick={() => {
                                    if (savedCandidates.includes(p.name)) {
                                      setSavedCandidates(prev => prev.filter(c => c !== p.name));
                                      notify(`${p.name} removed from shortlist`);
                                    } else {
                                      setSavedCandidates(prev => [...prev, p.name]);
                                      notify(`${p.name} saved to shortlist!`);
                                    }
                                  }}
                                  title={savedCandidates.includes(p.name) ? "Remove from saved shortlist" : "Save to shortlist"}
                                >
                                  {savedCandidates.includes(p.name) ? <><BookmarkCheck size={11} /> Saved</> : <><Bookmark size={11} /> Save</>}
                                </button>
                                <button
                                  className="button secondary small-button"
                                  onClick={() => {
                                    setLab(p.name);
                                    setModal('profile');
                                  }}
                                >
                                  Proof
                                </button>
                                <button
                                  className="button primary small-button"
                                  onClick={() => {
                                    setLab(p.name);
                                    setInviteCandidate(p.name);
                                    setInviteForm((prev) => ({ ...prev, role: p.role }));
                                    setModal('invite');
                                  }}
                                >
                                  Invite
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Right: Upcoming Interviews */}
                    <div className="rec-card">
                      <div className="rec-card-head">
                        <strong>Upcoming Technical Interviews</strong>
                        <button className="text-link" onClick={() => doNav('Interviews')}>
                          Manage ({interviews.length}) <ArrowRight size={13} />
                        </button>
                      </div>

                      <div className="rec-interview-list">
                        {interviews.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '24px 12px', color: '#7a8475', fontSize: 11 }}>
                            No technical interviews scheduled yet. Shortlist verified candidates and schedule technical defense interviews.
                          </div>
                        ) : (
                          interviews.map((item) => {
                            const isOffline = item.mode === 'offline';
                            return (
                              <div className="rec-interview-item" key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="rec-interview-info">
                                  <div className="rec-interview-date">{item.date}</div>
                                  <div className="rec-interview-meta">
                                    <strong>{item.candidate}</strong>
                                    <p>{item.role} · {item.type} ({item.time})</p>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span className="verified-pill" style={{ fontSize: 9 }}>
                                    {isOffline ? 'OFFLINE / ON-SITE' : item.status}
                                  </span>
                                  {isOffline ? (
                                    <button
                                      className="button secondary small-button"
                                      style={{ padding: '4px 8px', fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                      onClick={() => {
                                        window.open(`https://maps.google.com/?q=${encodeURIComponent(item.venue || 'Bengaluru Tech Park')}`, '_blank', 'noopener,noreferrer');
                                        notify(`Opening venue location for ${item.candidate}...`);
                                      }}
                                      title="View Venue Map"
                                    >
                                      <MapPin size={11} /> Venue Map
                                    </button>
                                  ) : (
                                    <button
                                      className="button primary small-button"
                                      style={{ padding: '4px 8px', fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                      onClick={() => {
                                        window.open(item.zoomUrl || 'https://us05web.zoom.us/myhome', '_blank', 'noopener,noreferrer');
                                        notify(`Opening Zoom meeting room for ${item.candidate}...`);
                                      }}
                                      title="Open Zoom Meeting Room"
                                    >
                                      <Video size={11} /> Join Zoom
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── 2. Find Security Talent (Filters & Engine) ── */}
              {page === 'Find Security Talent' && (
                <div className="recruiter-layout">
                  <div className="filters-panel">
                    <h3><Filter size={15} />Refine search</h3>
                    <label className="search-box">
                      <Search size={15} />
                      <input placeholder="Skill, role, tool..." value={query} onChange={e => setQuery(e.target.value)} />
                    </label>
                    <div className="filter-group">
                      <span>SPECIALIZATION</span>
                      <select className="match-select" value={requiredSkill} onChange={e => setRequiredSkill(e.target.value)}>
                        {SECURITY_DOMAINS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="filter-group">
                      <span>MIN SKILL CAPABILITY · {minSkill}</span>
                      <input type="range" min="0" max="100" value={minSkill} onChange={e => setMinSkill(Number(e.target.value))} />
                    </div>
                    <div className="filter-group">
                      <span>MIN PROOF CONFIDENCE · {minConfidence}</span>
                      <input type="range" min="0" max="100" value={minConfidence} onChange={e => setMinConfidence(Number(e.target.value))} />
                    </div>
                    <div className="filter-group">
                      <span>MIN FINDING ACCURACY · {minAccuracy}%</span>
                      <input type="range" min="0" max="100" value={minAccuracy} onChange={e => setMinAccuracy(Number(e.target.value))} />
                    </div>
                    <div className="filter-group">
                      <span>MIN OVERALL CAPABILITY · {minCapability}</span>
                      <input type="range" min="0" max="100" value={minCapability} onChange={e => setMinCapability(Number(e.target.value))} />
                    </div>
                    <p className="filter-hint">Only verified findings contribute to skill matches. Tool claims are shown separately.</p>
                    <button className="text-link" onClick={() => { setQuery(''); setMinCapability(0); setMinConfidence(0); setMinAccuracy(0); setMinSkill(0); notify('Match requirements cleared'); }}>Clear requirements</button>
                  </div>

                  <div className="candidate-results">
                    <div className="result-head">
                      <span>
                        <strong>
                          {matchedPeople.length}
                        </strong> candidates match
                      </span>
                      <button className="sort-button" onClick={() => setSortBy(value => value === 'score' ? 'confidence' : 'score')} aria-label={`Sort candidates by ${sortBy === 'score' ? 'proof confidence' : 'capability score'}`} title="Change candidate sorting">{sortBy === 'score' ? 'Capability score' : 'Proof confidence'} <ChevronDown size={14} /></button>
                    </div>

                    {matchedPeople.length === 0 ? <div className="empty-state"><Search size={18} /><strong>No candidates match these requirements</strong><span>Try a broader search or lower one of the evidence thresholds.</span></div> : matchedPeople
                      .map(p => {
                        const isSaved = savedCandidates.includes(p.name);
                        return (
                          <div className="candidate-card" key={p.name}>
                            <div className={`avatar candidate-avatar ${p.tone}`}>{p.initials}</div>
                            <div className="candidate-main">
                              <div className="candidate-name">
                                <h3>{p.name}</h3>
                                {passedCandidates.includes(p.name) ? (
                                  <span className="verified-pill" style={{ background: '#eaf4e6', color: '#275823', border: '1px solid #c9dec2' }}>
                                    <ShieldCheck size={11} /> REVIEWER PASSED · READY FOR INTERVIEW
                                  </span>
                                ) : (
                                  <span className="status-pill" style={{ color: '#88754b', background: '#fdf7eb' }}>
                                    <Clock3 size={11} /> AWAITING REVIEWER AUDIT
                                  </span>
                                )}
                                <button
                                  className="save-button"
                                  onClick={() => {
                                    if (isSaved) {
                                      setSavedCandidates(prev => prev.filter(c => c !== p.name));
                                      notify(`${p.name} removed from shortlist`);
                                    } else {
                                      setSavedCandidates(prev => [...prev, p.name]);
                                      notify(`${p.name} saved to shortlist`);
                                    }
                                  }}
                                >
                                  {isSaved ? <><Check size={13} style={{ color: '#3d6c35' }} /> Saved</> : <><Plus size={14} /> Save</>}
                                </button>
                              </div>
                              <p>{p.role}</p>
                              <div className="tag-row">
                                {p.skills.map(s => <span className="evidence-skill-tag" key={s}><ShieldCheck size={10} />{s} · verified</span>)}
                                {p.tools.map(s => <span className="tool-tag" key={s}><Terminal size={10} />{s} · claimed</span>)}
                              </div>
                              <div className="candidate-bottom">
                                <span><b>{p.findings}</b> verified findings</span>
                                <span>{p.accuracy}% finding accuracy</span>
                                <span>{p.labsVerified} verified labs</span>
                                <span>{p.defense}% defense</span>
                              </div>
                            </div>
                            <div className="candidate-score">
                              <strong>{p.score}</strong>
                              <span>CAPABILITY</span>
                              <div><ShieldCheck size={12} />{p.confidence}% proof</div>
                            </div>
                            <div className="candidate-actions">
                              <button className="button secondary" onClick={() => { setLab(p.name); setModal('profile'); }}>View Security Proof <ArrowRight size={14} /></button>
                              <button
                                className="invite-button"
                                onClick={() => {
                                  setLab(p.name);
                                  setInviteCandidate(p.name);
                                  setInviteForm((prev) => ({ ...prev, role: p.role }));
                                  setModal('invite');
                                }}
                              >
                                <BriefcaseBusiness size={14} />Invite
                              </button>
                            </div>
                            <div className="match-reason"><Check size={12} />Matched: {requiredSkill} capability {p.dna[requiredSkill]}, {p.confidence}% proof confidence, {p.accuracy}% finding accuracy.</div>
                          </div>
                        );
                      })}
                    <p className="demo-footnote"><Shield size={13} /> Synthetic profiles · match reasons derive from the displayed verified evidence dimensions.</p>
                  </div>
                </div>
              )}

              {/* ── 3. Security Profiles (Directory) ── */}
              {page === 'Security Profiles' && (
                <div className="rec-profile-grid">
                  {people.map((p) => (
                    <div className="rec-profile-card" key={p.name}>
                        <div className="rec-profile-top">
                          <div className={`avatar candidate-avatar ${p.tone}`} style={{ height: 42, width: 42, fontSize: 13 }}>
                            {p.initials}
                          </div>
                          <div className="rec-profile-info">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h3>{p.name}</h3>
                              <span className="verified-pill"><ShieldCheck size={11} /> {p.score} DNA</span>
                            </div>
                            <p>{p.role}</p>
                          </div>
                        </div>

                        <div className="rec-dna-chip-row">
                          {Object.entries(p.dna).map(([skill, val]) => (
                            <span className="rec-dna-chip" key={skill}>
                              {skill}: <b>{val}</b>
                            </span>
                          ))}
                        </div>

                        <div className="candidate-bottom" style={{ borderTop: '1px solid #f0f3eb', paddingTop: 8 }}>
                          <span><b>{p.findings}</b> findings</span>
                          <span><b>{p.accuracy}%</b> accuracy</span>
                          <span><b>{p.defense}%</b> defense</span>
                        </div>

                        <div style={{ display: 'flex', gap: 7, marginTop: 'auto', paddingTop: 4 }}>
                          <button
                            className={`button small-button ${savedCandidates.includes(p.name) ? 'primary' : 'secondary'}`}
                            onClick={() => {
                              if (savedCandidates.includes(p.name)) {
                                setSavedCandidates(prev => prev.filter(c => c !== p.name));
                                notify(`${p.name} removed from shortlist`);
                              } else {
                                setSavedCandidates(prev => [...prev, p.name]);
                                notify(`${p.name} saved to shortlist!`);
                              }
                            }}
                            title={savedCandidates.includes(p.name) ? "Remove from shortlist" : "Save candidate to shortlist"}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            {savedCandidates.includes(p.name) ? <><BookmarkCheck size={12} /> Saved</> : <><Bookmark size={12} /> Save</>}
                          </button>
                          <button
                            className="button secondary small-button"
                            style={{ flex: 1 }}
                            onClick={() => {
                              setLab(p.name);
                              setModal('profile');
                            }}
                          >
                            <FileCheck2 size={12} /> Security Dossier
                          </button>
                          <button
                            className="button primary small-button"
                            onClick={() => {
                              setLab(p.name);
                              setInviteCandidate(p.name);
                              setInviteForm((prev) => ({ ...prev, role: p.role }));
                              setModal('invite');
                            }}
                          >
                            <BriefcaseBusiness size={12} /> Interview
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* ── 4. Saved Candidates (Shortlist) ── */}
              {page === 'Saved Candidates' && (
                (() => {
                  const savedPeople = people.filter((p) => savedCandidates.includes(p.name));
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {savedPeople.length === 0 ? (
                        <div className="objective-box" style={{ textAlign: 'center', padding: '30px 15px' }}>
                          <Award size={20} style={{ color: '#688c5a', margin: '0 auto 8px', display: 'block' }} />
                          <strong>NO SAVED CANDIDATES IN SHORTLIST</strong>
                          <p>Browse candidates in the talent engine and click "Save" to build your active interview pipeline.</p>
                          <button
                            className="button primary small-button"
                            style={{ marginTop: 12 }}
                            onClick={() => doNav('Find Security Talent')}
                          >
                            <Search size={13} /> Find Security Talent
                          </button>
                        </div>
                      ) : (
                        <div className="rec-saved-list">
                          {savedPeople.map((p) => (
                            <div className="rec-saved-card" key={p.name}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div className={`avatar candidate-avatar ${p.tone}`} style={{ height: 40, width: 40, fontSize: 12 }}>
                                  {p.initials}
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <strong style={{ fontSize: 13 }}>{p.name}</strong>
                                    <span className="verified-pill"><ShieldCheck size={11} /> {p.score} DNA</span>
                                  </div>
                                  <p style={{ margin: '2px 0 0', fontSize: 10, color: '#7a8475' }}>
                                    {p.role} · {p.findings} verified findings · {p.accuracy}% accuracy
                                  </p>
                                </div>
                              </div>

                              <div className="rec-saved-actions">
                                <button
                                  className="button secondary small-button"
                                  onClick={() => {
                                    setLab(p.name);
                                    setModal('profile');
                                  }}
                                >
                                  View Proof
                                </button>
                                <button
                                  className="button primary small-button"
                                  onClick={() => {
                                    setLab(p.name);
                                    setInviteCandidate(p.name);
                                    setInviteForm((prev) => ({ ...prev, role: p.role }));
                                    setModal('invite');
                                  }}
                                >
                                  <BriefcaseBusiness size={12} /> Schedule Screen
                                </button>
                                <button
                                  className="qb-action-btn delete"
                                  onClick={() => {
                                    setSavedCandidates((prev) => prev.filter((c) => c !== p.name));
                                    notify(`${p.name} removed from saved shortlist`);
                                  }}
                                  title="Remove from shortlist"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()
              )}

              {/* ── 5. Interviews Console ── */}
              {page === 'Interviews' && (
                <div className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>Technical interview schedule &amp; invitations</h2>
                      <p>Track candidate interview responses, technical defense meetings, and virtual rooms.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {interviews.length > 0 && (
                        <button
                          className="button secondary small-button"
                          onClick={() => {
                            setInterviews([]);
                            notify('All scheduled interview entries have been cleared');
                          }}
                          title="Clear all scheduled interviews"
                        >
                          <Trash2 size={12} /> Clear Entries
                        </button>
                      )}
                      <button
                        className="button secondary small-button"
                        style={{ color: '#9a4c1e', fontWeight: 600 }}
                        onClick={() => void resetDemoState()}
                        title="Completely reset all candidate, reviewer, and recruiter demo data to fresh initial state"
                      >
                        <RotateCcw size={12} /> Reset Defaults &amp; All Roles
                      </button>
                      <button
                        className="button primary small-button"
                        onClick={() => {
                          const target = inviteCandidate || lab || people[0]?.name || '';
                          setLab(target);
                          setInviteCandidate(target);
                          const matched = people.find((p) => p.name === target);
                          if (matched) {
                            setInviteForm((prev) => ({ ...prev, role: matched.role }));
                          }
                          setModal('invite');
                        }}
                      >
                        <Plus size={13} /> Invite Candidate
                      </button>
                    </div>
                  </div>

                  <div className="rec-interview-list" style={{ marginTop: 12 }}>
                    {interviews.map((item) => {
                      const isOffline = item.mode === 'offline';
                      return (
                        <div className="rec-interview-item" key={item.id}>
                          <div className="rec-interview-info">
                            <div className="rec-interview-date">{item.date}</div>
                            <div className="rec-interview-meta">
                              <strong style={{ fontSize: 12 }}>{item.candidate}</strong>
                              <p>{item.role} · {item.type} ({item.time})</p>
                              {isOffline ? (
                                <span style={{ fontSize: 10, color: '#7a5116', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                  <MapPin size={10} /> Venue: {item.venue || 'ProofForge Cyber HQ'}
                                </span>
                              ) : (
                                <span style={{ fontSize: 10, color: '#2b5f3a', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                  <ExternalLink size={10} /> Zoom Room: {item.zoomUrl}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="verified-pill">{isOffline ? 'OFFLINE / ON-SITE' : item.status}</span>
                            {isOffline ? (
                              <button
                                className="button secondary small-button"
                                onClick={() => {
                                  window.open(`https://maps.google.com/?q=${encodeURIComponent(item.venue || 'Bengaluru Tech Park')}`, '_blank', 'noopener,noreferrer');
                                  notify(`Opening venue location for ${item.candidate}...`);
                                }}
                                title="View In-Person Venue Map"
                              >
                                <MapPin size={12} /> Venue Map
                              </button>
                            ) : (
                              <button
                                className="button primary small-button"
                                onClick={() => {
                                  window.open(item.zoomUrl || 'https://us05web.zoom.us/myhome', '_blank', 'noopener,noreferrer');
                                  notify(`Opening Zoom Room for ${item.candidate}...`);
                                }}
                                title="Join Zoom Meeting Room"
                              >
                                <Video size={12} /> Join Room
                              </button>
                            )}
                            <button
                              className="qb-action-btn delete"
                              onClick={() => {
                                setInterviews((prev) => prev.filter((i) => i.id !== item.id));
                                notify(`Interview for ${item.candidate} cancelled`);
                              }}
                              title="Cancel interview"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* ── Toast ── */}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <Check size={15} />{toast}
        </div>
      )}

      {/* ── Modals ── */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal('')}>
          <div
            className={`modal ${
              modalSize === 'fullscreen'
                ? 'modal-fullscreen'
                : modalSize === 'standard'
                ? 'modal-standard'
                : 'modal-wide'
            }`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <span className="eyebrow">
                  {modal === 'lab'
                    ? 'AUTHORIZED TRAINING ENVIRONMENT'
                    : modal === 'inspect-lab'
                    ? 'CONTAINER TELEMETRY & NETWORK INSPECTOR'
                    : modal === 'assessment'
                    ? assessmentSubmitted
                      ? 'VERIFIED EVALUATION REPORT'
                      : 'SERVER-SCORED ASSESSMENT · 20 MIN LIMIT'
                    : modal === 'review'
                    ? 'REVIEWER RUBRIC CONSOLE'
                    : modal === 'review-assessment'
                    ? 'CANDIDATE ASSESSMENT EVALUATION & FINALIZER'
                    : modal === 'add-qb'
                    ? 'QUESTION BANK AUTHORING'
                    : modal === 'edit-qb'
                    ? 'QUESTION BANK EDITOR'
                    : modal === 'provision-lab'
                    ? 'LAB CONTAINER ORCHESTRATION'
                    : modal === 'defense'
                    ? 'CANDIDATE TECHNICAL DEFENSE'
                    : modal === 'invite'
                    ? 'INTERVIEW INVITATION'
                    : modal === 'topic'
                    ? 'FIELD NOTES & REVISION'
                    : 'PROOF RECORD'}
                </span>
                <h2>
                  {modal === 'lab'
                    ? lab
                    : modal === 'inspect-lab'
                    ? `${lab || 'Lab Target'} · Live Telemetry & Console`
                    : modal === 'assessment'
                    ? assessmentSubmitted
                      ? 'Security Assessment Score Report'
                      : `Section 0${ALL_ASSESSMENT_QUESTIONS[currentQIndex]?.sectionIndex + 1}: ${ALL_ASSESSMENT_QUESTIONS[currentQIndex]?.section}`
                    : modal === 'review'
                    ? 'Finding review & rubric scoring'
                    : modal === 'review-assessment'
                    ? 'Ananya Rao · Assessment Verification'
                    : modal === 'add-qb'
                    ? 'Add new assessment question'
                    : modal === 'edit-qb'
                    ? `Edit Question #${editingQuestion?.id || ''}`
                    : modal === 'provision-lab'
                    ? 'Provision new lab container'
                    : modal === 'defense'
                    ? 'Explain your finding'
                    : modal === 'invite'
                    ? `Invite ${lab}`
                    : modal === 'topic'
                    ? lab
                    : modal === 'profile'
                    ? `${lab} · verified profile`
                    : modal === 'finding'
                    ? 'Record Lab Security Finding'
                    : modal === 'review-document'
                    ? 'Review Candidate Document & Security Report'
                    : lab}
                </h2>
              </div>
              <div className="modal-head-actions">
                <button
                  className="modal-size-toggle"
                  onClick={() =>
                    setModalSize((prev) =>
                      prev === 'fullscreen' ? 'wide' : 'fullscreen'
                    )
                  }
                  title={
                    modalSize === 'fullscreen'
                      ? 'Switch to Compact / Wide view'
                      : 'Switch to Fullscreen / Expanded view'
                  }
                  aria-label="Toggle modal size"
                >
                  {modalSize === 'fullscreen' ? (
                    <>
                      <Minimize2 size={12} />
                      <span>Compact</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 size={12} />
                      <span>Expand</span>
                    </>
                  )}
                </button>
                <button
                  className="icon-button"
                  onClick={() => setModal('')}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {modal === 'lab' ? (
              <>
                <div className="banner compact">
                  <div className="banner-icon"><ShieldCheck size={17} /></div>
                  <div><strong>AUTHORIZED LAB ONLY</strong><p>Target: isolated ProofForge training container. Resettable at any time.</p></div>
                </div>
                <p className="modal-copy">Investigate the assigned application, validate a security weakness with reproducible evidence, then explain its impact and remediation. Keep all activity inside this lab.</p>
                <div className="objective-box">
                  <strong>YOUR DELIVERABLE</strong>
                  <p>Finding description · request/response evidence · reproduction steps · remediation</p>
                </div>
                <div className="modal-actions">
                  <button className="button secondary" onClick={() => notify('Lab reset to clean state')}><Activity size={14} />Reset lab</button>
                  <button className="button primary" onClick={() => { setModal('finding'); notify('Isolated lab started — synthetic target ready'); }}><Play size={14} />Start lab</button>
                </div>
              </>
            ) : modal === 'finding' ? (
              <>
                <div className="banner compact">
                  <div className="banner-icon"><FlaskConical size={17} /></div>
                  <div><strong>RECORD LAB SECURITY FINDING</strong><p>Record reproduction steps, affected component, and evidence from your authorized lab environment.</p></div>
                </div>

                <div className="form-grid">
                  <label>Finding Title
                    <input
                      value={findingForm.title}
                      onChange={(e) => setFindingForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Broken Object Level Authorization (BOLA)"
                    />
                  </label>
                  <label>Severity
                    <select
                      value={findingForm.severity}
                      onChange={(e) => setFindingForm((prev) => ({ ...prev, severity: e.target.value as any }))}
                    >
                      <option>Critical</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                      <option>Informational</option>
                    </select>
                  </label>
                  <label>Target Security Lab
                    <select
                      value={findingForm.lab}
                      onChange={(e) => setFindingForm((prev) => ({ ...prev, lab: e.target.value }))}
                    >
                      <option>API Authorization Lab</option>
                      <option>Broken Authentication Lab</option>
                      <option>Reflected XSS Lab</option>
                      <option>SQL Injection Lab</option>
                      <option>General Security Assessment</option>
                    </select>
                  </label>
                  <label>Affected Component / Endpoint
                    <input
                      value={findingForm.component}
                      onChange={(e) => setFindingForm((prev) => ({ ...prev, component: e.target.value }))}
                      placeholder="e.g. GET /api/v1/users/{id}/profile"
                    />
                  </label>
                  <label className="span-two">Executive Summary &amp; Description
                    <textarea
                      value={findingForm.description}
                      onChange={(e) => setFindingForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="What did you observe? Describe the security behavior and affected assets."
                    />
                  </label>
                  <label className="span-two">Evidence &amp; Reproduction Steps
                    <textarea
                      value={findingForm.evidence}
                      onChange={(e) => setFindingForm((prev) => ({ ...prev, evidence: e.target.value }))}
                      placeholder="Sanitized request/response payloads, steps to reproduce..."
                    />
                  </label>
                  <label className="span-two">Business Impact &amp; Remediation Guidance
                    <textarea
                      value={findingForm.recommendation}
                      onChange={(e) => setFindingForm((prev) => ({ ...prev, recommendation: e.target.value }))}
                      placeholder="Who is affected? What server-side fix and defensive controls do you recommend?"
                    />
                  </label>
                </div>

                <div className="objective-box" style={{ marginTop: 12 }}>
                  <strong>REVIEWER AUDIT PIPELINE</strong>
                  <p>When submitted, your technical lab finding and reproduction chain are immediately sent to the Reviewer Panel for expert verification and scoring.</p>
                </div>

                <div className="modal-actions">
                  <button className="button secondary" onClick={() => setModal('')}>Cancel</button>
                  <button
                    className="button primary"
                    onClick={() => void handleCandidateSubmitFinding()}
                  >
                    <FileCheck2 size={14} /> Submit Lab Finding to Reviewer
                  </button>
                </div>
              </>
            ) : modal === 'assessment' ? (
              assessmentSubmitted ? (
                (() => {
                  const scoreData = calculateAssessmentScores();
                  const percent = Math.round((scoreData.totalCorrect / scoreData.total) * 100);
                  const timeUsed = formatTime(1200 - assessmentTimeLeft);
                  return (
                    <div className="result-box">
                      <div className="result-score-circle">
                        <strong>{scoreData.totalCorrect} / {scoreData.total}</strong>
                        <small>{percent}% SCORE</small>
                      </div>
                      <div>
                        <span className="verified-pill"><ShieldCheck size={12} /> {assessmentSyncStatus === 'verified' ? 'SERVER VERIFIED SCORE' : assessmentSyncStatus === 'local' ? 'LOCAL ONLY · NOT VERIFIED' : 'SCORE STATUS UNAVAILABLE'}</span>
                        <h3 style={{ margin: '6px 0 2px', font: '600 16px Manrope' }}>Assessment Completed</h3>
                        <p style={{ margin: 0, fontSize: 11, color: '#778073' }}>
                          Completed in {timeUsed} · 40 questions across 4 technical domains
                        </p>
                      </div>

                      <div className="result-grid">
                        {ASSESSMENT_SECTIONS.map((sec, idx) => {
                          const secScore = scoreData.sectionMap[sec] || { correct: 0, total: 10 };
                          const secPct = secScore.correct * 10;
                          return (
                            <div className="result-card" key={sec}>
                              <span style={{ font: '600 8px "DM Mono"', color: '#828e7e', letterSpacing: '.4px' }}>
                                SECTION 0{idx + 1}
                              </span>
                              <div className="result-card-sec">{sec}</div>
                              <div className="result-card-score">
                                <span>{secScore.correct} / {secScore.total} correct</span>
                                <b>{secPct}%</b>
                              </div>
                              <div className="progress" style={{ height: 4, marginTop: 4 }}>
                                <span style={{ width: `${secPct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="objective-box" style={{ textAlign: 'left' }}>
                        <strong>PROFILE INTEGRATION</strong>
                        <p>
                          Your assessment performance is deterministic and factored directly into your Security DNA capability fingerprint for recruiter and reviewer verification.
                        </p>
                      </div>

                      <div className="modal-actions" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#985743', fontSize: 12, fontWeight: 600, background: '#fdf2ed', padding: '6px 12px', borderRadius: 6, border: '1px solid #fed7c7' }}>
                          <LockKeyhole size={14} /> Single Attempt Policy: Once an assessment ends, you cannot retake it or go back.
                        </div>
                        <button
                          className="button primary"
                          onClick={() => {
                            setModal('');
                            notify('Assessment score report saved to profile');
                          }}
                        >
                          <Check size={14} /> Return to dashboard
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const currentQ = ALL_ASSESSMENT_QUESTIONS[currentQIndex] || ALL_ASSESSMENT_QUESTIONS[0];
                  const answeredCount = Object.keys(selectedAnswers).length;
                  const isWarning = assessmentTimeLeft < 120; // under 2 minutes
                  return (
                    <div className="assessment-container">
                      <div className="assessment-topbar">
                        <div className="assessment-section-info">
                          <span className="assessment-sec-badge">
                            SECTION 0{currentQ.sectionIndex + 1} OF 04 · {currentQ.section.toUpperCase()}
                          </span>
                          <span className="assessment-q-badge">
                            QUESTION {currentQ.id} OF 40 (Q{currentQ.questionIndexInSection}/10)
                          </span>
                        </div>
                        <div
                          className={`assessment-timer ${isWarning ? 'warning' : ''}`}
                          title="Total remaining time for all 40 questions (Continuous real-time timer · does not stop if closed)"
                        >
                          <Clock3 size={13} />
                          <span>{formatTime(assessmentTimeLeft)}</span>
                          <span style={{ fontSize: 9.5, opacity: 0.85, fontWeight: 600, marginLeft: 4 }}>• NON-STOP</span>
                        </div>
                      </div>

                      <div className="assessment-palette" aria-label="Question Navigation Palette">
                        {ALL_ASSESSMENT_QUESTIONS.map((q, idx) => {
                          const isAnswered = selectedAnswers[q.id] !== undefined;
                          const isActive = idx === currentQIndex;
                          return (
                            <button
                              key={q.id}
                              className={`palette-btn ${isActive ? 'active' : ''} ${isAnswered ? 'answered' : ''}`}
                              onClick={() => {
                                setCurrentQIndex(idx);
                                try {
                                  saveAssessmentProgress(auth?.email, 'qIndex', String(idx));
                                } catch {}
                              }}
                              title={`Question ${q.id}: ${q.section}`}
                            >
                              {q.id}
                            </button>
                          );
                        })}
                      </div>

                      <div className="progress" style={{ height: 4 }}>
                        <span style={{ width: `${(answeredCount / 40) * 100}%` }} />
                      </div>

                      <p className="question-text">{currentQ.question}</p>

                      <div className="answer-list">
                        {currentQ.options.map((opt, i) => {
                          const isSelected = selectedAnswers[currentQ.id] === i;
                          return (
                            <button
                              key={i}
                              className={`answer ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                const updated = { ...selectedAnswers, [currentQ.id]: i };
                                setSelectedAnswers(updated);
                                try {
                                  saveAssessmentProgress(auth?.email, 'answers', JSON.stringify(updated));
                                } catch {}
                                notify(`Option ${String.fromCharCode(65 + i)} recorded for Question ${currentQ.id}`);
                              }}
                            >
                              <span>{String.fromCharCode(65 + i)}</span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      <div className="assessment-nav-bar">
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="button secondary"
                            disabled={currentQIndex === 0}
                            onClick={() => {
                              const prevIdx = Math.max(0, currentQIndex - 1);
                              setCurrentQIndex(prevIdx);
                              try {
                                saveAssessmentProgress(auth?.email, 'qIndex', String(prevIdx));
                              } catch {}
                            }}
                          >
                            <ArrowLeft size={14} /> Previous
                          </button>
                          <button
                            className="button secondary"
                            onClick={() => {
                              setModal('');
                              notify(`Progress saved — ${answeredCount} of 40 questions answered (${formatTime(assessmentTimeLeft)} left)`);
                            }}
                          >
                            Save and exit
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          {currentQIndex < ALL_ASSESSMENT_QUESTIONS.length - 1 ? (
                            <button
                              className="button primary"
                              onClick={() => {
                                const nextIdx = Math.min(ALL_ASSESSMENT_QUESTIONS.length - 1, currentQIndex + 1);
                                setCurrentQIndex(nextIdx);
                                try {
                                  saveAssessmentProgress(auth?.email, 'qIndex', String(nextIdx));
                                } catch {}
                              }}
                            >
                              Next question <ArrowRight size={14} />
                            </button>
                          ) : (
                            <button
                              className="button primary"
                              onClick={() => void submitAssessment(false)}
                              disabled={assessmentSaving}
                            >
                              <ShieldCheck size={14} /> {assessmentSaving ? 'Scoring…' : 'Submit assessment'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )
            ) : modal === 'defense' ? (
              <>
                <p className="modal-copy">Answer from your own lab work. The reviewer will score technical understanding; this response is part of the finding proof chain.</p>
                <div className="defense-form">
                  {['Why did you suspect this vulnerability?', 'What evidence proves it?', 'Why is the severity appropriate?', 'What is the potential impact?', 'How would you remediate it?'].map((question, i) => (
                    <label key={question}><span>{String(i + 1).padStart(2, '0')} · {question}</span><textarea value={defenseAnswers[i]} onChange={e => setDefenseAnswers(prev => prev.map((answer, index) => index === i ? e.target.value : answer))} placeholder="Explain your reasoning in your own words..." /></label>
                  ))}
                </div>
                <div className="modal-actions">
                  <button className="button secondary" onClick={() => setModal('')}>Save and return</button>
                  <button className="button primary" onClick={() => defenseAnswers.some(answer => answer.trim().length < 12) ? notify('Answer all five questions with enough detail') : (setDefenseSent(true), setModal(''), notify('Technical defense submitted to your reviewer'))}><FileCheck2 size={14} />Submit defense</button>
                </div>
              </>
            ) : modal === 'review' ? (
              (() => {
                const criteriaConfig = [
                  { key: 'Reconnaissance', label: 'Reconnaissance & Asset Mapping', max: 10, hint: 'Port discovery, endpoint mapping, target boundary' },
                  { key: 'Vulnerability finding', label: 'Vulnerability Identification & Scope', max: 25, hint: 'Accurate classification, severity reasoning, root cause' },
                  { key: 'Validation', label: 'Reproduction & Exploit Validation', max: 20, hint: 'Step-by-step reproducible proof without false positives' },
                  { key: 'Evidence', label: 'Evidence Quality & Sanitization', max: 15, hint: 'Sanitized HTTP request/response, token masking' },
                  { key: 'Impact analysis', label: 'Impact & Threat Modeling', max: 10, hint: 'Cross-account data leakage, business consequence' },
                  { key: 'Remediation', label: 'Remediation & Defense Architecture', max: 10, hint: 'Server-side authorization check, least privilege' },
                  { key: 'Report quality', label: 'Report Quality & Documentation', max: 10, hint: 'Defensive clarity, executive summary, remediation guide' },
                ];
                const liveTotalScore = Object.values(rubricScores).reduce((a, b) => a + b, 0);

                return (
                  <>
                    <div className="review-summary">
                      <div className="avatar peach">AR</div>
                      <div>
                        <strong>Ananya Rao</strong>
                        <p>API Authorization Lab · submitted 2 hours ago</p>
                      </div>
                      <span className="status-pill">AWAITING REVIEW</span>
                    </div>

                    <div className="objective-box">
                      <strong>FINDING · HIGH · BROKEN ACCESS CONTROL (BOLA)</strong>
                      <p>Candidate supplied sanitized request/response evidence, reproduction steps and server-side authorization recommendation.</p>
                    </div>

                    <div className="ai-card">
                      <div><Sparkles size={15} /><strong>AI REVIEW ASSISTANT · ADVISORY</strong></div>
                      <p>Strong reproduction and relevant evidence. Severity appears reasonable for cross-account data access. Candidate correctly demonstrated IDOR authorization flaw.</p>
                      <span>Suggested score: 87 / 100 · Confidence: 82%</span>
                    </div>

                    {/* Candidate Defense Q&A */}
                    <div className="defense-review">
                      <div className="defense-review-head">
                        <Fingerprint size={16} />
                        <strong>TECHNICAL UNDERSTANDING / DEFENSE</strong>
                        <span>{defenseEvaluated ? 'SCORED' : defenseSent ? 'ANSWER RECEIVED' : defenseAsked ? 'AWAITING CANDIDATE' : 'NOT REQUESTED'}</span>
                      </div>
                      {defenseSent ? (
                        <div className="defense-responses">
                          {['Why did you suspect this vulnerability?', 'What evidence proves it?', 'Why is the severity appropriate?', 'What is the potential impact?', 'How would you remediate it?'].map((question, i) => (
                            <div key={question}>
                              <b>{question}</b>
                              <p>{defenseAnswers[i]}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="modal-copy">Ask the candidate to explain their own reasoning before final verification.</p>
                      )}
                      {defenseSent && (
                        <label className="score-label">
                          REVIEWER DEFENSE SCORE
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={defenseScore}
                            onChange={(e) => setDefenseScore(Math.max(0, Math.min(100, Number(e.target.value))))}
                          />
                        </label>
                      )}
                      {defenseEvaluated && (
                        <p className="defense-score-result">
                          <Check size={14} />Human reviewer score: {defenseScore} / 100 · included in Security DNA
                        </p>
                      )}
                    </div>

                    {/* Interactive 7-Criteria Rubric Scoring */}
                    <div className="rubric-interactive">
                      <div className="rubric-interactive-head">
                        <span>DETAILED EVALUATION RUBRIC (7 SECTION BREAKDOWN)</span>
                        <span>LIVE POINTS ALLOCATED</span>
                      </div>

                      {criteriaConfig.map((crit) => {
                        const currentVal = rubricScores[crit.key] ?? 0;
                        return (
                          <div className="rubric-row-item" key={crit.key}>
                            <div className="rubric-row-info">
                              <strong>{crit.label}</strong>
                              <small>{crit.hint}</small>
                            </div>

                            <div className="rubric-score-control">
                              <input
                                type="range"
                                min="0"
                                max={crit.max}
                                value={currentVal}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setRubricScores((prev) => ({ ...prev, [crit.key]: val }));
                                }}
                              />
                              <input
                                type="number"
                                min="0"
                                max={crit.max}
                                value={currentVal}
                                onChange={(e) => {
                                  const val = Math.max(0, Math.min(crit.max, Number(e.target.value) || 0));
                                  setRubricScores((prev) => ({ ...prev, [crit.key]: val }));
                                }}
                                style={{ width: 44, padding: '3px 5px', fontSize: 11, textAlign: 'center', border: '1px solid #d5dbce', borderRadius: 4 }}
                              />
                              <span className="rubric-score-badge">/ {crit.max}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="rubric-total-box">
                      <div>
                        <strong>TOTAL WEIGHTED REVIEWER SCORE</strong>
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: '#687763' }}>Calculated dynamically from 7 evaluated rubric criteria</p>
                      </div>
                      <div className="rubric-total-value">{liveTotalScore} / 100</div>
                    </div>

                    <div className="modal-actions">
                      {!defenseAsked ? (
                        <button
                          className="button secondary"
                          onClick={() => {
                            setDefenseAsked(true);
                            notify('Five technical defense questions sent to Ananya');
                          }}
                        >
                          Request technical defense
                        </button>
                      ) : !defenseSent ? (
                        <span className="status-pill">AWAITING CANDIDATE</span>
                      ) : !defenseEvaluated ? (
                        <button
                          className="button secondary"
                          onClick={() => {
                            setDefenseEvaluated(true);
                            notify(`Defense evaluated — reviewer score ${defenseScore} saved`);
                          }}
                        >
                          Save defense score
                        </button>
                      ) : (
                        <span className="verified-pill"><Check size={13} />DEFENSE SCORED</span>
                      )}

                      <button
                        className="button primary"
                        onClick={() => {
                          setVerified(true);
                          void updateCandidateApproval('Ananya Rao', true);
                          setModal('');
                          notify(`Finding verified (${liveTotalScore}/100) — Ananya Rao examined and passed to Recruiter pipeline!`);
                        }}
                      >
                        <ShieldCheck size={14} /> Verify &amp; Pass Candidate to Recruiter ({liveTotalScore}/100)
                      </button>
                    </div>
                    <p className="muted-note">Reviewer has final authority · AI suggestions do not affect ranking until verified.</p>
                  </>
                );
              })()
            ) : modal === 'review-document' && reviewingDoc ? (
              <>
                <div className="review-summary" style={{ marginBottom: 12 }}>
                  <div className={`avatar ${reviewingDoc.candidateName.includes('Ananya') ? 'peach' : 'blue'}`}>
                    {reviewingDoc.candidateName.split(' ').map((x) => x[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong>{reviewingDoc.candidateName}</strong>
                      <span className="demo-chip" style={{ fontSize: 9 }}>Candidate</span>
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#687564' }}>
                      {reviewingDoc.lab} · Uploaded {reviewingDoc.submittedAt}
                    </p>
                  </div>
                  <span className={`severity ${reviewingDoc.severity.toLowerCase()}`}>
                    {reviewingDoc.severity}
                  </span>
                </div>

                <div className="objective-box">
                  <strong>REPORT: {reviewingDoc.title}</strong>
                  <p>{reviewingDoc.description || 'Candidate provided sanitized technical documentation and vulnerability reproduction steps.'}</p>
                </div>

                {reviewingDoc.fileName && (
                  <div className="doc-attached-card" style={{ margin: '10px 0 14px' }}>
                    <div className="doc-attached-info">
                      <span className={`doc-type-badge ${reviewingDoc.fileType || 'pdf'}`}>
                        {reviewingDoc.fileType?.toUpperCase() || 'PDF'}
                      </span>
                      <div>
                        <strong style={{ fontSize: 12, color: '#243422' }}>{reviewingDoc.fileName}</strong>
                        <span style={{ fontSize: 10, color: '#7a8677' }}>{reviewingDoc.fileSize} · Ready for review</span>
                      </div>
                    </div>
                    <button
                      className="button secondary small-button"
                      onClick={() => downloadDocumentFile(reviewingDoc.fileName!, reviewingDoc.fileData || '')}
                    >
                      <Download size={12} /> Download / View Document
                    </button>
                  </div>
                )}

                <div className="form-grid" style={{ marginTop: 8 }}>
                  <label className="span-two">
                    Reviewer Rubric Score (0 – 100)
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={docReviewScore}
                        onChange={(e) => setDocReviewScore(parseInt(e.target.value, 10))}
                        style={{ flex: 1 }}
                      />
                      <span style={{ font: '700 16px "DM Mono"', minWidth: 50, color: '#274b24' }}>
                        {docReviewScore} / 100
                      </span>
                    </div>
                  </label>

                  <label className="span-two">
                    Review Decision
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button
                        type="button"
                        className={`button ${docReviewDecision === 'verified' ? 'primary' : 'secondary'}`}
                        style={{ flex: 1, fontSize: 11 }}
                        onClick={() => setDocReviewDecision('verified')}
                      >
                        <ShieldCheck size={13} /> Verified &amp; Approved
                      </button>
                      <button
                        type="button"
                        className={`button ${docReviewDecision === 'needs_changes' ? 'primary' : 'secondary'}`}
                        style={{ flex: 1, fontSize: 11, background: docReviewDecision === 'needs_changes' ? '#b27524' : undefined }}
                        onClick={() => setDocReviewDecision('needs_changes')}
                      >
                        Needs Revisions
                      </button>
                      <button
                        type="button"
                        className={`button ${docReviewDecision === 'rejected' ? 'primary' : 'secondary'}`}
                        style={{ flex: 1, fontSize: 11, background: docReviewDecision === 'rejected' ? '#a53625' : undefined }}
                        onClick={() => setDocReviewDecision('rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  </label>

                  <label className="span-two">
                    Reviewer Audit Notes &amp; Feedback
                    <textarea
                      value={docReviewFeedback}
                      onChange={(e) => setDocReviewFeedback(e.target.value)}
                      placeholder="Detail your findings audit, evidence validation, and guidance for candidate capability record..."
                      rows={3}
                    />
                  </label>
                </div>

                <div className="modal-actions" style={{ marginTop: 14 }}>
                  <button className="button secondary" onClick={() => setModal('')}>Close</button>
                  <button
                    className="button primary"
                    onClick={() => void handleReviewerSubmitDocReview()}
                  >
                    <Check size={14} /> Submit Document Review &amp; Certify
                  </button>
                </div>
              </>
            ) : modal === 'review-assessment' ? (
              (() => {
                const baseScore = 36; // 36/40
                const adjustedScore = Math.max(0, Math.min(40, baseScore + assessmentReviewBonus));
                const percent = Math.round((adjustedScore / 40) * 100);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="review-summary">
                      <div className="avatar peach">AR</div>
                      <div>
                        <strong>Ananya Rao</strong>
                        <p>Timed 40-Question Technical Assessment · Auto-Scored 36 / 40 (90%)</p>
                      </div>
                      <span className="verified-pill"><ShieldCheck size={12} /> DETERMINISTIC LOGS VERIFIED</span>
                    </div>

                    <div className="objective-box">
                      <strong>AUTOMATED ASSESSMENT AUDIT SUMMARY</strong>
                      <p>Candidate completed all 40 questions in sequential order across 4 technical domains within the 20-minute server limit.</p>
                    </div>

                    <div className="rev-assess-grid">
                      <div className="rev-assess-card">
                        <div className="rev-assess-card-head">
                          <span>SECTION 01 · APTITUDE</span>
                          <span className="rev-assess-card-score">9 / 10 (90%)</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 10, color: '#768272' }}>Pattern sequence, network rate calculation, modular arithmetic</p>
                      </div>

                      <div className="rev-assess-card">
                        <div className="rev-assess-card-head">
                          <span>SECTION 02 · ENGLISH &amp; SECURITY COMM</span>
                          <span className="rev-assess-card-score">9 / 10 (90%)</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 10, color: '#768272' }}>Defensive remediation drafting, incident post-mortem clarity</p>
                      </div>

                      <div className="rev-assess-card">
                        <div className="rev-assess-card-head">
                          <span>SECTION 03 · CYBERSECURITY FUNDAMENTALS</span>
                          <span className="rev-assess-card-score">9 / 10 (90%)</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 10, color: '#768272' }}>OSI models, TCP 3-way handshake, CIDR subnetting, asymmetric crypto</p>
                      </div>

                      <div className="rev-assess-card">
                        <div className="rev-assess-card-head">
                          <span>SECTION 04 · ETHICAL HACKING &amp; PENTESTING</span>
                          <span className="rev-assess-card-score">9 / 10 (90%)</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 10, color: '#768272' }}>Nmap scanning, SQLi bypass, Burp Suite proxy workflows, privilege escalation</p>
                      </div>
                    </div>

                    <div className="form-grid">
                      <label>
                        REVIEWER SCORE ADJUSTMENT (BONUS / PENALTY)
                        <select
                          value={assessmentReviewBonus}
                          onChange={(e) => setAssessmentReviewBonus(Number(e.target.value))}
                        >
                          <option value={-2}>-2 Questions (Technical penalty)</option>
                          <option value={-1}>-1 Question (Minor deduction)</option>
                          <option value={0}>0 (Keep exact automated score 36/40 · 90%)</option>
                          <option value={1}>+1 Question (Methodology bonus)</option>
                          <option value={2}>+2 Questions (Exceptional speed bonus)</option>
                        </select>
                      </label>

                      <label>
                        FINAL CERTIFIED ASSESSMENT SCORE
                        <div style={{ font: '800 16px "DM Mono"', color: '#255021', padding: '7px 0' }}>
                          {adjustedScore} / 40 ({percent}%)
                        </div>
                      </label>

                      <label className="span-two">
                        REVIEWER CERTIFICATION FEEDBACK &amp; AUDIT NOTES
                        <textarea
                          value={assessmentReviewNotes}
                          onChange={(e) => setAssessmentReviewNotes(e.target.value)}
                          placeholder="Provide human reviewer remarks regarding candidate's assessment performance..."
                        />
                      </label>
                    </div>

                    <div className="modal-actions">
                      <button className="button secondary" onClick={() => setModal('')}>
                        Close
                      </button>
                      <button
                        className="button primary"
                        onClick={() => {
                          setAssessmentFinalized(true);
                          void updateCandidateApproval('Ananya Rao', true);
                          setModal('');
                          notify(`Assessment certified (${adjustedScore}/40 · ${percent}%) — Ananya Rao validated and passed to Recruiter pipeline!`);
                        }}
                      >
                        <ShieldCheck size={14} /> Certify &amp; Pass Candidate to Recruiter
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : modal === 'add-qb' || modal === 'edit-qb' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p className="modal-copy">
                  {modal === 'add-qb'
                    ? 'Author a new technical question with 4 options and a verified answer key.'
                    : 'Modify question text, answer options, and correct response index in the Question Bank.'}
                </p>

                <div className="form-grid">
                  <label>
                    TECHNICAL SECTION
                    <select
                      value={qbForm.section}
                      onChange={(e) => setQbForm({ ...qbForm, section: e.target.value })}
                    >
                      {ASSESSMENT_SECTIONS.map((sec) => (
                        <option key={sec} value={sec}>
                          {sec}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    CORRECT OPTION KEY
                    <select
                      value={qbForm.correctIndex}
                      onChange={(e) => setQbForm({ ...qbForm, correctIndex: Number(e.target.value) })}
                    >
                      <option value={0}>Option A is Correct</option>
                      <option value={1}>Option B is Correct</option>
                      <option value={2}>Option C is Correct</option>
                      <option value={3}>Option D is Correct</option>
                    </select>
                  </label>

                  <label className="span-two">
                    QUESTION PROMPT
                    <textarea
                      value={qbForm.question}
                      onChange={(e) => setQbForm({ ...qbForm, question: e.target.value })}
                      placeholder="e.g. Which Nmap command performs a TCP SYN Stealth scan?"
                      rows={3}
                    />
                  </label>

                  <label>
                    OPTION A
                    <input
                      value={qbForm.options[0]}
                      onChange={(e) => {
                        const newOpts = [...qbForm.options];
                        newOpts[0] = e.target.value;
                        setQbForm({ ...qbForm, options: newOpts });
                      }}
                      placeholder="Option A text..."
                    />
                  </label>

                  <label>
                    OPTION B
                    <input
                      value={qbForm.options[1]}
                      onChange={(e) => {
                        const newOpts = [...qbForm.options];
                        newOpts[1] = e.target.value;
                        setQbForm({ ...qbForm, options: newOpts });
                      }}
                      placeholder="Option B text..."
                    />
                  </label>

                  <label>
                    OPTION C
                    <input
                      value={qbForm.options[2]}
                      onChange={(e) => {
                        const newOpts = [...qbForm.options];
                        newOpts[2] = e.target.value;
                        setQbForm({ ...qbForm, options: newOpts });
                      }}
                      placeholder="Option C text..."
                    />
                  </label>

                  <label>
                    OPTION D
                    <input
                      value={qbForm.options[3]}
                      onChange={(e) => {
                        const newOpts = [...qbForm.options];
                        newOpts[3] = e.target.value;
                        setQbForm({ ...qbForm, options: newOpts });
                      }}
                      placeholder="Option D text..."
                    />
                  </label>
                </div>

                <div className="modal-actions">
                  <button className="button secondary" onClick={() => setModal('')}>
                    Cancel
                  </button>
                  <button
                    className="button primary"
                    onClick={() => {
                      if (!qbForm.question.trim() || qbForm.options.some((opt) => !opt.trim())) {
                        notify('Please fill in the question text and all 4 options');
                        return;
                      }

                      if (modal === 'edit-qb' && editingQuestion) {
                        setQbQuestions((prev) =>
                          prev.map((q) =>
                            q.id === editingQuestion.id
                              ? {
                                  ...q,
                                  section: qbForm.section,
                                  question: qbForm.question,
                                  options: [...qbForm.options],
                                  correctIndex: qbForm.correctIndex,
                                }
                              : q
                          )
                        );
                        notify(`Question #${editingQuestion.id} updated successfully`);
                      } else {
                        const newId = qbQuestions.reduce((max, q) => Math.max(max, q.id), 0) + 1;
                        const sectionIdx = ASSESSMENT_SECTIONS.indexOf(
                          qbForm.section as (typeof ASSESSMENT_SECTIONS)[number]
                        );
                        const countInSec = qbQuestions.filter((q) => q.section === qbForm.section).length;

                        const newQ: AssessmentQuestion = {
                          id: newId,
                          section: qbForm.section,
                          sectionIndex: sectionIdx >= 0 ? sectionIdx : 0,
                          questionIndexInSection: countInSec + 1,
                          question: qbForm.question,
                          options: [...qbForm.options],
                          correctIndex: qbForm.correctIndex,
                        };

                        setQbQuestions((prev) => [...prev, newQ]);
                        notify(`New question added to Question Bank (#${newId})`);
                      }
                      setModal('');
                    }}
                  >
                    <Check size={14} /> {modal === 'edit-qb' ? 'Save Changes' : 'Create Question'}
                  </button>
                </div>
              </div>
            ) : modal === 'provision-lab' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p className="modal-copy">
                  Deploy an isolated container with vulnerable synthetic target services and telemetry monitoring.
                </p>
                <div className="form-grid">
                  <label>
                    LAB TEMPLATE
                    <select defaultValue="API Authorization Lab (BOLA/IDOR)">
                      <option>API Authorization Lab (BOLA/IDOR)</option>
                      <option>Reflected Cross-Site Scripting Lab</option>
                      <option>SQL Injection &amp; Data Extraction Lab</option>
                      <option>Session Hijacking &amp; Fixation Lab</option>
                      <option>Network Reconnaissance &amp; Port Scan Lab</option>
                      <option>Cloud IAM Privilege Escalation Lab</option>
                    </select>
                  </label>
                  <label>
                    ISOLATION PROFILE
                    <select defaultValue="Strict Sandbox (No Egress)">
                      <option>Strict Sandbox (No Egress)</option>
                      <option>Audited Network (Synthetic Internet)</option>
                    </select>
                  </label>
                  <label>
                    CONTAINER CPU LIMIT
                    <select defaultValue="0.5 vCPU">
                      <option>0.25 vCPU</option>
                      <option>0.5 vCPU</option>
                      <option>1.0 vCPU</option>
                    </select>
                  </label>
                  <label>
                    MEMORY LIMIT
                    <select defaultValue="512 MB">
                      <option>256 MB</option>
                      <option>512 MB</option>
                      <option>1024 MB</option>
                    </select>
                  </label>
                </div>
                <div className="modal-actions">
                  <button className="button secondary" onClick={() => setModal('')}>
                    Cancel
                  </button>
                  <button
                    className="button primary"
                    onClick={() => {
                      setActiveReviewerLabs((prev) => [
                        ...prev,
                        {
                          name: `Cloud Sandbox Lab #${prev.length + 1}`,
                          tag: 'Custom Lab',
                          activeInstances: 1,
                          status: 'HEALTHY',
                          cpu: '4%',
                          memory: '128MB',
                          difficulty: 'Intermediate',
                        },
                      ]);
                      setModal('');
                      notify('Isolated lab container provisioned and ready for candidate sessions');
                    }}
                  >
                    <Play size={14} /> Deploy container
                  </button>
                </div>
              </div>
            ) : modal === 'inspect-lab' ? (
              (() => {
                const currentLabMeta = activeReviewerLabs.find((l) => l.name === lab) || {
                  name: lab || 'API Authorization Lab',
                  tag: 'Web Security',
                  activeInstances: 2,
                  status: 'HEALTHY' as const,
                  cpu: '12%',
                  memory: '240MB',
                  difficulty: 'Intermediate',
                };

                const baseRequests = [
                  {
                    id: 'REQ-101',
                    time: '14:23:18',
                    method: 'GET' as const,
                    path: lab.includes('XSS') ? '/search?q=%3Cscript%3Ealert(1)%3C/script%3E' : lab.includes('SQL') ? '/login?user=admin%27--' : '/api/v1/users/42/tokens',
                    status: 200,
                    latency: '28ms',
                    type: 'EXPLOIT',
                    srcIp: '10.244.0.12 (Candidate Ananya Rao)',
                    reqHeaders: `Host: target-${lab.toLowerCase().replace(/\s+/g, '-')}.lab:8080\nAuthorization: Bearer mock_candidate_jwt\nX-Proxy-Interceptor: ProofForge-Telemetry/v2\nAccept: application/json`,
                    respBody: lab.includes('XSS')
                      ? 'HTTP/1.1 200 OK\nContent-Type: text/html\n\n<div>Search results for: <script>alert(1)</script> (Reflected Unsanitized)</div>'
                      : lab.includes('SQL')
                      ? 'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\n  "auth": true,\n  "role": "dba_admin",\n  "session": "sess_sql_dump_8819a"\n}'
                      : 'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\n  "status": "success",\n  "user_id": 42,\n  "role": "admin",\n  "api_token": "sk_live_99f81a20c4e7b8"\n}',
                  },
                  {
                    id: 'REQ-102',
                    time: '14:22:50',
                    method: 'POST' as const,
                    path: '/api/v1/auth/verify',
                    status: 403,
                    latency: '19ms',
                    type: 'AUTH',
                    srcIp: '10.244.0.12 (Candidate Ananya Rao)',
                    reqHeaders: `Host: target-${lab.toLowerCase().replace(/\s+/g, '-')}.lab:8080\nContent-Type: application/json\nAuthorization: Bearer expired_token_session`,
                    respBody: 'HTTP/1.1 403 Forbidden\nContent-Type: application/json\n\n{\n  "error": "Invalid signature or expired lease",\n  "code": "AUTH_REJECTED"\n}',
                  },
                  {
                    id: 'REQ-103',
                    time: '14:21:05',
                    method: 'GET' as const,
                    path: '/healthz',
                    status: 200,
                    latency: '3ms',
                    type: 'HTTP',
                    srcIp: '127.0.0.1 (Docker Health Daemon)',
                    reqHeaders: 'Host: localhost:8080\nUser-Agent: ProofForge-Healthcheck/1.0',
                    respBody: 'HTTP/1.1 200 OK\n\n{"status":"UP","uptime":"4h 12m","subsystems":{"db":"OK","sandbox":"RESTRICTED"}}',
                  },
                ];

                const allRequests = [...extraTelemetryLogs, ...baseRequests];
                const filteredRequests = allRequests.filter((r) => {
                  if (inspectFilter === 'ALL') return true;
                  if (inspectFilter === 'GET' || inspectFilter === 'POST') return r.method === inspectFilter;
                  return r.type === inspectFilter;
                });

                const activeReq = filteredRequests[selectedReqIndex] || filteredRequests[0] || baseRequests[0];

                const sockets = [
                  { port: 8080, proto: 'TCP', service: 'HTTP Web Target', state: 'LISTEN', proc: 'gunicorn (PID 402)' },
                  { port: 3306, proto: 'TCP', service: 'Database Backend', state: 'LISTEN', proc: 'mysqld (PID 180)' },
                  { port: 22, proto: 'TCP', service: 'Sandboxed SSH', state: 'LISTEN', proc: 'sshd (PID 91)' },
                  { port: 9090, proto: 'TCP', service: 'Prometheus Telemetry Exporter', state: 'LISTEN', proc: 'node_exporter (PID 55)' },
                ];

                const daemonLogs = [
                  { time: '14:23:18.402', level: 'VULN_TRIGGER', text: `[SECURITY-EVENT] Deterministic exploit payload received on ${activeReq?.path || '/'} from 10.244.0.12` },
                  { time: '14:22:50.119', level: 'WARN', text: '[ACCESS-CONTROL] Authorization boundary rejection recorded for session candidate_ar' },
                  { time: '14:21:05.882', level: 'INFO', text: `[PROBE] Periodic health check passed on container id: dock_${lab.slice(0, 4).toLowerCase()}_88f2` },
                  { time: '14:19:30.000', level: 'INFO', text: '[NET-DAEMON] eBPF network probe attached to interface veth_pf0. Intercepting all TCP/UDP telemetry.' },
                  { time: '14:15:00.000', level: 'INFO', text: '[CONTAINER-START] Container booted with synthetic target profile. Egress restricted.' },
                ];

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Top Container Telemetry Bar */}
                    <div
                      style={{
                        background: '#f4f6f0',
                        border: '1px solid #e2e7dc',
                        borderRadius: 8,
                        padding: '12px 14px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: 10,
                      }}
                    >
                      <div>
                        <span style={{ font: '600 8px "DM Mono"', color: '#7a8575', letterSpacing: '.5px', display: 'block' }}>
                          CONTAINER STATUS
                        </span>
                        <strong style={{ color: '#275823', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#45853b' }} />
                          {currentLabMeta.status}
                        </strong>
                      </div>

                      <div>
                        <span style={{ font: '600 8px "DM Mono"', color: '#7a8575', letterSpacing: '.5px', display: 'block' }}>
                          CONTAINER IP
                        </span>
                        <code style={{ font: '600 11px "DM Mono"', color: '#334c32' }}>10.244.18.42/24</code>
                      </div>

                      <div>
                        <span style={{ font: '600 8px "DM Mono"', color: '#7a8575', letterSpacing: '.5px', display: 'block' }}>
                          RESOURCE LOAD
                        </span>
                        <strong style={{ fontSize: 11, color: '#364032' }}>
                          CPU: {currentLabMeta.cpu} · RAM: {currentLabMeta.memory}
                        </strong>
                      </div>

                      <div>
                        <span style={{ font: '600 8px "DM Mono"', color: '#7a8575', letterSpacing: '.5px', display: 'block' }}>
                          ACTIVE SESSIONS
                        </span>
                        <strong style={{ fontSize: 11, color: '#364032' }}>
                          {currentLabMeta.activeInstances} Candidate Sandboxes
                        </strong>
                      </div>

                      <div>
                        <span style={{ font: '600 8px "DM Mono"', color: '#7a8575', letterSpacing: '.5px', display: 'block' }}>
                          PCAP CAPTURE
                        </span>
                        <span style={{ font: '600 10px "DM Mono"', color: '#376831' }}>
                          ● RECORDING (eth0)
                        </span>
                      </div>
                    </div>

                    {/* Inspector Navigation Tabs */}
                    <div className="topic-tabs" role="tablist">
                      <button
                        className={`topic-tab-btn ${inspectTab === 'traffic' ? 'active' : ''}`}
                        onClick={() => setInspectTab('traffic')}
                      >
                        <Terminal size={13} /> Live HTTP Proxy Stream ({allRequests.length})
                      </button>
                      <button
                        className={`topic-tab-btn ${inspectTab === 'system' ? 'active' : ''}`}
                        onClick={() => setInspectTab('system')}
                      >
                        <Layers size={13} /> Open Sockets & Ports ({sockets.length})
                      </button>
                      <button
                        className={`topic-tab-btn ${inspectTab === 'logs' ? 'active' : ''}`}
                        onClick={() => setInspectTab('logs')}
                      >
                        <Activity size={13} /> Daemon stdout &amp; Syslogs
                      </button>
                      <button
                        className={`topic-tab-btn ${inspectTab === 'inject' ? 'active' : ''}`}
                        onClick={() => setInspectTab('inject')}
                      >
                        <Play size={13} /> Test Vector Injector
                      </button>
                    </div>

                    {/* Tab 1: Live HTTP Proxy Stream */}
                    {inspectTab === 'traffic' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <div className="toolbox-categories" style={{ padding: 0 }}>
                            {(['ALL', 'GET', 'POST', 'AUTH', 'EXPLOIT'] as const).map((filterOpt) => (
                              <button
                                key={filterOpt}
                                className={`toolbox-cat-btn ${inspectFilter === filterOpt ? 'active' : ''}`}
                                onClick={() => {
                                  setInspectFilter(filterOpt);
                                  setSelectedReqIndex(0);
                                }}
                              >
                                {filterOpt}
                              </button>
                            ))}
                          </div>
                          <span style={{ font: '500 9px "DM Mono"', color: '#7c8677' }}>
                            Click any request row to inspect full headers &amp; payload
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 10 }}>
                          {/* Requests List */}
                          <div style={{ border: '1px solid #e3e7de', borderRadius: 7, overflow: 'hidden', background: '#fff' }}>
                            <div style={{ background: '#f8faf6', borderBottom: '1px solid #e3e7de', padding: '7px 10px', font: '600 9px "DM Mono"', color: '#687763', display: 'grid', gridTemplateColumns: '50px 48px 1fr 45px 50px' }}>
                              <span>TIME</span>
                              <span>METHOD</span>
                              <span>ENDPOINT</span>
                              <span>STATUS</span>
                              <span>TYPE</span>
                            </div>
                            <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                              {filteredRequests.map((req, idx) => {
                                const isSelected = idx === selectedReqIndex;
                                return (
                                  <div
                                    key={req.id + idx}
                                    onClick={() => setSelectedReqIndex(idx)}
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: '50px 48px 1fr 45px 50px',
                                      alignItems: 'center',
                                      padding: '8px 10px',
                                      borderBottom: '1px solid #f1f3ee',
                                      fontSize: 10,
                                      cursor: 'pointer',
                                      background: isSelected ? '#eff6ec' : '#fff',
                                      color: isSelected ? '#1e381b' : '#3c4739',
                                      transition: 'background .1s',
                                    }}
                                  >
                                    <span style={{ font: '500 9px "DM Mono"', color: '#7e877a' }}>{req.time}</span>
                                    <span style={{ font: '700 9px "DM Mono"', color: req.method === 'POST' ? '#9e6231' : '#376831' }}>{req.method}</span>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', font: '500 10px "DM Mono"' }}>{req.path}</span>
                                    <span style={{ font: '700 9px "DM Mono"', color: req.status === 200 ? '#386f31' : '#ab3d27' }}>{req.status}</span>
                                    <span style={{ font: '600 8px "DM Mono"', padding: '2px 4px', borderRadius: 3, background: req.type === 'EXPLOIT' ? '#faede8' : '#eef4ea', color: req.type === 'EXPLOIT' ? '#a53621' : '#416a39', textAlign: 'center' }}>
                                      {req.type}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Request/Response Inspector Box */}
                          <div style={{ border: '1px solid #e3e7de', borderRadius: 7, padding: '10px 12px', background: '#fafbf8', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 290, overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e7ebe2', paddingBottom: 6 }}>
                              <span style={{ font: '700 10px "DM Mono"', color: '#275823' }}>
                                {activeReq ? `${activeReq.method} ${activeReq.path}` : 'No request selected'}
                              </span>
                              <span style={{ font: '600 9px "DM Mono"', color: '#737f6f' }}>
                                {activeReq?.latency} · {activeReq?.srcIp}
                              </span>
                            </div>

                            <div>
                              <div style={{ font: '600 8px "DM Mono"', color: '#74826f', letterSpacing: '.4px', marginBottom: 3 }}>
                                REQUEST HEADERS &amp; ORIGIN
                              </div>
                              <pre style={{ margin: 0, padding: 8, background: '#111712', color: '#a0db97', borderRadius: 5, font: '500 10px/1.45 "DM Mono"', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                                {activeReq?.reqHeaders || 'No headers available'}
                              </pre>
                            </div>

                            <div>
                              <div style={{ font: '600 8px "DM Mono"', color: '#74826f', letterSpacing: '.4px', marginBottom: 3 }}>
                                RESPONSE BODY ({activeReq?.status})
                              </div>
                              <pre style={{ margin: 0, padding: 8, background: '#111712', color: '#c7e6c0', borderRadius: 5, font: '500 10px/1.45 "DM Mono"', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                                {activeReq?.respBody || 'No response captured'}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: System Sockets & Ports */}
                    {inspectTab === 'system' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ border: '1px solid #e3e7de', borderRadius: 7, overflow: 'hidden', background: '#fff' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
                            <thead>
                              <tr style={{ background: '#f8faf6', borderBottom: '1px solid #e3e7de', color: '#687763', font: '600 9px "DM Mono"' }}>
                                <th style={{ padding: '9px 12px' }}>PORT</th>
                                <th style={{ padding: '9px 12px' }}>PROTOCOL</th>
                                <th style={{ padding: '9px 12px' }}>SERVICE</th>
                                <th style={{ padding: '9px 12px' }}>STATE</th>
                                <th style={{ padding: '9px 12px' }}>HOST PROCESS / DAEMON</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sockets.map((s) => (
                                <tr key={s.port} style={{ borderBottom: '1px solid #eff2eb' }}>
                                  <td style={{ padding: '9px 12px', font: '700 11px "DM Mono"', color: '#275823' }}>{s.port}</td>
                                  <td style={{ padding: '9px 12px', font: '600 10px "DM Mono"' }}>{s.proto}</td>
                                  <td style={{ padding: '9px 12px', fontWeight: 600 }}>{s.service}</td>
                                  <td style={{ padding: '9px 12px' }}>
                                    <span style={{ font: '600 8px "DM Mono"', background: '#eaf4e6', color: '#35632b', padding: '3px 6px', borderRadius: 4 }}>
                                      {s.state}
                                    </span>
                                  </td>
                                  <td style={{ padding: '9px 12px', color: '#6c7767', font: '500 10px "DM Mono"' }}>{s.proc}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="objective-box" style={{ margin: 0 }}>
                          <strong>ISOLATION POLICY · EGRESS RESTRICTED</strong>
                          <p>Container bridge iptables rules block outbound WAN traffic. All synthetic traffic stays confined within the container boundary to prevent external data egress.</p>
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Daemon stdout & Logs */}
                    {inspectTab === 'logs' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ background: '#0f1611', border: '1px solid #233525', borderRadius: 7, padding: '12px 14px', maxHeight: 280, overflowY: 'auto', font: '500 11px/1.6 "DM Mono"', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {daemonLogs.map((log, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: 8, color: log.level === 'VULN_TRIGGER' ? '#f59882' : log.level === 'WARN' ? '#e8bd74' : '#9cd992' }}>
                              <span style={{ color: '#557252', flexShrink: 0 }}>{log.time}</span>
                              <span style={{ fontWeight: 700, flexShrink: 0, color: log.level === 'VULN_TRIGGER' ? '#ff6f50' : log.level === 'WARN' ? '#f5af38' : '#73c767' }}>
                                [{log.level}]
                              </span>
                              <span>{log.text}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ font: '500 9px "DM Mono"', color: '#7a8576' }}>
                            Streaming real-time stdout / stderr via gunicorn Docker socket
                          </span>
                          <button
                            className="button secondary small-button"
                            onClick={() => notify('Daemon log buffer refreshed')}
                          >
                            <RotateCcw size={12} /> Refresh logs
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tab 4: Exploit Vector Injector */}
                    {inspectTab === 'inject' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <p style={{ margin: 0, fontSize: 11, color: '#5a6654' }}>
                          Simulate sending test payloads directly to the vulnerable container to verify reproduction and confirm vulnerability behavior in real time:
                        </p>

                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            className="button secondary small-button"
                            onClick={() => setInjectPayload('GET /api/v1/users/42/tokens HTTP/1.1\nHost: target-api.lab:8080\nAuthorization: Bearer mock_token_ananya')}
                          >
                            Preset: BOLA Token Swap
                          </button>
                          <button
                            className="button secondary small-button"
                            onClick={() => setInjectPayload("POST /auth/login HTTP/1.1\nHost: target-app.lab:8080\nContent-Type: application/json\n\n{\"username\": \"admin' OR '1'='1\", \"password\": \"test\"}")}
                          >
                            Preset: SQLi Bypass
                          </button>
                          <button
                            className="button secondary small-button"
                            onClick={() => setInjectPayload('GET /search?q=%3Cscript%3Ealert(document.domain)%3C/script%3E HTTP/1.1\nHost: target-app.lab:8080')}
                          >
                            Preset: Reflected XSS
                          </button>
                          <button
                            className="button secondary small-button"
                            onClick={() => setInjectPayload('GET /download?file=../../../../etc/passwd HTTP/1.1\nHost: target-app.lab:8080')}
                          >
                            Preset: Path Traversal
                          </button>
                        </div>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: '600 9px "DM Mono"', color: '#687763' }}>
                          RAW HTTP INJECTION PAYLOAD
                          <textarea
                            rows={4}
                            value={injectPayload}
                            onChange={(e) => setInjectPayload(e.target.value)}
                            style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, padding: 9, background: '#fbfcf9', border: '1px solid #dce2d7', borderRadius: 6 }}
                          />
                        </label>

                        <button
                          className="button primary"
                          style={{ alignSelf: 'flex-start' }}
                          onClick={() => {
                            if (!injectPayload.trim()) {
                              notify('Please enter a payload to transmit');
                              return;
                            }
                            const nowTime = new Date().toTimeString().slice(0, 8);
                            const method = injectPayload.startsWith('POST') ? 'POST' : 'GET';
                            const firstLine = injectPayload.split('\n')[0] || 'GET /api/v1/test';
                            const path = firstLine.split(' ')[1] || '/api/test';
                            const isExploit = path.includes('42') || path.includes("'") || path.includes('script') || path.includes('passwd');

                            const newReq = {
                              id: `REQ-${Date.now().toString().slice(-3)}`,
                              time: nowTime,
                              method: method as 'GET' | 'POST',
                              path: path,
                              status: isExploit ? 200 : 403,
                              latency: `${Math.floor(Math.random() * 25) + 12}ms`,
                              type: isExploit ? ('EXPLOIT' as const) : ('HTTP' as const),
                              srcIp: '10.244.0.99 (Reviewer Live Injector)',
                              reqHeaders: injectPayload,
                              respBody: isExploit
                                ? `HTTP/1.1 200 OK\nContent-Type: application/json\nX-Exploit-Triggered: TRUE\n\n{\n  "injected_result": "SUCCESS",\n  "matched_vulnerability": "${lab}",\n  "payload_echo": "${path}"\n}`
                                : 'HTTP/1.1 403 Forbidden\nContent-Type: application/json\n\n{"error": "Payload did not trigger exploit vector"}',
                              details: 'Interactive injection simulated by reviewer',
                            };

                            setExtraTelemetryLogs((prev) => [newReq, ...prev]);
                            setInspectTab('traffic');
                            setSelectedReqIndex(0);
                            notify(`Payload transmitted to container — response received (${newReq.status} OK)`);
                          }}
                        >
                          <Play size={13} /> Transmit Test Vector to Container
                        </button>
                      </div>
                    )}

                    {/* Bottom Modal Actions */}
                    <div className="modal-actions" style={{ marginTop: 8 }}>
                      <button
                        className="button secondary"
                        onClick={() => {
                          const pcapBlob = new Blob(['Mock PCAP Capture Dump Data - ProofForge Verified Lab'], { type: 'application/vnd.tcpdump.pcap' });
                          const url = URL.createObjectURL(pcapBlob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${lab.toLowerCase().replace(/\s+/g, '_')}_telemetry.pcap`;
                          a.click();
                          URL.revokeObjectURL(url);
                          notify(`PCAP packet trace downloaded for ${lab}`);
                        }}
                      >
                        <Download size={13} /> Export PCAP Trace
                      </button>

                      <button
                        className="button secondary"
                        onClick={() => {
                          setExtraTelemetryLogs([]);
                          notify(`Container cache and mock DB state flushed for ${lab}`);
                        }}
                      >
                        <RotateCcw size={13} /> Flush container state
                      </button>

                      <button className="button primary" onClick={() => setModal('')}>
                        <Check size={14} /> Close Inspector
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : modal === 'invite' ? (
              <>
                <p className="modal-copy">
                  Send a verified technical interview invitation (Virtual Zoom or In-Person Office) to <strong>{inviteCandidate || lab || 'Candidate'}</strong>. They will instantly receive the invitation and venue details in their Candidate portal.
                </p>
                <div className="form-grid">
                  <label>
                    Target Candidate
                    <select
                      value={inviteCandidate || lab || people[0]?.name || ''}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        setInviteCandidate(selectedName);
                        setLab(selectedName);
                        const matchedPerson = people.find((p) => p.name === selectedName);
                        if (matchedPerson) {
                          setInviteForm((prev) => ({ ...prev, role: matchedPerson.role }));
                        }
                      }}
                      style={{ background: '#fcfdfa', fontWeight: 600, color: '#1f331d' }}
                    >
                      {people.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} — {p.role} ({p.score} DNA)
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Role / Specialization
                    <input
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                      placeholder="e.g. Application Security Engineer"
                    />
                  </label>

                  <label className="span-two">
                    Interview Mode (Online vs Offline / On-Spot)
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setInviteForm({
                            ...inviteForm,
                            mode: 'online',
                            type: 'Technical Defense Deep Dive (Zoom)',
                          });
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: inviteForm.mode === 'online' ? '2px solid #275823' : '1px solid #d9e2d5',
                          background: inviteForm.mode === 'online' ? '#eaf4e6' : '#ffffff',
                          color: inviteForm.mode === 'online' ? '#1b4018' : '#556652',
                          fontWeight: inviteForm.mode === 'online' ? 700 : 500,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Globe2 size={16} style={{ color: inviteForm.mode === 'online' ? '#275823' : '#778873' }} />
                        <span>🌐 Online / Virtual Meeting (Zoom)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInviteForm({
                            ...inviteForm,
                            mode: 'offline',
                            type: 'On-Spot / In-Person Technical Defense (Office)',
                          });
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: inviteForm.mode === 'offline' ? '2px solid #275823' : '1px solid #d9e2d5',
                          background: inviteForm.mode === 'offline' ? '#eaf4e6' : '#ffffff',
                          color: inviteForm.mode === 'offline' ? '#1b4018' : '#556652',
                          fontWeight: inviteForm.mode === 'offline' ? 700 : 500,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Building2 size={16} style={{ color: inviteForm.mode === 'offline' ? '#275823' : '#778873' }} />
                        <span>🏢 Offline / On-Spot Meeting (In-Person Office)</span>
                      </button>
                    </div>
                  </label>

                  <label>
                    Interview Session Type
                    <select
                      value={inviteForm.type}
                      onChange={(e) => {
                        const val = e.target.value;
                        const isOff = val.includes('(Office)') || val.includes('(In-Person)') || val.includes('(On-Site)');
                        setInviteForm({
                          ...inviteForm,
                          type: val,
                          mode: isOff ? 'offline' : 'online',
                        });
                      }}
                      style={{ fontWeight: 600, color: '#1f331d' }}
                    >
                      <optgroup label="🌐 Online / Virtual Meeting (Zoom)">
                        <option value="Technical Defense Deep Dive (Zoom)">Technical Defense Deep Dive (Zoom)</option>
                        <option value="Virtual Technical Screen (Zoom)">Virtual Technical Screen (Zoom)</option>
                        <option value="Vulnerability Code Review (Zoom)">Vulnerability Code Review (Zoom)</option>
                        <option value="Final Architecture Round (Zoom)">Final Architecture Round (Zoom)</option>
                      </optgroup>
                      <optgroup label="🏢 Offline / On-Spot Meeting (Office &amp; Lab)">
                        <option value="On-Spot / In-Person Technical Defense (Office)">On-Spot / In-Person Technical Defense (Office)</option>
                        <option value="On-Spot Technical Whiteboard &amp; Architecture (Office)">On-Spot Technical Whiteboard &amp; Architecture (Office)</option>
                        <option value="Hands-on Security Lab &amp; Container Audit (In-Person)">Hands-on Security Lab &amp; Container Audit (In-Person)</option>
                        <option value="Practical Penetration Testing Workshop (On-Site)">Practical Penetration Testing Workshop (On-Site)</option>
                        <option value="Executive Security Defense &amp; Leadership Round (Office)">Executive Security Defense &amp; Leadership Round (Office)</option>
                        <option value="Team Culture &amp; Coffee Meetup (In-Person)">Team Culture &amp; Coffee Meetup (In-Person)</option>
                      </optgroup>
                    </select>
                  </label>

                  <label>
                    Proposed date &amp; time
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <input
                        type="date"
                        value={inviteForm.date}
                        onChange={(e) => setInviteForm({ ...inviteForm, date: e.target.value })}
                      />
                      <input
                        type="text"
                        value={inviteForm.time}
                        onChange={(e) => setInviteForm({ ...inviteForm, time: e.target.value })}
                        placeholder="14:00 IST"
                      />
                    </div>
                  </label>

                  {inviteForm.mode === 'online' ? (
                    <label className="span-two">
                      Zoom Meeting Room Link (Generated)
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          value="https://us05web.zoom.us/myhome"
                          readOnly
                          style={{ background: '#eef3eb', color: '#1f482a', fontWeight: 600 }}
                        />
                        <button
                          type="button"
                          className="button secondary small-button"
                          onClick={() => {
                            window.open('https://us05web.zoom.us/myhome', '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <ExternalLink size={12} /> Test Link
                        </button>
                      </div>
                    </label>
                  ) : (
                    <label className="span-two">
                      Office Venue &amp; Meeting Room Address
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <input
                          value={inviteForm.venue}
                          onChange={(e) => setInviteForm({ ...inviteForm, venue: e.target.value })}
                          placeholder="e.g. ProofForge Cyber HQ, Tower B, Level 4, Tech Park, Indiranagar, Bengaluru - 560038"
                          style={{ background: '#fafcfa' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 }}>
                          <input
                            value={inviteForm.room}
                            onChange={(e) => setInviteForm({ ...inviteForm, room: e.target.value })}
                            placeholder="e.g. Security War Room 4B · Hardware Token & Lab Station"
                          />
                          <button
                            type="button"
                            className="button secondary small-button"
                            onClick={() => {
                              window.open(`https://maps.google.com/?q=${encodeURIComponent(inviteForm.venue)}`, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            <MapPin size={12} /> View Map
                          </button>
                        </div>
                      </div>
                    </label>
                  )}

                  <label className="span-two">
                    Message / Agenda
                    <textarea
                      rows={3}
                      value={inviteForm.message}
                      onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                    />
                  </label>
                </div>
                <div className="modal-actions">
                  <button className="button secondary" onClick={() => setModal('')}>Cancel</button>
                  <button
                    className="button primary"
                    onClick={() => {
                      const candidateName = inviteCandidate || lab || 'Ananya Rao';
                      const isOffline = inviteForm.mode === 'offline';
                      const newInterview = {
                        id: `INT-${Date.now().toString().slice(-3)}`,
                        candidate: candidateName,
                        company: 'FREQUENCY / Jordan Davis',
                        role: inviteForm.role || (people.find(p => p.name === candidateName)?.role) || 'Application Security Engineer',
                        type: inviteForm.type || (isOffline ? 'On-Site Technical Whiteboard (Office)' : 'Technical Defense Deep Dive (Zoom)'),
                        mode: inviteForm.mode,
                        venue: isOffline ? `${inviteForm.venue} · ${inviteForm.room}` : undefined,
                        date: inviteForm.date || 'Oct 05, 2026',
                        time: inviteForm.time || '15:00 IST',
                        message: inviteForm.message || 'We reviewed your verified lab findings and invite you to a technical session.',
                        zoomUrl: isOffline ? '' : 'https://us05web.zoom.us/myhome',
                        status: 'CONFIRMED' as const,
                      };
                      setInterviews((prev) => [newInterview, ...prev]);
                      setModal('');
                      notify(
                        isOffline
                          ? `In-person meeting invitation & venue sent to ${candidateName}!`
                          : `Virtual interview invitation & Zoom room sent to ${candidateName}!`
                      );
                    }}
                  >
                    {inviteForm.mode === 'offline' ? (
                      <><Building2 size={14} /> Send in-person invitation</>
                    ) : (
                      <><BriefcaseBusiness size={14} /> Send invitation &amp; Zoom link</>
                    )}
                  </button>
                </div>
              </>
            ) : modal === 'topic' ? (
              (() => {
                const topicInfo = TOPIC_DETAILS[lab] || TOPIC_DETAILS['Networking'];
                const totalCommands = topicInfo.syntaxes.reduce((acc, c) => acc + c.items.length, 0);
                return (
                  <div className="topic-modal-wrapper">
                    <div className="topic-badge-row">
                      <div className="topic-badge-group">
                        <span className="topic-badge">{topicInfo.tag}</span>
                        <span className="topic-badge secondary">{topicInfo.badge}</span>
                      </div>
                      <span className="topic-badge secondary"><Clock3 size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />5 MIN REVISION</span>
                    </div>

                    <div className="topic-summary-box">
                      <strong>SUMMARY · </strong>{topicInfo.summary}
                    </div>

                    <div className="topic-tabs" role="tablist">
                      <button
                        className={`topic-tab-btn ${topicTab === 'concepts' ? 'active' : ''}`}
                        onClick={() => setTopicTab('concepts')}
                      >
                        <BookOpen size={13} />
                        Core Concepts
                      </button>
                      <button
                        className={`topic-tab-btn ${topicTab === 'syntaxes' ? 'active' : ''}`}
                        onClick={() => setTopicTab('syntaxes')}
                      >
                        <Terminal size={13} />
                        Commands & Syntaxes ({totalCommands})
                      </button>
                      <button
                        className={`topic-tab-btn ${topicTab === 'attacks' ? 'active' : ''}`}
                        onClick={() => setTopicTab('attacks')}
                      >
                        <ShieldAlert size={13} />
                        Attacks & Defenses
                      </button>
                      <button
                        className={`topic-tab-btn ${topicTab === 'takeaways' ? 'active' : ''}`}
                        onClick={() => setTopicTab('takeaways')}
                      >
                        <ListChecks size={13} />
                        Key Takeaways
                      </button>
                    </div>

                    {topicTab === 'concepts' && (
                      <div className="topic-panel">
                        <div className="topic-section-card">
                          <div className="topic-section-header">
                            <Layers size={14} />
                            <span>{topicInfo.overview.heading}</span>
                          </div>
                          <div className="topic-point-grid">
                            {topicInfo.overview.points.map((p) => (
                              <div className="topic-point-item" key={p.label}>
                                <strong>{p.label}</strong>
                                <span>{p.desc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {topicTab === 'syntaxes' && (
                      <div className="topic-panel">
                        {topicInfo.syntaxes.map((cat) => (
                          <div key={cat.category} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ font: '600 11px Manrope', color: '#2c3d28', marginTop: 4 }}>
                              {cat.category}
                            </div>
                            {cat.items.map((item) => (
                              <div className="topic-cmd-card" key={item.cmd}>
                                <div className="topic-cmd-header">
                                  <span className="topic-cmd-tag">SYNTAX / COMMAND</span>
                                  <button
                                    className="topic-copy-btn"
                                    onClick={() => {
                                      navigator.clipboard?.writeText(item.cmd);
                                      setCopiedCmd(item.cmd);
                                      notify('Command copied to clipboard');
                                      setTimeout(() => setCopiedCmd(''), 2000);
                                    }}
                                  >
                                    {copiedCmd === item.cmd ? (
                                      <>
                                        <Check size={11} /> Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={11} /> Copy
                                      </>
                                    )}
                                  </button>
                                </div>
                                <code className="topic-cmd-code">{item.cmd}</code>
                                <div className="topic-cmd-desc">{item.desc}</div>
                                {item.note && (
                                  <div style={{ fontSize: 9, color: '#88a682', fontStyle: 'italic' }}>
                                    Note: {item.note}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {topicTab === 'attacks' && (
                      <div className="topic-panel">
                        {topicInfo.attacksAndDefenses.map((ad) => (
                          <div className="topic-attack-card" key={ad.attack}>
                            <div className="topic-attack-title">
                              <ShieldAlert size={14} />
                              <span>{ad.attack}</span>
                            </div>
                            <div className="topic-attack-mech">
                              <strong>Mechanism: </strong>
                              {ad.mechanism}
                            </div>
                            <div className="topic-attack-defense">
                              <strong>Defense & Fix: </strong>
                              {ad.defense}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {topicTab === 'takeaways' && (
                      <div className="topic-panel">
                        <div className="topic-section-card">
                          <div className="topic-section-header">
                            <Check size={14} />
                            <span>Interview & Exam Revision Checklist</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {topicInfo.keyTakeaways.map((item, idx) => (
                              <div className="topic-takeaway-item" key={idx}>
                                <Check size={14} />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="modal-actions" style={{ marginTop: 6 }}>
                      <button
                        className="button secondary"
                        onClick={() => notify(`${topicInfo.title} saved to your revision list`)}
                      >
                        <BookOpen size={14} /> Save for later
                      </button>
                      <button
                        className="button primary"
                        onClick={() => {
                          const firstUnanswered = ALL_ASSESSMENT_QUESTIONS.findIndex((q) => selectedAnswers[q.id] === undefined);
                          const targetIdx = firstUnanswered >= 0 ? firstUnanswered : 0;
                          setCurrentQIndex(targetIdx);
                          try {
                            saveAssessmentProgress(auth?.email, 'qIndex', String(targetIdx));
                          } catch {}
                          setModal('assessment');
                        }}
                      >
                        Try a quick quiz <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <>
                <div className="profile-proof">
                  <div className="avatar big peach">AR</div>
                  <div>
                    <span className="verified-pill"><ShieldCheck size={13} /> VERIFIED BY REVIEWER</span>
                    <h3>{modal === 'profile' ? lab : 'Broken Access Control'}</h3>
                    <p>Capability 94 · Proof confidence 97% · 18 verified findings</p>
                  </div>
                </div>
                <div className="proof-stages">
                  {['Authorized lab', 'Reproducible evidence', 'Security report', 'Reviewer verification'].map(x => (
                    <span key={x}><Check size={13} />{x}</span>
                  ))}
                </div>
                <div className="objective-box">
                  <strong>SANITIZED PROOF SUMMARY · {people.find(p => p.name === lab)?.findings ?? 18} VERIFIED FINDINGS</strong>
                  <p>{lab} demonstrated repeatable security testing in authorized labs. Sanitized evidence, reproduction, impact and reviewer remediation notes are available. Raw secrets, credentials and live target details are withheld from recruiter view.</p>
                </div>
                <SecurityDna dna={selectedProfile.dna} confidence={selectedProfile.confidence} />
                <ProofChainGraph defenseScore={selectedProfile.defense} verified={true} />
                <div className="proof-metrics"><span><b>{selectedProfile.accuracy}%</b> finding accuracy</span><span><b>{selectedProfile.report}</b> report quality</span><span><b>{selectedProfile.labsVerified}</b> verified labs</span><span><b>Human</b> reviewer verification</span></div>
                {modal === 'profile' && (
                  <div className="modal-actions">
                    {role === 'Reviewer' ? (
                      <>
                        <button className="button secondary" onClick={() => setModal('')}>
                          Close
                        </button>
                        <button
                          className={`button ${passedCandidates.includes(lab) ? 'secondary' : 'primary'}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            color: passedCandidates.includes(lab) ? '#255422' : '#fff',
                            background: passedCandidates.includes(lab) ? '#eaf4e6' : undefined,
                            borderColor: passedCandidates.includes(lab) ? '#c7dec0' : undefined,
                          }}
                          onClick={() => {
                            void updateCandidateApproval(lab, !passedCandidates.includes(lab));
                          }}
                        >
                          {passedCandidates.includes(lab) ? (
                            <>
                              <ShieldCheck size={14} /> Passed to Recruiter ✓ (Click to Revoke)
                            </>
                          ) : (
                            <>
                              <Check size={14} /> Examine &amp; Pass Candidate to Recruiter
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`button ${savedCandidates.includes(lab) ? 'primary' : 'secondary'}`}
                          onClick={() => {
                            if (savedCandidates.includes(lab)) {
                              setSavedCandidates((prev) => prev.filter((c) => c !== lab));
                              notify(`${lab} removed from shortlist`);
                            } else {
                              setSavedCandidates((prev) => [...prev, lab]);
                              notify(`${lab} saved to shortlist!`);
                            }
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          {savedCandidates.includes(lab) ? (
                            <>
                              <BookmarkCheck size={14} /> Shortlisted
                            </>
                          ) : (
                            <>
                              <Bookmark size={14} /> Save to Shortlist
                            </>
                          )}
                        </button>
                        <button
                          className="button primary"
                          onClick={() => {
                            setInviteCandidate(lab);
                            const matched = people.find((p) => p.name === lab);
                            if (matched) {
                              setInviteForm((prev) => ({ ...prev, role: matched.role }));
                            }
                            setModal('invite');
                          }}
                        >
                          <BriefcaseBusiness size={14} /> Invite to interview
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function Metric({ label, value, unit, trend, icon, tone }: {
  label: string; value: string; unit?: string; trend: string;
  icon: React.ReactNode; tone: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-top"><span>{label}</span><div className={`metric-icon ${tone}`}>{icon}</div></div>
      <div className="metric-value">{value}<small>{unit}</small></div>
      <div className="metric-trend">{trend}</div>
    </div>
  );
}

function PageIntro({ eyebrow, title, sub, action }: {
  eyebrow: string; title: string; sub: string; action?: React.ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {action}
    </div>
  );
}

function LabCard({ item: l, onClick }: { item: Lab; onClick: () => void }) {
  return (
    <div className="lab-card">
      <div className="lab-card-top">
        <div className={`lab-icon ${l.color}`}><l.icon size={18} /></div>
        <span className="difficulty">{l.level}</span>
      </div>
      <span className="lab-tag">{l.tag}</span>
      <h3>{l.n}</h3>
      <p>{l.desc}</p>
      <div className="lab-card-meta">
        <span><Clock3 size={13} />{l.time}</span>
        <span><ShieldCheck size={13} />Contained target</span>
      </div>
      <button className="button secondary full" onClick={onClick}>View lab <ArrowRight size={14} /></button>
    </div>
  );
}

function ChainItem({ icon, title, meta, status, tone }: {
  icon: React.ReactNode; title: string; meta: string; status: string; tone: string;
}) {
  return (
    <div className="chain-item">
      <div className={`chain-icon ${tone}`}>{icon}</div>
      <div className="chain-copy"><strong>{title}</strong><span>{meta}</span></div>
      <span className={`chain-status ${tone}`}>{status}</span>
    </div>
  );
}

function SecurityDna({ dna, confidence }: { dna: Record<string, number>; confidence: number }) {
  return (
    <section className="dna-panel" aria-label="Security Skill Fingerprint">
      <div className="dna-heading"><div><span className="eyebrow"><Fingerprint size={13} /> EVIDENCE-DERIVED SKILL FINGERPRINT</span><h3>Security DNA</h3></div><span className="dna-legend">CAPABILITY <i/> PROOF CONFIDENCE</span></div>
      <div className="dna-grid">{SECURITY_DOMAINS.map(skill => {
        const capability = dna[skill] ?? 0;
        const proof = capability ? Math.min(confidence, Math.round(capability * .7 + confidence * .3)) : 0;
        return <div className="dna-skill" key={skill}><div className="dna-skill-head"><span>{skill}</span><b>{capability}<small> / {proof}</small></b></div><div className="dna-bars"><span className="capability-bar" style={{ width: `${capability}%` }} /><span className="confidence-bar" style={{ width: `${proof}%` }} /></div></div>;
      })}</div>
      <p className="dna-footnote">Scores come from verified lab findings and reviewer evidence. Claimed tools and selected interests do not increase this fingerprint.</p>
    </section>
  );
}

function ProofChainGraph({ defenseScore, verified }: { defenseScore: number; verified: boolean }) {
  const stages = [
    ['AUTHORIZED LAB', 'API Authorization Lab'], ['FINDING', 'Broken Access Control'], ['EVIDENCE', 'Sanitized request / response'],
    ['REPRODUCTION', 'Repeatable lab steps'], ['IMPACT + FIX', 'Cross-account access · ownership check'],
    ['DEFENSE', `Reviewer score ${defenseScore}`], ['VERIFICATION', verified ? 'Reviewer verified' : 'Awaiting reviewer'],
  ];
  return <section className="proof-graph"><div className="proof-graph-head"><div><span className="eyebrow">WHY THIS CAPABILITY SCORE</span><h3>Security proof chain</h3></div><span className={verified ? 'verified-pill' : 'status-pill'}><ShieldCheck size={12} />{verified ? 'HUMAN VERIFIED' : 'IN REVIEW'}</span></div><div className="proof-graph-track">{stages.map(([label, detail], i) => <div className={`proof-node ${i < (verified ? 7 : 6) ? 'complete' : ''}`} key={label}><div className="proof-node-dot">{i < (verified ? 7 : 6) ? <Check size={11} /> : i + 1}</div><span>{label}</span><small>{detail}</small></div>)}</div></section>;
}

function Finding({ name, severity, lab, verified, onClick }: {
  name: string; severity: string; lab: string; verified: boolean; onClick: () => void;
}) {
  return (
    <button className="finding-row" onClick={onClick}>
      <div className="finding-icon"><FileCheck2 size={16} /></div>
      <div className="finding-info"><strong>{name}</strong><span>{lab}</span></div>
      <span className={`severity ${severity.toLowerCase()}`}>{severity}</span>
      <span className={verified ? 'verified-pill' : 'status-pill'}>
        {verified ? <><ShieldCheck size={12} /> VERIFIED</> : 'IN REVIEW'}
      </span>
      <ArrowUpRight size={15} />
    </button>
  );
}

function ReviewRow({ name, finding, lab, time, score, onClick }: {
  name: string; finding: string; lab: string; time: string; score: string; onClick: () => void;
}) {
  return (
    <button className="review-row" onClick={onClick}>
      <div className="avatar peach">{name.split(' ').map(x => x[0]).join('')}</div>
      <div className="review-copy"><strong>{finding}</strong><span>{name} · {lab}</span></div>
      <span className="review-time"><Clock3 size={13} />{time}</span>
      <span className="review-score">AI <b>{score}</b></span>
      <span className="status-pill">PENDING</span>
      <ArrowRight size={15} />
    </button>
  );
}

function Target() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}
