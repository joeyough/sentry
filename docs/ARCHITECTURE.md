# ARCHITECTURE.md

How Sentry is wired. One page. The reference for what runs where, what talks to what, and where the secrets live.

---

## The picture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   ┌─────────────────────┐                       ┌──────────────────┐    │
│   │  Customer browser   │                       │  Analyst browser │    │
│   │  /client            │                       │  /  (console)    │    │
│   └──────────┬──────────┘                       └────────┬─────────┘    │
│              │                                           │              │
│              │ HTTPS (magic link auth)        HTTPS (Google SSO)        │
│              │                                           │              │
│              ▼                                           ▼              │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                  Cloudflare (DNS, WAF, edge)                    │   │
│   │              sentry.vdalabs.com  →  static frontend             │   │
│   │              api.sentry.vdalabs.com  →  AWS                     │   │
│   └────────────┬───────────────────────────────┬────────────────────┘   │
│                │                               │                        │
│         (static React app)              (API requests)                  │
│                │                               │                        │
│                ▼                               ▼                        │
│   ┌────────────────────────┐    ┌──────────────────────────────────┐    │
│   │  S3 + CloudFront       │    │  AWS ECS (Fargate)               │    │
│   │  React build artifacts │    │  Node.js API container           │    │
│   │  (Vite build output)   │    │  Auto-scales 1–N tasks           │    │
│   └────────────────────────┘    └─────────────┬────────────────────┘    │
│                                                │                        │
│                                    (SQL over internal VPC)              │
│                                                │                        │
│                                                ▼                        │
│                                  ┌──────────────────────────────┐       │
│                                  │  AWS RDS (PostgreSQL)        │       │
│                                  │  Multi-AZ, encrypted at rest │       │
│                                  │  Schema in docs/SCHEMA.sql   │       │
│                                  └──────────────────────────────┘       │
│                                                                         │
│                                                                         │
│   ┌─────────────────────┐                       ┌──────────────────┐    │
│   │  SNYPR SOAR         │   POST /ingest/snypr  │  Lambda          │    │
│   │  (Python playbook,  │ ───────────────────►  │  Validates HMAC  │    │
│   │  analyst-initiated) │                       │  Inserts ticket  │    │
│   └─────────────────────┘                       └────────┬─────────┘    │
│                                                          │              │
│                                                          ▼              │
│                                                       (RDS)             │
│                                                                         │
│                                                                         │
│   ┌─────────────────────┐                       ┌──────────────────┐    │
│   │  Cloudflare Email   │   webhook (parsed)    │  Lambda          │    │
│   │  Routing            │ ───────────────────►  │  Threads or      │    │
│   │  soc@vdalabs.com    │                       │  creates ticket  │    │
│   └─────────────────────┘                       └────────┬─────────┘    │
│                                                          │              │
│                                                          ▼              │
│                                                       (RDS)             │
│                                                                         │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │  All infrastructure managed by Terraform                    │       │
│   │  VDA can clone the repo and rebuild every layer from zero   │       │
│   └─────────────────────────────────────────────────────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## What each piece does (and why)

### Frontend — React + Vite, built to static, served via S3 + CloudFront

The same React app that runs at `localhost:5173` today. Vite builds it to a folder of static files. We ship that folder to S3, put CloudFront in front of it for global edge caching, and point Cloudflare DNS at CloudFront.

**Why not Netlify:** for production, the customer needs hosting that lives inside the AWS account they control. Netlify is fine for the proof-of-concept, but the production build pushes through AWS so VDA has one bill, one set of IAM policies, one place to audit.

**Customer-experience reference:** Kendall named Critical Start NDR's mobile customer app as the design north star — a customer should be able to see incident status from their phone. The Phase 1 `/client` portal is the responsive-web version; native apps are Phase 2.

**On SLAs:** VDA has no formal, tracked SLA today — they prioritize by event severity. The SLA clock the API computes is something Sentry introduces, not a measurement against an existing standard. The architecture supports it; the targets get set with the team in weeks 1-2.

### API — Node.js on AWS ECS (Fargate)

A Node service that owns business logic: ticket CRUD, customer auth gates, SLA clock calculations, template rendering, outbound email composition. Runs in a Docker container on ECS Fargate so it scales horizontally and bit-identical between dev and prod.

**Why not Supabase auto-API:** because we have real business rules. Wrong-client prevention isn't a database constraint — it's a runtime check that pulls customer context from the ticket and refuses to send if the recipient doesn't match. That logic belongs in our code, not in a row-level policy.

### Database — AWS RDS PostgreSQL

Postgres in a managed AWS service. Multi-AZ for availability. Encrypted at rest. Schema in `docs/SCHEMA.sql`. Backups handled by RDS automated snapshots.

**Why not Supabase:** RDS lives in VDA's AWS account. No third party between VDA and their customer data. RDS is what every enterprise security tool runs on — Postgres is Postgres, but the operational control matters here.

### SNYPR bridge — Python playbook → Lambda

