<?php
/* =====================================================================
   Bluneuron — early-access form handler
   Appends every submission to data/leads.csv on this same hosting.
   No third-party service, no account. Works on GoDaddy cPanel / any
   PHP host. View leads: cPanel -> File Manager -> public_html/data/leads.csv
   ===================================================================== */

/* ---- CHANGE THIS to the address that should get an email per signup.
        Set to '' (empty) to disable email and only use the CSV. ---- */
$NOTIFY_EMAIL = 'hello@bluneuron.com';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

/* Accept a JSON body (from fetch) or a normal form POST */
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { $data = $_POST; }

$name    = trim((string)($data['name']    ?? ''));
$email   = trim((string)($data['email']   ?? ''));
$phone   = trim((string)($data['phone']   ?? ''));
$company = trim((string)($data['company'] ?? '')); // honeypot — must stay empty

$isAjax = (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false)
       || (strtolower($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'xmlhttprequest');

$done = function (bool $ok, string $error = '') use ($isAjax) {
    if ($isAjax) {
        if (!$ok) { http_response_code($error === 'A valid email is required' ? 422 : 500); }
        echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $error]);
    } else {
        $back = $_SERVER['HTTP_REFERER'] ?? '/';
        $back .= (strpos($back, '?') === false ? '?' : '&') . ($ok ? 'sent=1' : 'error=1');
        header('Location: ' . $back);
    }
    exit;
};

/* Silently accept bot submissions (honeypot filled) so they stop retrying */
if ($company !== '') { $done(true); }

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $done(false, 'A valid email is required');
}

$name  = mb_substr($name, 0, 120);
$phone = mb_substr(preg_replace('/[^\d+\-\s()]/', '', $phone), 0, 40);

/* ---- Store to CSV ---- */
$dir = __DIR__ . '/data';
if (!is_dir($dir)) { @mkdir($dir, 0755, true); }

/* keep the data folder unreadable from the web (belt & braces) */
$ht = $dir . '/.htaccess';
if (!file_exists($ht)) {
    @file_put_contents($ht,
        "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n" .
        "<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
}
if (!file_exists($dir . '/index.html')) { @file_put_contents($dir . '/index.html', ''); }

$file = $dir . '/leads.csv';
$isNew = !file_exists($file);

$fh = @fopen($file, 'a');
if ($fh === false) { $done(false, 'Could not save right now'); }

flock($fh, LOCK_EX);
if ($isNew) {
    fputcsv($fh, ['timestamp_utc', 'name', 'email', 'phone', 'ip', 'user_agent']);
}
fputcsv($fh, [
    gmdate('Y-m-d H:i:s'),
    $name,
    $email,
    $phone,
    $_SERVER['REMOTE_ADDR'] ?? '',
    mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 200),
]);
flock($fh, LOCK_UN);
fclose($fh);

/* ---- Optional: email a copy of each signup ---- */
if ($NOTIFY_EMAIL !== '') {
    $host    = $_SERVER['HTTP_HOST'] ?? 'bluneuron.com';
    $subject = 'New Bluneuron early-access signup';
    $body    = "Name:  {$name}\nEmail: {$email}\nPhone: {$phone}\nTime:  " . gmdate('Y-m-d H:i:s') . " UTC\n";
    $headers = "From: no-reply@{$host}\r\nReply-To: {$email}\r\nContent-Type: text/plain; charset=utf-8\r\n";
    @mail($NOTIFY_EMAIL, $subject, $body, $headers);
}

$done(true);
