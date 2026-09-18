/**
 * MemoLib — Ingestion des demandes clients depuis Google Sheets.
 *
 * ⚠️ Ce fichier s'exécute dans Google Apps Script (script.google.com), PAS dans
 * MemoLib. Il est fourni ici comme référence versionnée.
 *
 * Rôle : pour chaque nouvelle ligne du Sheet, envoyer une requête SIGNÉE au
 * webhook MemoLib POST /api/webhooks/intake-sheet, qui crée une IntakeRequest.
 *
 * ── Installation ──────────────────────────────────────────────────────────
 * 1. Ouvrir le Google Sheet → Extensions → Apps Script.
 * 2. Coller ce code.
 * 3. Renseigner les Script Properties (Projet → Paramètres du projet →
 *    Propriétés du script) :
 *      - MEMOLIB_WEBHOOK_URL   = https://<app>/api/webhooks/intake-sheet
 *      - INTAKE_WEBHOOK_SECRET = <même secret que côté MemoLib>
 *      - TENANT_SUBDOMAIN      = <sous-domaine du cabinet>
 * 4. Créer un déclencheur : onFormSubmit (ou onEdit / déclencheur horaire).
 *
 * ── Format attendu du Sheet ─────────────────────────────────────────────────
 * Colonnes (ligne d'en-tête) : Type | Email | Nom | DateNaissance | ...
 * La colonne "Type" doit valoir OQTF / Asile / TitreSejour.
 * Une colonne technique "MemoLibSync" est ajoutée pour marquer les lignes déjà
 * envoyées (évite les doublons ; la dédup est aussi assurée côté serveur par
 * rowId).
 */

function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('MEMOLIB_WEBHOOK_URL');
  var secret = props.getProperty('INTAKE_WEBHOOK_SECRET');
  var tenant = props.getProperty('TENANT_SUBDOMAIN');
  if (!url || !secret || !tenant) {
    throw new Error('Config manquante : MEMOLIB_WEBHOOK_URL, INTAKE_WEBHOOK_SECRET, TENANT_SUBDOMAIN');
  }
  return { url: url, secret: secret, tenant: tenant };
}

/** Signature HMAC-SHA256 du corps brut → "sha256=<hex>". */
function sign_(rawBody, secret) {
  var bytes = Utilities.computeHmacSha256Signature(rawBody, secret);
  var hex = bytes
    .map(function (b) {
      var v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? '0' + v : v;
    })
    .join('');
  return 'sha256=' + hex;
}

/** Envoie une ligne au webhook MemoLib. */
function sendRow_(rowObject, rowId) {
  var cfg = getConfig_();

  var payload = {
    tenantSubdomain: cfg.tenant,
    type: String(rowObject.Type || 'OQTF'),
    rowId: String(rowId),
    clientEmail: rowObject.Email ? String(rowObject.Email) : undefined,
    data: rowObject,
  };

  var rawBody = JSON.stringify(payload);
  var signature = sign_(rawBody, cfg.secret);

  var response = UrlFetchApp.fetch(cfg.url, {
    method: 'post',
    contentType: 'application/json',
    payload: rawBody,
    headers: { 'x-webhook-signature': signature },
    muteHttpExceptions: true,
  });

  var code = response.getResponseCode();
  if (code !== 201 && code !== 200) {
    throw new Error('MemoLib a répondu ' + code + ' : ' + response.getContentText());
  }
  return JSON.parse(response.getContentText());
}

/**
 * Parcourt les lignes non synchronisées et les envoie.
 * À appeler manuellement ou via un déclencheur horaire.
 */
function syncPendingRows() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 2) return;

  var headers = values[0];
  var syncColIndex = headers.indexOf('MemoLibSync');
  if (syncColIndex === -1) {
    syncColIndex = headers.length;
    sheet.getRange(1, syncColIndex + 1).setValue('MemoLibSync');
  }

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (row[syncColIndex]) continue; // déjà synchronisé

    var rowObject = {};
    for (var c = 0; c < headers.length; c++) {
      if (headers[c] && headers[c] !== 'MemoLibSync') {
        rowObject[headers[c]] = row[c];
      }
    }

    // rowId stable : basé sur le n° de ligne (aligné avec la dédup serveur).
    var rowId = 'sheet-row-' + (r + 1);
    try {
      sendRow_(rowObject, rowId);
      sheet.getRange(r + 1, syncColIndex + 1).setValue(new Date().toISOString());
    } catch (err) {
      sheet.getRange(r + 1, syncColIndex + 1).setValue('ERREUR: ' + err.message);
    }
  }
}

/** Déclencheur recommandé : à la soumission d'un formulaire lié au Sheet. */
function onFormSubmit(e) {
  syncPendingRows();
}
