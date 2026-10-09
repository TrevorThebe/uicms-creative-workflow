# UICMS — AWS Amazon SES Password Reset Integration Guide
**Target Environment:** AWS EC2 Ubuntu 26.04 LTS | Apache 2.4.66 | PHP 8.x | MySQL 8.4  
**Application Root:** `/var/www/html/php-backend`  
**Frontend Deployment:** `/var/www/html/dist` (React 19 + Vite 8)

---

## 1. Overview & Security Architecture

The UICMS Password Reset system implements a secure, production-grade 3-step verification system powered by **Amazon Simple Email Service (SES)** in the **Cape Town (af-south-1)** region.

### The 3-Step Flow:
1. **Step 1: Enter Email (`request-password-reset`)**
   - User inputs their registered workspace email address.
   - User account existence is verified in `users`.
   - A cryptographically secure 6-digit verification code (e.g. `824615`) is generated using `random_int(100000, 999999)`.
   - The plain-text code is **never stored** in the database. Instead, it is hashed with `password_hash($code, PASSWORD_BCRYPT)` and stored in `password_resets` with a strict 15-minute expiration timestamp.
   - The email is dispatched via Amazon SES using the official AWS SDK for PHP (`Aws\Ses\SesClient`).
   - Rate limiting strictly limits requests to **maximum 5 per hour** per email/IP.
   - **User Enumeration Protection:** The API always returns `{"status":"success","message":"If the account exists, instructions have been sent."}` regardless of whether the email exists.
   - Activity logged to `activity_logs`: `PASSWORD_RESET_REQUESTED`.

2. **Step 2: Enter Verification Code (`verify-reset-code`)**
   - User enters the 6-digit verification code.
   - Validates that the reset record exists, is not expired, and has not been used.
   - Enforces **maximum 5 verification attempts**. Each invalid entry increments `attempts`. Upon 5 failed attempts, the token is permanently invalidated.
   - Validates code hash using `password_verify($code, $record['verification_code_hash'])`.
   - Activity logged: `PASSWORD_RESET_VERIFIED` (or `PASSWORD_RESET_FAILED` on mismatch).
   - Returns: `{"status":"success"}`.

3. **Step 3: Choose New Password (`reset-password`)**
   - User inputs and confirms their new password.
   - Strict password complexity enforced:
     - Minimum 8 characters
     - At least 1 uppercase letter (`A-Z`)
     - At least 1 lowercase letter (`a-z`)
     - At least 1 numeric digit (`0-9`)
     - At least 1 special character (`!@#$%^&*` etc.)
   - Password is hashed using `password_hash($password, PASSWORD_BCRYPT)`.
   - Updates `users.password`, clears temporary password flags.
   - Marks reset record as `used = 1` (one-time use only).
   - Activity logged: `PASSWORD_RESET_COMPLETED`.
   - Returns: `{"status":"success","message":"Password successfully changed."}`.

---

## 2. Database Schema & Migration

### Table Definition (`password_resets`)
```sql
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `verification_code_hash` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used` TINYINT(1) NOT NULL DEFAULT 0,
  `attempts` INT NOT NULL DEFAULT 0,
  `ip_address` VARCHAR(45) NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NULL,
  KEY `idx_pr_email` (`email`),
  KEY `idx_pr_user_id` (`user_id`),
  KEY `idx_pr_expires` (`expires_at`),
  KEY `idx_pr_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Applying Migration on Ubuntu EC2:
```bash
# Log in to MySQL 8.4 on the server
mysql -u uicms_app_user -p uicms_workflow < /var/www/html/php-backend/migrations/002_create_password_resets_table.sql
```

---

## 3. Amazon SES Configuration & IAM Policy

### Required `.env` Additions (`/var/www/html/php-backend/.env`)
```ini
# Amazon Simple Email Service (SES) Configuration
AWS_REGION=af-south-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
SES_FROM_EMAIL=noreply@uwiniwin.co.za
SES_FROM_NAME=UICMS
```

### AWS IAM Least-Privilege Policy JSON
Attach this policy to the IAM user or EC2 Instance Profile:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "UICMSPasswordResetSESAccess",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ses:FromAddress": "noreply@uwiniwin.co.za"
        }
      }
    }
  ]
}
```

### SES Domain / Email Verification:
1. In the **AWS Management Console**, navigate to **Amazon SES** in region **af-south-1 (Cape Town)**.
2. Under **Configuration** -> **Identities**, click **Create identity**.
3. Choose **Domain** and enter `uwiniwin.co.za` (or choose **Email address** and enter `noreply@uwiniwin.co.za`).
4. Add the generated DKIM CNAME records and SPF TXT record (`v=spf1 include:amazonses.com ~all`) to your DNS provider.
5. If in SES Sandbox, ensure recipient test emails are verified or request production access via AWS Support.

---

## 4. Ubuntu AWS Server Deployment Instructions

### Step 1: Install AWS SDK for PHP via Composer
```bash
cd /var/www/html/php-backend
composer require aws/aws-sdk-php
```

### Step 2: Ensure Directory Permissions
```bash
sudo chown -R www-data:www-data /var/www/html/php-backend
sudo chmod -R 755 /var/www/html/php-backend
sudo chmod 600 /var/www/html/php-backend/.env
```

### Step 3: Build & Deploy Frontend
```bash
cd /var/www/html
npm run build
# Ensure Vite build output is served by Apache
sudo cp -r dist/* /var/www/html/
```

### Step 4: Verify Apache Configuration
Ensure `mod_rewrite` and `mod_headers` are active:
```bash
sudo a2enmod rewrite headers
sudo systemctl restart apache2
```

---

## 5. Security Validation & Verification Checklist

- [x] **Rate Limiting:** Maximum 5 reset requests per hour per email or IP address.
- [x] **Attempt Limiting:** Maximum 5 verification code attempts before token lockout.
- [x] **Expiration:** Verification codes strictly expire 15 minutes after issuance.
- [x] **Hashing:** Plaintext codes are never stored; stored as Bcrypt hashes.
- [x] **User Enumeration Defense:** Generic status response returned for all requests.
- [x] **Single-Use Tokens:** Tokens are marked `used = 1` immediately after successful password update.
- [x] **Audit Trail:** All reset actions logged to `activity_logs` with IP and timestamps.
