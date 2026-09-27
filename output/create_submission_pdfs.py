from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Frame
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf'
OUT.mkdir(parents=True, exist_ok=True)
GREEN = HexColor('#24563e'); DARK = HexColor('#192d25'); MINT = HexColor('#edf3eb')
PAPER = HexColor('#f7f7f2'); INK = HexColor('#25332c'); MUTED = HexColor('#65756c')
GOLD = HexColor('#d4a95e'); LINE = HexColor('#dce4d9'); ORANGE = HexColor('#c56d3e')

# The PDF is intentionally text-first where the repository has no real product captures.
def decision_log():
    path = OUT / 'HM26-C3B5_decision-log.pdf'
    c = canvas.Canvas(str(path), pagesize=A4, pageCompression=1)
    c.setTitle('HM26-C3B5 Decision Log — FREQUENCY / ProofForge Cyber')
    c.setAuthor('Team HM26-C3B5')
    w, h = A4
    c.setFillColor(PAPER); c.rect(0,0,w,h,fill=1,stroke=0)
    c.setFillColor(GREEN); c.rect(0,h-12,w,12,fill=1,stroke=0)
    c.setFillColor(DARK); c.setFont('Helvetica-Bold', 20); c.drawString(42,h-52,'ENGINEERING DECISION LOG')
    c.setFillColor(MUTED); c.setFont('Helvetica',10); c.drawString(42,h-70,'FREQUENCY / ProofForge Cyber  •  Team HM26-C3B5  •  Phase 2')
    c.setStrokeColor(LINE); c.line(42,h-83,w-42,h-83)
    sections = [
      ('Q1 · WHAT WE BUILT — AND REJECTED',
       'We built a proof pipeline in which candidate assessment answers and structured security findings enter the API; server-side scoring, evidence hashing and a human reviewer’s decision turn them into section scores and verified findings; recruiter routes expose sanitized proof for discovery. Assessment answer keys stay on the server. A finding remains pending until a reviewer verifies it, rejects it or requests changes. The recruiter-facing capability and confidence signals are derived from evidence; claimed tools do not establish skill. The current interface is partly a demonstration: several candidate and recruiter views use synthetic browser state, while the API persists assessment section scores, findings, reviewer decisions, defense answers, rubric values and invitations.<br/><br/>We seriously considered an automated LLM grader. It looked attractive because it could return feedback immediately and reduce reviewer queue time. We rejected it as the authority for hiring decisions: exploit evidence is adversarial input, and a generated score would be difficult to reproduce and defend. The implemented reviewer suggestion is deterministic demo content, not a runtime model.'),
      ('Q2 · WHY — AND THE COST WE ACCEPT',
       'Across <b>trust</b>, <b>repeatability</b>, <b>build scope</b> and <b>latency</b>, human verification with deterministic API rules was the better fit. Reviewers can inspect reproduction steps and explain a decision; server-side answer keys and explicit ownership checks constrain basic tampering. The approach was feasible to implement without collecting labeled examples, hosting a model or designing prompt-injection defenses. A language model might summarize reports faster, but it can miss context or follow instructions embedded in hostile evidence. We therefore keep final verification and hiring decisions with people.<br/><br/>We knowingly accept slower verification: candidates wait for a reviewer, and reviewer capacity becomes a bottleneck. We also accept an incomplete product boundary: role pages are not yet fully wired to authenticated API records, and synthetic UI state must not be mistaken for persisted candidate evidence. This costs immediacy and end-to-end consistency. The MVP favors explainable records and human accountability over instant but less defensible automated judgments.'),
      ('Q3 · WHAT BREAKS ACROSS MYSURU',
       'Assume 50,000 candidates complete four assessment sections during a 20-minute placement window. The API stores one result per candidate per section, so that is <b>200,000 score submissions</b>, averaging about <b>167 requests per second</b> if evenly spread; a deadline rush would be higher. This is not two million question-result rows: each request scores ten answers and upserts one section result. Today scoring runs synchronously, then the audit helper commits separately. The Render blueprint also configures one Gunicorn worker and in-memory rate limiting. A burst can therefore exhaust request/DB capacity, while adding workers would make per-process rate limits inconsistent.<br/><br/>Our first change would be a durable submission/outbox queue with idempotency on <font name="Courier">(candidate_id, section)</font>, so requests can be accepted quickly and scoring/audit work drained at a controlled rate. We would move rate limits to shared Redis before horizontal scaling, then load-test peak bursts and tune worker and database capacity from measurements. This adds operational components and makes results briefly asynchronous; we accept that cost to protect the service during festival or campus-wide traffic.')]
    y = h-103
    body = ParagraphStyle('body',fontName='Helvetica',fontSize=10.15,leading=13.1,textColor=INK,spaceAfter=0)
    for title, text in sections:
        c.setFillColor(GREEN); c.setFont('Helvetica-Bold',10); c.drawString(42,y,title); y-=18
        p=Paragraph(text,body); aw,ah=p.wrap(w-84, h)
        p.drawOn(c,42,y-ah); y-=ah+15
    c.setStrokeColor(LINE); c.line(42,36,w-42,36)
    c.setFillColor(MUTED); c.setFont('Helvetica',8.5)
    c.drawString(42,23,'~470 words · Scale is an estimate from the current four-section data model, not measured production capacity.')
    if y < 45:
        raise RuntimeError(f'Decision log overflow: content ends at y={y:.1f}')
    c.save()
    return path

