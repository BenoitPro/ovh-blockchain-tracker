# Infrastructure Procurement Request: Blockchain Intelligence Platform

**Date:** April 2026
**Project:** OVH Blockchain Footprint Tracker & Market Intelligence
**Status:** Ready for Production Deployment

## Background & Objective
We are moving the "Blockchain Footprint Tracker" from a local development environment into production. 
The platform consists of two main pillars:
1. **Core Dashboard & Crawlers:** A Next.js web application and background workers querying blockchain networks (Solana, Ethereum, Avalanche, etc.) to map infrastructure distribution.
2. **AI Action Agents (Upcoming):** Autonomous agents (Hermès/OpenClaw) performing web scraping, community sentiment analysis (Discord), and automated outreach (LinkedIn).

To ensure high availability and accommodate the memory-intensive nature of browser automation (AI Agents), we require robust infrastructure hosted on OVHcloud.

---

## 1. Domain Name Requirements
We require a dedicated domain name for the production dashboard and API endpoints.

*   **Primary Choice:** `[project-name].com` or `[project-name].io` (e.g., `ovh-blockchain-tracker.com`)
*   **DNS Management:** Access to OVH DNS Zone management to configure A/AAAA records and subdomains (e.g., `api.domain.com`).

---

## 2. Compute Infrastructure Requirements

We have analyzed two architectural paths based on upcoming AI Agent requirements. **Option A is the recommended best practice** for isolation, while **Option B** consolidates resources into a single high-performance machine.

### Option A: The "Fleet" Approach (Recommended - Segmented)
*Separating the public-facing dashboard from memory-intensive scraping bots.*

**Server 1: Core Web & Data Node (Dashboard & Blockchain RPC)**
*   **Product:** OVH VPS Comfort (or equivalent Public Cloud instance)
*   **OS:** Ubuntu 24.04 LTS
*   **Specs:** 4 vCores, 8 GB RAM, 80GB+ NVMe SSD
*   **Purpose:** Hosts the Next.js frontend, SQLite/Turso proxy, and lightweight blockchain RPC data pullers. Requires high uptime.

**Server 2: AI Agent & Automation Node**
*   **Product:** OVH VPS Memory (or equivalent Public Cloud RAM-optimized instance)
*   **OS:** Ubuntu 24.04 LTS
*   **Specs:** 4 vCores, 16 GB to 32 GB RAM (Crucial for Headless Browser Automation)
*   **Purpose:** Dedicated exclusively to running Puppeteer/Playwright instances for LinkedIn/Discord data extraction. 
*   *Note:* If this server's IP is banned or it crashes due to a memory leak, the main Core Web Node remains unaffected.

### Option B: The "Unified Heavy Node" (Consolidated)
*A single, powerful machine running everything via Docker/PM2 containerization.*

*   **Product:** OVH VPS Elite (or entry-level Bare Metal Advance/Rise)
*   **OS:** Ubuntu 24.04 LTS
*   **Specs:** 8 vCores, 32 GB RAM, 160GB+ NVMe SSD
*   **Purpose:** Runs both the Dashboard and the AI Agents on the same OS.
*   **Pros:** Easier to maintain a single machine. 32GB RAM is sufficient to run local processes and several headless browsers concurrently.
*   **Cons:** Shared IP address. If the automation bots trigger anti-bot measures on platforms like LinkedIn, the entire domain/IP reputation may be temporarily affected. A severe memory leak from a bot could cause the whole server to halt.

---

## 3. Network & Security Requirements
*   **Public IP:** 1x IPv4 per server.
*   **Bandwidth:** Standard OVH unmetered bandwidth is sufficient (250 Mbps - 1 Gbps).
*   **Firewall:** Standard OVH Network Firewall to restrict ports (opening only 80, 443, and 22).

## Next Steps for Procurement
1. Validate budget for the Domain Name and selected Compute Option (A or B).
2. Provision instances via the OVHcloud Control Panel.
3. Provide SSH keys / root access to the engineering team for environment setup and deployment.
