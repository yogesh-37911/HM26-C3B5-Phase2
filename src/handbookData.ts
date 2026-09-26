export interface TopicPoint {
  label: string;
  desc: string;
}

export interface TopicSyntaxItem {
  cmd: string;
  desc: string;
  note?: string;
}

export interface TopicSyntaxCategory {
  category: string;
  items: TopicSyntaxItem[];
}

export interface TopicAttackDefense {
  attack: string;
  mechanism: string;
  defense: string;
}

export interface TopicDetail {
  title: string;
  tag: string;
  badge: string;
  summary: string;
  overview: {
    heading: string;
    points: TopicPoint[];
  };
  syntaxes: TopicSyntaxCategory[];
  attacksAndDefenses: TopicAttackDefense[];
  keyTakeaways: string[];
}

export const TOPIC_DETAILS: Record<string, TopicDetail> = {
  'Networking': {
    title: 'Networking',
    tag: 'NETWORK SECURITY & RECONNAISSANCE',
    badge: 'OSI 1–4 · TCP/IP · PROTOCOLS',
    summary: 'Core networking fundamentals for security assessments: TCP/IP & OSI architectural models, 3-way handshakes, socket states, CIDR subnetting, port scanning syntaxes, and packet capture.',
    overview: {
      heading: 'Core Models, Packet Lifecycles & Architecture',
      points: [
        {
          label: 'TCP/IP vs OSI Model',
          desc: 'TCP/IP 4-layer model (Application, Transport, Internet, Network Access) reflects real-world network stacks. The OSI 7-layer model (Application, Presentation, Session, Transport, Network, Data Link, Physical) serves as the conceptual reference for boundaries.',
        },
        {
          label: 'TCP 3-Way Handshake & Teardown',
          desc: 'Connection establishment: SYN (Client Seq=x) → SYN-ACK (Server Seq=y, Ack=x+1) → ACK (Client Seq=x+1, Ack=y+1). Connection teardown uses a 4-way exchange (FIN → ACK → FIN → ACK).',
        },
        {
          label: 'TCP vs UDP Protocols',
          desc: 'TCP is connection-oriented, sequenced, and provides guaranteed delivery with flow/congestion control (HTTP, SSH, SMTP). UDP is connectionless and low-latency with no handshake (DNS queries, DHCP, SNMP, NTP, VoIP).',
        },
        {
          label: 'IPv4 Subnetting & CIDR Notation',
          desc: '/24 = 256 IPs (254 usable hosts, .0 network, .255 broadcast), /16 = 65,536 IPs, /30 = 4 IPs (point-to-point links). Private RFC 1918 ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.',
        },
        {
          label: 'Critical Standard Port Registry',
          desc: '21: FTP · 22: SSH · 23: Telnet · 25: SMTP · 53: DNS · 67/68: DHCP · 80: HTTP · 110: POP3 · 123: NTP · 143: IMAP · 389/636: LDAP/S · 443: HTTPS · 445: SMB · 3306: MySQL · 3389: RDP · 5432: PostgreSQL.',
        },
      ],
    },
    syntaxes: [
      {
        category: 'Nmap Scanning & Host Discovery',
        items: [
          {
            cmd: 'nmap -sS -sV -p- -T4 <TARGET>',
            desc: 'Stealth SYN scan across all 65,535 TCP ports with service version detection.',
            note: 'Uses raw sockets without completing full 3-way handshakes.',
          },
          {
            cmd: 'nmap -sC -sV -O -oN scan_results.txt <TARGET>',
            desc: 'Run default NSE security scripts, OS fingerprinting, and write human-readable logs.',
          },
          {
            cmd: 'nmap -sU --top-ports 100 <TARGET>',
            desc: 'Scan the 100 most common UDP services (slower due to ICMP port unreachable rate limits).',
          },
          {
            cmd: 'nmap --script "vuln and safe" -p 80,443,445 <TARGET>',
            desc: 'Run safe vulnerability identification scripts against exposed web and SMB services.',
          },
        ],
      },
      {
        category: 'Host Sockets, Routing & Interfaces',
        items: [
          {
            cmd: 'ss -tulpn',
            desc: 'List all active TCP/UDP listening sockets, bound interface IPs, and owning process IDs (modern netstat replacement).',
          },
          {
            cmd: 'ip -br a && ip route show',
            desc: 'Display network interface IPs in brief format and print kernel routing table default gateway.',
          },
          {
            cmd: 'traceroute -T -p 443 <TARGET>',
            desc: 'TCP SYN traceroute to map intermediate hops through firewalls blocking ICMP.',
          },
        ],
      },
      {
        category: 'Packet Capture & DNS Diagnostics',
        items: [
          {
            cmd: 'tcpdump -i eth0 -nn -s0 -w traffic.pcap "tcp port 80 or tcp port 443"',
            desc: 'Capture full-payload packet traffic on eth0 filtered for web protocols for Wireshark inspection.',
          },
          {
            cmd: 'dig +trace +nocmd ANY <DOMAIN>',
            desc: 'Perform full recursive DNS resolution trace from root servers to authoritative name servers.',
          },
          {
            cmd: 'nc -nvz -w 2 <TARGET> 20-100',
            desc: 'Netcat TCP connection test and port probe with a 2-second timeout.',
          },
        ],
      },
    ],
    attacksAndDefenses: [
      {
        attack: 'ARP Spoofing & Man-in-the-Middle (MitM)',
        mechanism: 'Attacker broadcasts gratuitous ARP replies associating their MAC address with the gateway IP, intercepting subnet traffic.',
        defense: 'Enable Dynamic ARP Inspection (DAI) on managed switches, deploy 802.1X, and enforce static ARP pairings on critical links.',
      },
      {
        attack: 'SYN Flood Denial of Service (DoS)',
        mechanism: 'Flooding server with TCP SYN packets from spoofed IPs without sending final ACKs, exhausting connection backlog tables.',
        defense: 'Enable TCP SYN Cookies (sysctl -w net.ipv4.tcp_syncookies=1), reduce SYN-ACK timeouts, and apply firewall connection limits.',
      },
      {
        attack: 'Unrestricted DNS Zone Transfer (AXFR)',
        mechanism: 'dig axfr @ns.target.lab target.lab extracts complete internal hostnames, subdomains, and IP maps if zone transfers are open.',
        defense: 'Restrict DNS zone transfers (allow-transfer) strictly to authorized secondary nameserver IPs.',
      },
      {
        attack: 'VLAN Hopping & Insecure Segmentation',
        mechanism: 'Double-tagging 802.1Q packets or exploiting DTP negotiation to jump between isolated VLAN networks.',
        defense: 'Disable Dynamic Trunking Protocol (DTP) on user access ports, set dedicated native VLANs, and enforce Next-Gen Firewall microsegmentation.',
      },
    ],
    keyTakeaways: [
      'Always confirm explicit authorization and defined scope before initiating active port or service scans.',
      'Differentiate TCP socket states (LISTEN, SYN_SENT, ESTABLISHED, TIME_WAIT, CLOSE_WAIT) when troubleshooting connection issues.',
      'Combine passive DNS and WHOIS enumeration before executing active SYN scans to minimize noisy telemetry.',
    ],
  },

  'HTTP & HTTPS': {
    title: 'HTTP & HTTPS',
    tag: 'WEB PROTOCOLS & TRANSPORT SECURITY',
    badge: 'RFC 9110 · TLS 1.3 · CORS · HEADERS',
    summary: 'Essential reference for HTTP request/response architecture, REST methods, status codes, TLS 1.3 cryptographic handshakes, browser security headers, and cookie isolation flags.',
    overview: {
      heading: 'Protocol Architecture, Verbs & Security Headers',
      points: [
        {
          label: 'Request / Response Anatomy',
          desc: 'Stateless application protocol over TCP/TLS. Requests comprise Method, Path, Protocol Version, Headers, and optional Body; Responses return Status Code, Headers, and Payload.',
        },
        {
          label: 'HTTP Methods (Verbs)',
          desc: 'GET (safe, idempotent retrieve), POST (create / trigger action), PUT (complete replacement / idempotent), PATCH (partial update), DELETE (remove resource), HEAD (headers only), OPTIONS (CORS preflight).',
        },
        {
          label: 'HTTP Status Code Classes',
          desc: '2xx: 200 OK, 201 Created, 204 No Content · 3xx: 301 Moved Perm, 302 Found, 304 Not Modified · 4xx: 400 Bad Request, 401 Unauthenticated, 403 Forbidden, 404 Not Found, 405 Method Not Allowed, 422 Unprocessable, 429 Rate Limited · 5xx: 500 Internal Error, 502 Bad Gateway, 503 Unavailable.',
        },
        {
          label: 'TLS 1.3 Handshake & Cipher Security',
          desc: 'TLS 1.3 finishes handshakes in 1-RTT, mandates Perfect Forward Secrecy (PFS via ECDHE), and deprecates insecure algorithms (RSA key exchange, CBC ciphers, RC4, 3DES, SHA-1 certificates).',
        },
        {
          label: 'Security Headers & Cookie Flags',
          desc: 'HSTS enforces HTTPS. CSP mitigates XSS. X-Content-Type-Options: nosniff stops MIME confusion. X-Frame-Options stops clickjacking. Cookies require HttpOnly (blocks JS read), Secure (HTTPS only), and SameSite=Strict/Lax (mitigates CSRF).',
        },
      ],
    },
    syntaxes: [
      {
        category: 'cURL Inspection & API Probing',
        items: [
          {
            cmd: 'curl -i -X GET https://target.lab/api/v1/health',
            desc: 'Print full HTTP status line, all response headers, and response payload body.',
          },
          {
            cmd: 'curl -I -L https://target.lab',
            desc: 'Fetch headers only while automatically following 301/302 redirects to destination.',
          },
          {
            cmd: 'curl -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d \'{"role":"candidate"}\' https://target.lab/api/register',
            desc: 'Execute an authenticated JSON POST request with custom authorization headers.',
          },
          {
            cmd: 'curl -k -x http://127.0.0.1:8080 https://target.lab',
            desc: 'Route web requests through Burp Suite or OWASP ZAP proxy for interception and manual tamper testing.',
          },
        ],
      },
      {
        category: 'TLS & Certificate Diagnostics',
        items: [
          {
            cmd: 'openssl s_client -connect target.lab:443 -servername target.lab -tls1_3',
            desc: 'Verify server TLS certificate chain, SAN domains, and negotiated TLS 1.3 cipher suite.',
          },
          {
            cmd: 'openssl x509 -in cert.pem -text -noout',
            desc: 'Inspect x509 certificate expiry date, issuer CA, subject alternative names, and public key parameters.',
          },
        ],
      },
    ],
    attacksAndDefenses: [
      {
        attack: 'MIME Sniffing & Script Execution',
        mechanism: 'Browser ignores Content-Type: image/png on an uploaded file containing embedded JavaScript, executing it in origin context.',
        defense: 'Set "X-Content-Type-Options: nosniff" and serve user uploads from an isolated, sandboxed domain or object storage bucket.',
      },
      {
        attack: 'Clickjacking (UI Redressing)',
        mechanism: 'Attacker frames the target application inside a transparent iframe on a malicious webpage to trick users into triggering actions.',
        defense: 'Deploy "Content-Security-Policy: frame-ancestors \'none\'" and "X-Frame-Options: DENY".',
      },
      {
        attack: 'SSL Stripping & MitM Downgrade',
        mechanism: 'Attacker on a public Wi-Fi network intercepts unencrypted HTTP connections before the 301 redirect to HTTPS occurs.',
        defense: 'Configure Strict-Transport-Security (HSTS) with max-age=31536000; includeSubDomains; preload and submit to the HSTS preload list.',
      },
    ],
    keyTakeaways: [
      '401 Unauthorized means unauthenticated (missing/bad token); 403 Forbidden means authenticated but insufficient permissions.',
      'Never store access tokens in localStorage (vulnerable to XSS); use secure, HttpOnly, SameSite cookies.',
      'Enforce Content-Security-Policy (CSP) as a primary defense-in-depth barrier against XSS and data exfiltration.',
    ],
  },

  'Authentication': {
    title: 'Authentication',
    tag: 'IDENTITY & ACCESS MANAGEMENT',
    badge: 'JWT · OAUTH 2.0 · OIDC · ARGON2',
    summary: 'Mastering identity verification architectures: password hashing algorithms, session vs token lifecycles, multi-factor authentication (MFA), OAuth 2.0/OIDC flows, and token security.',
    overview: {
      heading: 'Identity Verification, Token Lifecycles & Hashing',
      points: [
        {
          label: 'The 3 Authentication Factors',
          desc: 'Something you know (passwords, PINs), Something you have (FIDO2 hardware key, TOTP authenticator app, smart card), Something you are (biometric fingerprint, FaceID). Strong MFA requires two distinct factor types.',
        },
        {
          label: 'Session-Based vs JWT Architecture',
          desc: 'Sessions are stateful and stored in server-side DB/Redis; JWTs are stateless signed claims (Header.Payload.Signature). Session IDs can be revoked immediately; JWTs cannot be revoked before expiry without a distributed blocklist.',
        },
        {
          label: 'Modern Password Hashing Standards',
          desc: 'Use Argon2id (OWASP recommendation), bcrypt (work factor >= 12), or scrypt with a unique cryptographically random salt per user. Never use MD5, SHA-1, or unsalted SHA-256 (vulnerable to GPU rainbow tables).',
        },
        {
          label: 'JWT Structure & Token Security',
          desc: 'JWT consists of Base64Url-encoded segments: Header (alg, typ), Payload (sub, exp, iat, roles), and Signature. Keys must use 256+ bits of entropy. Always validate exp and verify signatures on the server.',
        },
        {
          label: 'OAuth 2.0 & OpenID Connect (OIDC)',
          desc: 'OAuth 2.0 is an authorization framework issuing Access Tokens for API scopes. OIDC builds on OAuth 2.0 to provide identity authentication via ID Tokens. The standard flow is Authorization Code with PKCE.',
        },
      ],
    },
    syntaxes: [
      {
        category: 'Password Hashing & Token Verification',
        items: [
          {
            cmd: 'python -c "import argon2; ph = argon2.PasswordHasher(); print(ph.hash(\'SecureCandidate123!\'))"',
            desc: 'Generate a production-grade Argon2id password hash with tuned time and memory cost.',
          },
          {
            cmd: 'python -c "import jwt; print(jwt.decode(\'<TOKEN>\', options={\'verify_signature\': False}))"',
            desc: 'Inspect decoded payload claims (sub, exp, roles) inside a JWT token without verifying signature.',
          },
          {
            cmd: 'hashcat -m 16500 jwt_token.txt rockyou.txt',
            desc: 'Run GPU dictionary attack against weak HMAC-SHA256 JWT signing secret keys.',
          },
          {
            cmd: 'hydra -l admin -P wordlist.txt <TARGET> http-post-form "/api/auth/login:{\\"email\\":\\"^USER^\\",\\"password\\":\\"^PASS^\\"}:Invalid"',
            desc: 'Automated brute-force audit tool for testing credential stuffing defense on test endpoints.',
          },
        ],
      },
    ],
    attacksAndDefenses: [
      {
        attack: 'JWT "none" Algorithm & Signature Bypass',
        mechanism: 'Attacker changes JWT header to {"alg":"none"} and deletes the signature segment; vulnerable parsers accept modified claims.',
        defense: 'Hardcode explicitly allowed signing algorithms in the backend parser (e.g. algorithms=["HS256"]) and reject unsigned tokens.',
      },
      {
        attack: 'Credential Stuffing & Password Spraying',
        mechanism: 'Automated scripts test millions of breached username/password combinations against login endpoints.',
        defense: 'Implement strict IP and user rate limiting (Flask-Limiter / Redis bucket), enforce Multi-Factor Authentication, and integrate breach password checkers.',
      },
      {
        attack: 'Session Fixation & Hijacking',
        mechanism: 'Attacker forces a victim to use a known session token prior to login, then inherits the authenticated session afterwards.',
        defense: 'Always regenerate the session ID immediately upon successful login and bind session tokens to secure client attributes.',
      },
    ],
    keyTakeaways: [
      'Authentication establishes identity ("Who are you?"); Authorization determines permissions ("What are you allowed to do?").',
      'Always enforce minimum password lengths (>= 12 chars) with salt and high iteration hashing.',
      'Never rely on client-side authentication checks; every API endpoint must validate credentials or JWTs on the server.',
    ],
  },

  'Authorization': {
    title: 'Authorization',
    tag: 'ACCESS CONTROL & BOUNDARIES',
    badge: 'RBAC · ABAC · IDOR / BOLA · MULTI-TENANT',
    summary: 'Enforcing object-level and function-level access control, tenant data isolation, IDOR/BOLA vulnerability testing, and least-privilege security design.',
    overview: {
      heading: 'Access Control Models, BOLA & Isolation',
      points: [
        {
          label: 'RBAC vs ABAC Models',
          desc: 'RBAC (Role-Based Access Control) assigns static permissions to Roles (e.g., Candidate, Reviewer, Recruiter). ABAC (Attribute-Based Access Control) evaluates dynamic contextual attributes (User clearance, Resource tenant_id, Time, IP subnet).',
        },
        {
          label: 'BOLA / IDOR Vulnerability (OWASP API1)',
          desc: 'Broken Object Level Authorization occurs when an application exposes database record IDs (e.g., /api/orders/1042) and fails to verify whether the authenticated user owns or has rights to view order 1042.',
        },
        {
          label: 'BFLA (Broken Function Level Auth)',
          desc: 'Failure to restrict sensitive administrative API endpoints (e.g., DELETE /api/admin/users/4) to authorized roles, allowing regular users to invoke privileged functions by simply knowing the endpoint URI.',
        },
        {
          label: 'Mass Assignment / Parameter Tampering',
          desc: 'Backend ORMs bind client JSON payloads directly into database models without validation, allowing attackers to inject protected properties like {"role": "admin", "is_verified": true}.',
        },
        {
          label: 'Multi-Tenant Database Isolation',
          desc: 'Every database query in multi-tenant systems must filter explicitly by both the record identifier and the authenticated tenant/user ID to prevent cross-account data leakage.',
        },
      ],
    },
    syntaxes: [
      {
        category: 'Secure Query Patterns & Testing Syntaxes',
        items: [
          {
            cmd: 'curl -H "Authorization: Bearer <USER_A_TOKEN>" https://target.lab/api/orders/9942',
            desc: 'Test for BOLA/IDOR by requesting User B\'s order ID (9942) using User A\'s authentication token.',
          },
          {
            cmd: 'SELECT * FROM orders WHERE id = :id AND tenant_id = :current_tenant_id;',
            desc: 'Secure tenant-scoped query pattern ensuring ownership verification directly in SQL.',
          },
          {
            cmd: 'ALLOWED_FIELDS = frozenset({"name", "bio", "phone_number"})',
            desc: 'Field whitelist pattern preventing mass assignment vulnerabilities in update endpoints.',
          },
        ],
      },
    ],
    attacksAndDefenses: [
      {
        attack: 'Horizontal Privilege Escalation (IDOR/BOLA)',
        mechanism: 'User A modifies an object ID in an API request to view or edit User B\'s private records at the same permission tier.',
        defense: 'Always enforce server-side object ownership checks on every database access; scope queries by current_user_id.',
      },
      {
        attack: 'Vertical Privilege Escalation (BFLA)',
        mechanism: 'Unprivileged candidate accesses reviewer or admin endpoints by guessing API route names.',
        defense: 'Apply centralized role-checking decorators (e.g. @role_required("reviewer")) on all privileged endpoints.',
      },
      {
        attack: 'Mass Assignment Vulnerability',
        mechanism: 'Attacker appends "is_admin": true into user registration or profile update JSON payloads.',
        defense: 'Use strict schema validation (Pydantic / Marshmallow) with explicit allow-lists of mutable fields.',
      },
    ],
    keyTakeaways: [
      'Adopt a strict Deny-by-Default security posture across all routes and API endpoints.',
      'Use non-sequential identifiers (UUIDv4) to prevent automated sequential record enumeration.',
      'Check authorization at the object level inside every controller or service layer method.',
    ],
  },

  'OWASP Top 10': {
    title: 'OWASP Top 10',
    tag: 'APPLICATION SECURITY TAXONOMY',
    badge: 'OWASP 2021 · CWE · MITRE ATT&CK',
    summary: 'Comprehensive guide to the 10 most critical web and API security risks, standard CWE mappings, real-world exploit mechanisms, and secure coding defenses.',
    overview: {
      heading: 'Taxonomy of Common Web Vulnerabilities',
      points: [
        {
          label: 'A01: Broken Access Control',
          desc: 'Unauthorized data access, IDOR, directory traversal (../../etc/passwd), and CORS misconfigurations. Represents the #1 web application security risk.',
        },
        {
          label: 'A02: Cryptographic Failures',
          desc: 'Exposure of sensitive data in transit or at rest, weak encryption algorithms (DES, RC4), hardcoded secrets in code repositories, and lack of TLS.',
        },
        {
          label: 'A03: Injection (SQLi, Command, XSS)',
          desc: 'Untrusted input interpreted as commands by database or shell interpreters (SQL Injection, OS Command Injection, LDAP, SSTI, and Cross-Site Scripting).',
        },
        {
          label: 'A04: Insecure Design & Business Logic',
          desc: 'Architectural omissions, missing threat modeling, and business logic flaws (e.g., unlimited discount coupon application, infinite retry loops).',
        },
        {
          label: 'A05: Security Misconfiguration',
          desc: 'Default administrative passwords, unnecessary open ports/services, verbose stack traces exposed to users, and open cloud storage buckets.',
        },
        {
          label: 'A06: Vulnerable & Outdated Components',
          desc: 'Unpatched third-party dependencies with known CVEs (e.g., Log4Shell CVE-2021-44228, Spring4Shell, outdated OpenSSL, vulnerable npm packages).',
        },
        {
          label: 'A07: Identification & Auth Failures',
          desc: 'Permitting brute-force attacks, weak session expiration, credential stuffing, and missing multi-factor authentication.',
        },
        {
          label: 'A08: Software & Data Integrity Failures',
          desc: 'Insecure deserialization (Python pickle, Java ObjectInputStream), untrusted CI/CD pipelines, and unverified software auto-updates.',
        },
        {
          label: 'A09: Security Logging & Monitoring Failures',
          desc: 'Breaches going undetected due to zero audit logging for failed logins, access breaches, and security-relevant exceptions.',
        },
        {
          label: 'A10: Server-Side Request Forgery (SSRF)',
          desc: 'Backend server coerced into sending HTTP requests to internal cloud metadata endpoints (169.254.169.254) or intranet services.',
        },
      ],
    },
    syntaxes: [
      {
        category: 'Secure Coding & Remediation Syntaxes',
        items: [
          {
            cmd: 'db.session.execute(text("SELECT * FROM users WHERE email = :e"), {"e": email})',
            desc: 'Secure parameterized SQL query completely immune to SQL injection attacks.',
          },
          {
            cmd: 'subprocess.run(["ping", "-c", "2", safe_ip], check=True, timeout=5)',
            desc: 'Secure subprocess execution passing arguments as an array (avoids shell=True and command injection).',
          },
          {
            cmd: 'npm audit --audit-level=high && pip-audit',
            desc: 'Automated dependency vulnerability scanners for Node.js and Python ecosystems.',
          },
          {
            cmd: 'curl -i "https://target.lab/fetch?url=http://169.254.169.254/latest/meta-data/"',
            desc: 'SSRF probe testing for cloud metadata endpoint access on a vulnerable server.',
          },
        ],
      },
    ],
    attacksAndDefenses: [
      {
        attack: 'SQL Injection (SQLi - CWE-89)',
        mechanism: 'Attacker injects SQL fragments (\' OR \'1\'=\'1) into dynamic query strings to bypass authentication or exfiltrate database tables.',
        defense: 'Always use parameterized prepared statements or ORM queries; never concatenate user input directly into SQL strings.',
      },
      {
        attack: 'Server-Side Request Forgery (SSRF - CWE-918)',
        mechanism: 'Attacker supplies loopback or internal metadata IP addresses in image URL import inputs to read internal cloud credentials.',
        defense: 'Implement strict destination hostname allowlists and block RFC 1918 private subnets and 169.254.169.254 at the application/network layer.',
      },
      {
        attack: 'Cross-Site Scripting (XSS - CWE-79)',
        mechanism: 'Injecting malicious JavaScript into web pages viewed by other users to steal session cookies or hijack accounts.',
        defense: 'Apply contextual HTML/JS output encoding, use modern reactive frameworks that auto-escape DOM text, and enforce strict Content-Security-Policy (CSP).',
      },
    ],
    keyTakeaways: [
      'Never trust client-supplied input; validate on arrival, sanitize at boundaries, and encode before output.',
      'Treat third-party dependencies as an attack vector; scan repositories regularly with Software Composition Analysis (SCA).',
      'Follow the Principle of Least Privilege across operating system processes, database users, and cloud service accounts.',
    ],
  },

  'Security Reporting': {
    title: 'Security Reporting',
    tag: 'COMMUNICATION & REMEDIATION',
    badge: 'CVSS 3.1/4.0 · CWE · AUDIT PROOF',
    summary: 'Guide to authoring professional, executive-ready vulnerability reports, calculating CVSS base scores, structuring deterministic reproduction steps, sanitizing evidence, and proposing code-level remediation.',
    overview: {
      heading: 'Report Structure, CVSS Scoring & Remediation',
      points: [
        {
          label: 'The 8 Sections of a Complete Report',
          desc: '1. Title · 2. CVSS Score & CWE Taxonomy · 3. Executive Summary · 4. Technical Vulnerability Details · 5. Step-by-Step Reproduction · 6. Sanitized PoC Evidence · 7. Business Impact Analysis · 8. Actionable Remediation Guidance.',
        },
        {
          label: 'Finding Title Standard Convention',
          desc: 'Format: [Severity] [Vulnerability Type] in [Component/Endpoint] allows [Specific Impact]. Example: "High - Broken Object Level Authorization in GET /api/v1/invoices allows Unauthorized Access to Customer Invoices".',
        },
        {
          label: 'CVSS 3.1 Base Metric Vectors',
          desc: 'AV (Attack Vector: Network/Adjacent/Local/Physical) · AC (Complexity: Low/High) · PR (Privileges: None/Low/High) · UI (User Interaction: None/Required) · S (Scope: Unchanged/Changed) · C/I/A (Confidentiality, Integrity, Availability: None/Low/High).',
        },
        {
          label: 'Evidence Sanitization Requirements',
          desc: 'Never include real passwords, live customer PII, credit cards, or production JWT keys in reports. Replace sensitive values with [REDACTED] or synthetic test placeholders.',
        },
        {
          label: 'Actionable Remediation Engineering',
          desc: 'Provide exact code diffs and configuration blueprints, rather than vague suggestions like "improve security". Include safe retest verification steps.',
        },
      ],
    },
    syntaxes: [
      {
        category: 'Sanitized PoC Evidence & Template Example',
        items: [
          {
            cmd: 'GET /api/user/orders/1089 HTTP/1.1\nHost: target.lab\nAuthorization: Bearer [REDACTED_USER_A_TOKEN]',
            desc: 'Sanitized HTTP request proof demonstrating authorization bypass with User A\'s token requesting User B\'s order.',
          },
          {
            cmd: 'HTTP/1.1 200 OK\nContent-Type: application/json\n{"order_id": 1089, "customer": "Test Customer", "amount": "$450.00"}',
            desc: 'Sanitized HTTP response proving unauthorized cross-tenant data leak.',
          },
          {
            cmd: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N (Score: 7.5 High)',
            desc: 'Standard CVSS 3.1 vector string mapping network attack vector, low complexity, low privileges, and high confidentiality impact.',
          },
        ],
      },
    ],
    attacksAndDefenses: [
      {
        attack: 'Unverifiable / False Positive Findings',
        mechanism: 'Submitting reports based on theoretical assumptions without reproducible proof of concept steps.',
        defense: 'Provide numbered, deterministic reproduction steps that allow any developer to replicate the issue in under 2 minutes.',
      },
      {
        attack: 'Overstated Severity Ratings',
        mechanism: 'Assigning "Critical" to informational or self-XSS bugs without demonstrating realistic business impact.',
        defense: 'Calculate severity transparently using the CVSS 3.1 calculator and provide clear threat scenario explanations.',
      },
      {
        attack: 'Vague Remediation Recommendations',
        mechanism: 'Telling developers to "apply security best practices" without specific technical guidance.',
        defense: 'Supply concrete code-level diffs, configuration parameters, and exact retest validation steps.',
      },
    ],
    keyTakeaways: [
      'High-impact security reports bridge technical rigor with executive risk clarity.',
      'Always sanitize live secrets and customer data before attaching evidence.',
      'A great finding report provides engineering teams with everything needed to reproduce, fix, and verify the issue in one place.',
    ],
  },
};