SLIDES = [
('FREQUENCY', 'Proof you can inspect. Skills you can trust.', 'VERIFIABLE PROOF-OF-WORK ENGINEERING DISCOVERY & HIRING', 'Team HM26-C3B5  ·  Members: [add names]  ·  Colleges: [add colleges]', 'Selected problem · The proof gap in cybersecurity hiring'),
('THE PROOF GAP', 'Resumes and certificates show claims. They rarely show reproducible work, sound reasoning, or how a candidate explains a finding.', 'A Mysuru hiring scenario', 'A local team screens many applicants. A capable candidate without a familiar credential is easy to miss; an inflated claim is hard to verify.', 'Candidates lose visibility. Reviewers spend time rechecking. Recruiters lack comparable evidence.'),
('WHO IT SERVES', 'CANDIDATE', 'Demonstrates work through a finding, assessment and technical defense. Needs a clear path and low-bandwidth access.', 'REVIEWER', 'Checks reproduction evidence, records a decision and scores defense. Human judgment remains authoritative.', 'RECRUITER', 'Filters evidence-backed profiles and reviews sanitized proof before inviting candidates.'),
('FROM WORK TO PROOF', '01  Candidate completes a section assessment and submits a structured finding.', '02  API scores answers server-side and hashes submitted evidence.', '03  Reviewer reproduces, questions and records a decision.', '04  Verified records inform capability and proof-confidence signals.', '05  Recruiter inspects sanitized proof and can invite the candidate.', 'PRODUCT CAPTURE NEEDED', 'No real product screenshots are present in the repository. Replace this marked panel with a capture of the running product before submission.'),
('ARCHITECTURE', 'React + TypeScript role workspaces → Flask modular API → PostgreSQL', 'API also records audit events and computes SHA-256 evidence hashes.', 'Candidate UI → authorized lab (current lab UI is synthetic; no isolated target is provisioned).', 'Managed browser / network allowlist → lab (deployment policy layer, not a website control).', 'See docs/architecture.md · The frontend add-on views are synthetic demo; persisted API flows are described in the architecture document.'),
('CONSTRAINTS & HONEST STATUS', 'Evidence integrity · SHA-256 hash and duplicate flag in API  |  PARTIAL', 'Jurisdiction · No isolated lab provisioned; do not test arbitrary targets  |  NOT BUILT', 'Priority · Human reviewer controls verification  |  HANDLED', 'Bad input · API validates assessment shape and finding fields  |  PARTIAL', 'Offline · Local SQLite fallback; no offline sync guarantee  |  PARTIAL'),
('THE KEY DECISION', 'CHOSEN', 'Deterministic server-side scoring + structured evidence + human reviewer authority', 'REJECTED', 'LLM as final grader: faster feedback, but less repeatable and harder to defend on adversarial evidence.', 'TRADE-OFF ACCEPTED', 'Human review takes longer and creates a reviewer-capacity bottleneck. The MVP favors explainable decisions.'),
('WHAT THE CODE PROVES', 'API flow', 'Assessment answer keys stay server-side; each section score is persisted.', 'Review flow', 'Human reviewer decisions, defense responses and rubric values have API persistence.', 'Discovery boundary', 'API sanitizes verified proof. Some candidate and recruiter screens still use synthetic data.', 'REAL CAPTURE SLOTS', 'Add 2–3 genuine screenshots: candidate assessment, reviewer decision, recruiter sanitized proof. No screenshots are checked in.'),
('LIMITS & SCALE', '50,000 candidates × 4 sections = 200,000 score submissions.', 'Over 20 minutes: ~167 requests/second average; deadline bursts are higher.', 'First pressure point: synchronous score + separate audit commits; one configured worker; in-memory rate limit.', 'First change: durable idempotent submission/outbox queue; shared Redis limits; then load-test.', 'Other gaps: synthetic UI data; no isolated labs; no secure file-upload/redaction pipeline.'),
('NEXT & DISCLOSURE', '1  Connect role pages to authenticated persisted records.', '2  Provision isolated, resettable labs with egress denied.', '3  Add shared rate limiting, monitoring and peak-load tests.', 'AI disclosure: Claude/Gemini assisted development; no runtime LLM makes hiring decisions.', 'Live MVP: https://proofforge-cyber.onrender.com', 'Repository: github.com/yogesh-37911/HM26-C3B5-Phase2', 'Team members / colleges: [add names]'),
]