Sibe's SOC analyst triages an incident in SNYPR, marks it "open ticket." A Python playbook fires, POSTs the incident payload (with HMAC-signed secret) to `api.sentry.vdalabs.com/ingest/snypr`. A Lambda function validates the signature, looks up the customer, inserts a ticket row, and auto-assigns it to the analyst who ran the playbook.

**The four workflow states** Jim and Sibe specified: Open, Claimed, Awaiting Customer, Completed. Each state change on the ticket writes a comment or status change back to the SNYPR incident. When a ticket reaches Completed, the bridge closes the incident in SNYPR — the sync is two-way, not just inbound.

**Why analyst-initiated, not every alert:** Sibe explicitly rejected auto-creating a ticket from every SNYPR alert — too much false-positive noise. The analyst decides which incidents become customer-facing tickets. Today that decision is followed by hand-copying incident detail into Gmail and looking up contacts in Hudu; the bridge replaces that.

**Why Lambda instead of a route on the main API:** webhooks should fail independently of the main API. If the API is rolling out a new version, SNYPR ingest still works. Different blast radius, different deploy cadence.

### Email bridge — Cloudflare Email Routing → Lambda

`soc@vdalabs.com` routes through Cloudflare. Cloudflare parses the email and fires a webhook to our Lambda. The Lambda looks for `[VDA-XXXX]` in the subject — if found, threads to that ticket; if not, creates a new ticket scoped by sender domain.

**Why Cloudflare instead of SendGrid Inbound Parse:** Cloudflare already owns the domain. One less vendor, one less DNS handoff, one less SLA to depend on. Cloudflare also handles SPF/DKIM/DMARC at the same layer, which is the right place for it.

### Outbound email — Lambda → SES (or Resend)

When an analyst sends a reply, the API hands the message to a Lambda that signs it through AWS SES (preferred) or Resend (fallback). Email gets DKIM-signed from `vdalabs.com`. Sender reputation lives with VDA.

### Infrastructure — Terraform

Every AWS resource (RDS, ECS, Lambdas, IAM roles, secrets manager entries) is declared in Terraform. Cloudflare resources (DNS, email routing, WAF rules) are declared in Terraform. The repo `infra/` directory has the complete recipe.

**Why Terraform matters here:** this is the anti-Halo property in code. If 3Nails disappears, VDA clones the repo and runs `terraform apply` and the entire system rebuilds from zero in their AWS account. Nothing is hand-clicked in the console. No vendor lock-in.

---

## Where the secrets live

| Secret | Where stored | Used by |
|---|---|---|
| `SNYPR_WEBHOOK_SECRET` | AWS Secrets Manager | SNYPR ingest Lambda + SNYPR playbook |
| `EMAIL_WEBHOOK_SECRET` | AWS Secrets Manager | Email ingest Lambda + Cloudflare webhook |
| `DATABASE_URL` | AWS Secrets Manager | Node API container + Lambdas |
| `GOOGLE_OAUTH_CLIENT_SECRET` | AWS Secrets Manager | Node API container (analyst SSO) |
| `SES_SMTP_PASSWORD` | AWS Secrets Manager | Outbound email Lambda |
| `CLOUDFLARE_API_TOKEN` | Terraform Cloud variables | Terraform apply only, not runtime |

No secrets in environment variables. No secrets in the repo. No secrets in CloudWatch logs. IAM policies enforce that each Lambda can read only its own secrets.

---

## What VDA gets at the end

- One GitHub repo with React app code, Node API code, Lambda code, Terraform code.
- One AWS account they control.
- One Cloudflare account they control.
- One Postgres database in their AWS account.
- One markdown runbook for "when something breaks, here's what to do."
- Nothing hand-configured in any vendor console that isn't also in Terraform.

If 3Nails disappears, VDA has every piece. The tool doesn't die.

---

## What's NOT in this architecture (and won't be in MVP)

- Multi-region replication. Single region is fine for 150 customers and an MVP.
- Auto-scaling beyond the ECS task default. We add it when we see real load patterns.
- Real-time push to the analyst UI. Manual refresh is fine for v1. WebSockets in Phase 2 if needed.
- A separate staging environment with its own AWS account. Dev and prod share an account with strict IAM separation for MVP. Account split is a Phase 2 hardening task.
- CI/CD pipeline beyond GitHub Actions + `terraform apply`. No ArgoCD, no fancy GitOps. Boring deploys.

These are explicit non-goals so the MVP ships in 8 weeks.

---

## Next decisions to make (week 1, with Vince)

1. **AWS account ownership.** New account for VDA, or use an existing 3Nails account during build and transfer? Pick one and write down the migration plan if it's the second.
2. **Custom domain.** `sentry.vdalabs.com` or `vda.sentry.io` or something else? Affects all the Cloudflare config and the customer-facing URL.
3. **Email provider for outbound.** SES requires sandbox-exit approval (24-48hr). Resend is faster to start. Pick which one to bring up first.
4. **Single region.** us-east-1 is the default but us-east-2 has fewer outages. Pick one and commit.

These four decisions block Terraform skeleton work. Make them in week 1.
