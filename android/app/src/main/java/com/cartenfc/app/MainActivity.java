package com.cartenfc.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.nfc.FormatException;
import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.TagLostException;
import android.nfc.tech.Ndef;
import android.nfc.tech.NdefFormatable;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Coquille Android de l'app Carte NFC : sert l'app web embarquée (assets/web) depuis une
 * origine https locale, et fournit à la page un pont natif (NFC, fichiers, partage, liens).
 */
public class MainActivity extends Activity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/index.html";
    private static final int REQ_FILE = 42;

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private NfcAdapter nfc;
    private volatile String nfcMode;   // "write", "read" ou null
    private volatile String nfcUrl;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        nfc = NfcAdapter.getDefaultAdapter(this);

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setMediaPlaybackRequiresUserGesture(true);

        web.addJavascriptInterface(new Bridge(), "CarteNFC");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                return serveAsset(u.getPath());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (HOST.equals(u.getHost())) return false;
                openExternal(u.toString());
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                String[] types = params.getAcceptTypes();
                boolean image = types != null && types.length > 0 && types[0] != null && types[0].startsWith("image/");
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType(image ? "image/*" : "*/*");
                try {
                    startActivityForResult(Intent.createChooser(i, image ? "Choisir une image" : "Choisir un fichier"), REQ_FILE);
                    return true;
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    return false;
                }
            }
        });

        web.loadUrl(START_URL);
    }

    // ---------- Fichiers de l'app web ----------

    private WebResourceResponse serveAsset(String path) {
        if (path == null || path.isEmpty() || path.equals("/")) path = "/index.html";
        if (path.contains("..")) return notFound();
        try {
            InputStream in = getAssets().open("web" + path);
            String mime = mimeOf(path);
            boolean text = mime.startsWith("text/") || mime.contains("json") || mime.contains("javascript") || mime.contains("svg");
            return new WebResourceResponse(mime, text ? "utf-8" : null, in);
        } catch (IOException e) {
            return notFound();
        }
    }

    private static WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null,
                new ByteArrayInputStream("404".getBytes(StandardCharsets.UTF_8)));
    }

    private static String mimeOf(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "text/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".webmanifest")) return "application/manifest+json";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }

    private void openExternal(String url) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (ActivityNotFoundException ignored) {
            // aucun navigateur : rien à faire
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_FILE || fileCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null && data.getData() != null) result = new Uri[]{data.getData()};
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    // ---------- NFC ----------

    @Override
    protected void onResume() {
        super.onResume();
        if (nfcMode != null) enableReader();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (nfc != null) {
            try { nfc.disableReaderMode(this); } catch (Exception ignored) { }
        }
    }

    private void startNfc(String mode, String url) {
        if (nfc == null) { sendNfc("err", "Ce téléphone n'a pas de NFC."); return; }
        if (!nfc.isEnabled()) { sendNfc("err", "Le NFC est désactivé : active-le dans les paramètres."); return; }
        nfcMode = mode;
        nfcUrl = url;
        enableReader();
    }

    private void enableReader() {
        if (nfc == null) return;
        Bundle extras = new Bundle();
        extras.putInt(NfcAdapter.EXTRA_READER_PRESENCE_CHECK_DELAY, 250);
        int flags = NfcAdapter.FLAG_READER_NFC_A | NfcAdapter.FLAG_READER_NFC_B
                | NfcAdapter.FLAG_READER_NFC_F | NfcAdapter.FLAG_READER_NFC_V;
        nfc.enableReaderMode(this, this::onTag, flags, extras);
    }

    private void stopNfc() {
        nfcMode = null;
        nfcUrl = null;
        if (nfc != null) {
            try { nfc.disableReaderMode(this); } catch (Exception ignored) { }
        }
    }

    /** Appelé sur un thread binder quand une puce est détectée en mode lecteur. */
    private void onTag(Tag tag) {
        String mode = nfcMode;
        String url = nfcUrl;
        if (mode == null) return;
        try {
            if ("write".equals(mode)) {
                writeTag(tag, url);
                finishNfc("ok", url);
            } else {
                finishNfc("ok", readTag(tag));
            }
        } catch (TagLostException e) {
            finishNfc("err", "Puce retirée trop tôt : garde-la collée au téléphone et réessaie.");
        } catch (IOException e) {
            String m = e.getMessage();
            finishNfc("err", m != null && !m.isEmpty() ? m : "Communication avec la puce interrompue, réessaie.");
        } catch (Exception e) {
            finishNfc("err", "Erreur NFC : " + e.getClass().getSimpleName());
        }
    }

    private void writeTag(Tag tag, String url) throws IOException, FormatException {
        NdefMessage msg = new NdefMessage(new NdefRecord[]{NdefRecord.createUri(url)});
        Ndef ndef = Ndef.get(tag);
        if (ndef != null) {
            ndef.connect();
            try {
                if (!ndef.isWritable()) throw new IOException("Cette puce est verrouillée en lecture seule.");
                if (ndef.getMaxSize() < msg.toByteArray().length) throw new IOException("Puce trop petite pour ce lien.");
                ndef.writeNdefMessage(msg);
            } finally {
                try { ndef.close(); } catch (IOException ignored) { }
            }
            return;
        }
        NdefFormatable formatable = NdefFormatable.get(tag);
        if (formatable == null) throw new IOException("Puce non compatible (prends des NTAG213, 215 ou 216).");
        formatable.connect();
        try {
            formatable.format(msg);
        } finally {
            try { formatable.close(); } catch (IOException ignored) { }
        }
    }

    private String readTag(Tag tag) throws IOException, FormatException {
        Ndef ndef = Ndef.get(tag);
        if (ndef == null) return "";
        NdefMessage msg = ndef.getCachedNdefMessage();
        if (msg == null) {
            ndef.connect();
            try { msg = ndef.getNdefMessage(); } finally {
                try { ndef.close(); } catch (IOException ignored) { }
            }
        }
        if (msg == null) return "";
        List<String> out = new ArrayList<>();
        for (NdefRecord r : msg.getRecords()) {
            Uri u = r.toUri();
            if (u != null) { out.add(u.toString()); continue; }
            if (r.getTnf() == NdefRecord.TNF_WELL_KNOWN && java.util.Arrays.equals(r.getType(), NdefRecord.RTD_TEXT)) {
                byte[] p = r.getPayload();
                if (p.length == 0) continue;
                int langLen = p[0] & 0x3F;
                boolean utf16 = (p[0] & 0x80) != 0;
                if (1 + langLen <= p.length) {
                    out.add(new String(p, 1 + langLen, p.length - 1 - langLen,
                            utf16 ? StandardCharsets.UTF_16 : StandardCharsets.UTF_8));
                }
            }
        }
        return String.join("\n", out);
    }

    private void finishNfc(String kind, String text) {
        runOnUiThread(() -> {
            stopNfc();
            sendNfc(kind, text);
        });
    }

    private void sendNfc(String kind, String text) {
        String js = "window.__cnfcNfc && window.__cnfcNfc(" + JSONObject.quote(kind) + "," + JSONObject.quote(text) + ")";
        web.post(() -> web.evaluateJavascript(js, null));
    }

    // ---------- Pont JavaScript ----------

    private class Bridge {
        @JavascriptInterface
        public String nfcState() {
            if (nfc == null) return "none";
            return nfc.isEnabled() ? "on" : "off";
        }

        @JavascriptInterface
        public void nfcSettings() {
            runOnUiThread(() -> {
                try { startActivity(new Intent(Settings.ACTION_NFC_SETTINGS)); }
                catch (ActivityNotFoundException e) { startActivity(new Intent(Settings.ACTION_WIRELESS_SETTINGS)); }
            });
        }

        @JavascriptInterface
        public void nfcWrite(String url) {
            runOnUiThread(() -> startNfc("write", url));
        }

        @JavascriptInterface
        public void nfcRead() {
            runOnUiThread(() -> startNfc("read", null));
        }

        @JavascriptInterface
        public void nfcCancel() {
            runOnUiThread(MainActivity.this::stopNfc);
        }

        @JavascriptInterface
        public void openUrl(String url) {
            runOnUiThread(() -> openExternal(url));
        }

        @JavascriptInterface
        public void share(String title, String url) {
            runOnUiThread(() -> {
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("text/plain");
                send.putExtra(Intent.EXTRA_SUBJECT, title);
                send.putExtra(Intent.EXTRA_TEXT, url);
                startActivity(Intent.createChooser(send, "Partager ma carte"));
            });
        }

        @JavascriptInterface
        public void copy(String text) {
            runOnUiThread(() -> {
                ClipboardManager cm = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("Carte NFC", text));
            });
        }

        /** Enregistre un fichier dans Téléchargements/Carte NFC. Renvoie un message pour l'utilisateur. */
        @JavascriptInterface
        public String saveFile(String name, String mime, String base64) {
            try {
                byte[] data = Base64.decode(base64, Base64.DEFAULT);
                String safe = name.replaceAll("[\\\\/:*?\"<>|]", "_");
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Downloads.DISPLAY_NAME, safe);
                    v.put(MediaStore.Downloads.MIME_TYPE, mime);
                    v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Carte NFC");
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    if (uri == null) return "Impossible d'enregistrer le fichier.";
                    try (OutputStream os = getContentResolver().openOutputStream(uri)) {
                        if (os == null) return "Impossible d'enregistrer le fichier.";
                        os.write(data);
                    }
                    return "Enregistré dans Téléchargements/Carte NFC/" + safe;
                }
                File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                File f = new File(dir, safe);
                try (FileOutputStream os = new FileOutputStream(f)) { os.write(data); }
                return "Enregistré dans " + f.getAbsolutePath();
            } catch (Exception e) {
                return "Échec de l'enregistrement : " + e.getMessage();
            }
        }
    }
}
