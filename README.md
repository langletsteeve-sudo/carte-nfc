# Carte NFC

Application web installable sur Android pour créer des cartes de visite entièrement personnalisables et les partager par puce NFC ou QR code. Pas de serveur, pas d'abonnement : tout est hébergé gratuitement sur GitHub Pages.

## Fonctionnement

```
Ton téléphone (app)  --publier-->  GitHub Pages : cards/<id>.json
                                         ^
Puce NFC / QR  --contient le lien-->  https://<toi>.github.io/carte-nfc/c.html?c=<id>
                                         |
Téléphone de l'autre personne  --ouvre-->  ta carte + bouton "Enregistrer le contact" (vCard)
```

La puce ne contient qu'un lien fixe. Quand tu modifies ta carte et que tu publies, le même lien affiche la nouvelle version : **tu n'as jamais à reprogrammer la puce**.

La personne qui reçoit ta carte n'a rien à installer : un iPhone (XS ou plus récent) ou un Android avec le NFC activé ouvre directement la page.

## Mise en ligne (une seule fois, environ 10 minutes)

### 1. Créer le dépôt GitHub
1. Crée un compte sur github.com si tu n'en as pas.
2. Clique sur **New repository**, nomme-le `carte-nfc`, laisse-le en **Public** (GitHub Pages est gratuit pour les dépôts publics), puis **Create repository**.
3. Clique sur **uploading an existing file** et glisse **tout le contenu** du dossier `carte-nfc` (les dossiers `css`, `js`, `icons`, et les fichiers `index.html`, `c.html`, `sw.js`, `manifest.webmanifest`). Valide avec **Commit changes**.

### 2. Activer GitHub Pages
Dans le dépôt : **Settings > Pages > Source : Deploy from a branch > Branch : `main` / `(root)` > Save**.
Une minute plus tard, l'app est en ligne sur `https://<ton-pseudo>.github.io/carte-nfc/`.

### 3. Créer le token de publication
Il permet à l'app de publier tes cartes depuis le téléphone.
1. Va sur github.com/settings/personal-access-tokens/new (token **fine-grained**).
2. **Repository access** : *Only select repositories* > `carte-nfc`.
3. **Permissions > Repository permissions > Contents** : *Read and write*.
4. Choisis une expiration (par exemple 1 an), puis **Generate token** et copie-le.

Le token reste enregistré uniquement sur ton téléphone, et il ne peut écrire que dans ce dépôt.

### 4. Installer l'app sur ton Android
1. Ouvre `https://<ton-pseudo>.github.io/carte-nfc/` dans **Chrome**.
2. Menu ⋮ > **Installer l'application** (ou *Ajouter à l'écran d'accueil*).
3. Onglet **Partager > Réglages GitHub** : le propriétaire et le dépôt sont remplis automatiquement. Colle ton token, puis appuie sur **Tester la connexion**.

## Utilisation

| Onglet | Contenu |
|---|---|
| **Aperçu** | La carte telle que les gens la verront |
| **Infos** | Nom, poste, entreprise, description, téléphones, email, site, adresse, WhatsApp, Telegram, LinkedIn, Instagram, X, Facebook, TikTok, YouTube, GitHub, lien perso |
| **Design** | 8 thèmes, 6 mises en page, alignement, espacement, logo (6 formes, taille, contour, fond), fond uni, dégradé ou image, bannière, 5 motifs, toutes les couleurs, 21 polices (nom et texte séparés), taille et graisse, 4 présentations des liens, 4 styles de boutons, arrondis, ombre, ordre des liens |
| **Partager** | Publication, écriture et vérification de la puce NFC, QR code (téléchargeable), partage du lien |

Tu peux créer plusieurs cartes (bouton +), par exemple une pro et une perso. Chacune a son propre lien. Le menu ⋮ permet de dupliquer une carte, de la supprimer, ou d'exporter et importer une sauvegarde de toutes tes cartes.

### Programmer une puce NFC
1. Publie la carte (onglet **Partager > Publier**).
2. Appuie sur **Écrire sur une puce**, puis colle la puce au dos du téléphone, près de l'appareil photo, jusqu'à la vibration.
3. **Vérifier une puce** confirme qu'elle ouvre bien la bonne carte.

**Quelles puces acheter** : NTAG213, NTAG215 ou NTAG216 (le lien fait environ 50 caractères, une NTAG213 suffit). Elles existent en autocollants, cartes PVC et porte-clés. Sur une coque ou une surface métallique, prends des puces **anti-métal**.

**Option** : une fois la puce écrite, tu peux la verrouiller en lecture seule avec l'app *NXP TagWriter*, pour que personne ne puisse la réécrire. C'est **définitif**. Comme le lien ne change jamais, ça ne gêne pas tes futures modifications, sauf si tu changes l'identifiant de la carte.

## Bon à savoir
- **Tout ce qui est sur une carte publiée est public**, y compris le logo et les images.
- Après une publication, GitHub Pages met environ une minute à afficher la nouvelle version.
- Les cartes sont stockées dans le navigateur du téléphone. Fais un export de sauvegarde (menu ⋮) de temps en temps. Les versions publiées restent aussi dans le dépôt, dans `cards/`.
- L'écriture NFC passe par **Web NFC**, qui ne fonctionne que dans Chrome sur Android et sur la version en ligne (https). Elle ne marche pas sur iPhone ni sur ordinateur.
- Changer l'identifiant d'une carte change son lien. Une puce déjà écrite pointerait alors vers l'ancien lien.
- Les images sont redimensionnées automatiquement : 420 px pour le logo, 1100 px pour le fond.

## Tester sur PC
```
python -m http.server 8765 --directory carte-nfc
```
Puis ouvre http://localhost:8765. Le lien de test (onglet Partager) permet de voir la page publique sans GitHub.

## Fichiers
- `index.html`, `css/app.css`, `js/editor.js` : l'éditeur
- `c.html`, `js/viewer.js` : la page publique que voient les gens
- `js/render.js`, `css/card.css` : le rendu de la carte (commun aux deux) et la vCard
- `js/github.js` : la publication via l'API GitHub
- `js/qr.js` : le QR code
- `sw.js`, `manifest.webmanifest`, `icons/` : l'installation comme application (PWA)
- `cards/` : créé automatiquement à la première publication
