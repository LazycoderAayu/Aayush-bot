# Security Policy

## Supported Versions

I am currently focusing on the initial stable release of this project. If you find any security issues with the current version, please update to the latest release on NPM.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

I take the security of this AI bot seriously. If you discover a vulnerability—especially regarding API key exposure or prompt injections—please follow the steps below:

### 1. How to report
**Please do not open a public GitHub Issue for security vulnerabilities.** Instead, please report it via one of the following:
* **Email:** [aayushsonkar45@gmail.com]
* **GitHub Private Reporting:** If enabled, use the "Report a vulnerability" button under the Security tab of this repository.

### 2. What to include
To help me fix the issue quickly, please include:
* A brief description of the vulnerability.
* Steps to reproduce the issue.
* The version of the NPM package you are using.

### 3. My Response Process
As a student developer, I will do my best to:
* Acknowledge your report within **48-72 hours**.
* Provide a fix in a new NPM patch release (e.g., v1.0.1) as soon as possible.
* Give you credit in the release notes for finding the bug (if you wish).

---
*TIP: Please ensure you never hardcode your Gemini API Key in your source code. Always use `.env` files for security.*