def linewrap(text, max_width, font, size):
    words=text.split(); lines=[]; cur=''
    for word in words:
        test=(cur+' '+word).strip()
        if stringWidth(test,font,size) <= max_width: cur=test
        else:
            if cur: lines.append(cur)
            cur=word
    if cur: lines.append(cur)
    return lines

def draw_wrapped(c, text, x, y, max_width, size=19, leading=28, color=INK, font='Helvetica'):
    c.setFillColor(color); c.setFont(font,size)
    for line in linewrap(text,max_width,font,size):
        c.drawString(x,y,line); y-=leading
    return y

def slide(c, n, title, lines):
    W,H=960,540
    c.setFillColor(PAPER); c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(GREEN); c.rect(0,H-10,W,10,fill=1,stroke=0)
    c.setFillColor(MUTED); c.setFont('Helvetica-Bold',11); c.drawString(52,H-43,'FREQUENCY  /  PROOFFORGE CYBER')
    c.drawRightString(W-52,H-43,f'{n:02d} / 10')
    c.setFillColor(DARK); c.setFont('Helvetica-Bold',30); c.drawString(52,H-91,title)
    c.setStrokeColor(LINE); c.line(52,H-108,W-52,H-108)
    c.setFillColor(GREEN); c.rect(52,30,5,22,fill=1,stroke=0)
    c.setFillColor(MUTED); c.setFont('Helvetica',10); c.drawString(66,37,'TEAM HM26-C3B5  ·  EVIDENCE BEFORE CLAIMS')
    c.setFillColor(MUTED); c.setFont('Helvetica',10); c.drawRightString(W-52,37,'FREQUENCY')
    return H-145

def deck():
    path=OUT/'HM26-C3B5_presentation.pdf'; c=canvas.Canvas(str(path),pagesize=(960,540),pageCompression=1)
    c.setTitle('HM26-C3B5 Presentation — FREQUENCY / ProofForge Cyber'); c.setAuthor('Team HM26-C3B5')
    for idx,item in enumerate(SLIDES,1):
        title,*lines=item; y=slide(c,idx,title,lines)
        if idx==1:
            c.setFillColor(GREEN); c.roundRect(52,290,8,115,4,fill=1,stroke=0)
            y=397
            for t,size,col,font,lead in [(lines[1],38,DARK,'Helvetica-Bold',47),(lines[0],18,GREEN,'Helvetica-Bold',27),(lines[2],18,INK,'Helvetica',29),(lines[3],18,MUTED,'Helvetica',25)]:
                y=draw_wrapped(c,t,82,y,780,size,lead,col,font)-14
        elif idx==2:
            y=draw_wrapped(c,lines[0],56,y,840,27,37,DARK,'Helvetica-Bold')-30
            c.setFillColor(MINT); c.roundRect(54,91,852,148,14,fill=1,stroke=0)
            draw_wrapped(c,lines[1],78,206,800,17,25,GREEN,'Helvetica-Bold')
            draw_wrapped(c,lines[2],78,174,800,19,27,INK)
            draw_wrapped(c,lines[3],78,126,800,15,22,MUTED)
        elif idx==3:
            cards=[(lines[0],lines[1]),(lines[2],lines[3]),(lines[4],lines[5])]
            xlist=[52,356,660]
            for (head,body),x in zip(cards,xlist):
                c.setFillColor(white); c.roundRect(x,119,248,240,12,fill=1,stroke=0); c.setStrokeColor(LINE); c.roundRect(x,119,248,240,12,fill=0,stroke=1)
                c.setFillColor(GREEN); c.setFont('Helvetica-Bold',16); c.drawString(x+20,325,head)
                draw_wrapped(c,body,x+20,288,210,18,27,INK)
        elif idx==4:
            for j,t in enumerate(lines[:5]):
                yy=369-j*48
                c.setFillColor(MINT); c.circle(76,yy+5,15,fill=1,stroke=0); c.setFillColor(GREEN); c.setFont('Helvetica-Bold',12); c.drawCentredString(76,yy+1,f'{j+1:02d}')
                draw_wrapped(c,t,107,yy,775,18,24,INK)
            c.setFillColor(HexColor('#f1eee4')); c.roundRect(52,84,854,52,9,fill=1,stroke=0)
            draw_wrapped(c,lines[5],70,115,815,13,18,ORANGE,'Helvetica-Bold')
            draw_wrapped(c,lines[6],70,95,815,12,17,MUTED)
        elif idx==5:
            # Mirrors docs/architecture.md's component/data flow, with the same named nodes and connections.
            boxes=[('Candidate UI',70,314),('Reviewer UI',300,314),('Recruiter UI',530,314),('Flask modular API',370,218),('PostgreSQL',370,122),('Audit events',650,218),('Evidence SHA-256',650,122),('Authorized isolated lab',70,122),('Managed browser / network allowlist',70,218)]
            for name,x,yy in boxes:
                width=220 if 'Managed' in name else 190
                c.setFillColor(MINT if 'UI' in name else white); c.roundRect(x,yy,width,50,9,fill=1,stroke=0); c.setStrokeColor(LINE); c.roundRect(x,yy,width,50,9,fill=0,stroke=1)
                c.setFillColor(DARK); c.setFont('Helvetica-Bold',13); c.drawCentredString(x+width/2,yy+19,name)
            def arrow(x1,y1,x2,y2):
                c.setStrokeColor(GREEN); c.setLineWidth(1.4); c.line(x1,y1,x2,y2)
                import math
                a=math.atan2(y2-y1,x2-x1); L=7
                p=c.beginPath(); p.moveTo(x2,y2); p.lineTo(x2-L*math.cos(a-.5),y2-L*math.sin(a-.5)); p.lineTo(x2-L*math.cos(a+.5),y2-L*math.sin(a+.5)); p.close()
                c.setFillColor(GREEN); c.drawPath(p,fill=1,stroke=0)
            for x in [165,395,625]: arrow(x,314,465,270)
            arrow(465,218,465,172); arrow(560,243,650,243); arrow(560,220,650,155)
            arrow(180,218,180,172)
            draw_wrapped(c,lines[0],54,421,840,18,24,GREEN,'Helvetica-Bold')
            draw_wrapped(c,lines[1],54,76,850,12,16,MUTED)
            draw_wrapped(c,lines[2],54,57,850,11,14,MUTED)
        elif idx==6:
            for j,t in enumerate(lines):
                yy=360-j*53
                c.setFillColor(white); c.roundRect(52,yy-26,854,41,8,fill=1,stroke=0); c.setStrokeColor(LINE); c.roundRect(52,yy-26,854,41,8,fill=0,stroke=1)
                draw_wrapped(c,t,70,yy-2,820,18,23,INK)
        elif idx==7:
            for x,head,body in [(52,lines[0],lines[1]),(500,lines[2],lines[3])]:
                c.setFillColor(MINT if head=='CHOSEN' else HexColor('#f4eee7')); c.roundRect(x,178,400,174,12,fill=1,stroke=0)
                c.setFillColor(GREEN if head=='CHOSEN' else ORANGE); c.setFont('Helvetica-Bold',16); c.drawString(x+22,320,head)
                draw_wrapped(c,body,x+22,280,350,18,26,INK)
            c.setFillColor(DARK); c.setFont('Helvetica-Bold',17); c.drawString(52,139,lines[4])
            draw_wrapped(c,lines[5],52,111,840,16,22,MUTED)
        elif idx==8:
            cards=[(lines[0],lines[1]),(lines[2],lines[3]),(lines[4],lines[5])]
            for i,(head,body) in enumerate(cards):
                x=52+i*286
                c.setFillColor(white); c.roundRect(x,205,270,140,10,fill=1,stroke=0); c.setStrokeColor(LINE); c.roundRect(x,205,270,140,10,fill=0,stroke=1)
                c.setFillColor(GREEN); c.setFont('Helvetica-Bold',15); c.drawString(x+16,316,head)
                draw_wrapped(c,body,x+16,281,235,18,23,INK)
            c.setFillColor(HexColor('#f1eee4')); c.roundRect(52,102,854,68,9,fill=1,stroke=0)
            draw_wrapped(c,lines[6],70,145,815,14,18,ORANGE,'Helvetica-Bold')
            draw_wrapped(c,lines[7],70,121,815,13,17,MUTED)
        elif idx==9:
            y=draw_wrapped(c,lines[0],54,y,840,24,32,GREEN,'Helvetica-Bold')-6
            for t in lines[1:]: y=draw_wrapped(c,'• '+t,60,y,830,18,24,INK)-9
        else:
            for j,t in enumerate(lines[:4]):
                yy=374-j*51; draw_wrapped(c,t,58,yy,835,18,24,INK)
            c.setFillColor(MINT); c.roundRect(52,104,854,103,10,fill=1,stroke=0)
            for j,t in enumerate(lines[4:]): draw_wrapped(c,t,72,181-j*28,812,14,19,GREEN if j==0 else INK,'Helvetica-Bold' if j==0 else 'Helvetica')
        c.showPage()
    c.save(); return path

if __name__=='__main__':
    print(decision_log())
    print(deck())
