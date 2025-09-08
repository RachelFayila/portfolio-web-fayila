const fs = require('fs');
const cheerio = require('cheerio');
const glob = require('glob');

// ========================
// Dictionnaire enrichi
// ========================
const rules = [
  // --- HTML ---
  { match: "must be self closed", message: "❌ **Balise auto-fermante incorrecte** : certaines balises doivent se terminer par `/>`. 💡 Exemple : `<img src='...' />`." },
  { match: "Tag must be paired", message: "❌ **Balise non fermée** : chaque balise ouvrante doit avoir une balise fermante." },
  { match: "alt attribute must be present", message: "❌ **Attribut `alt` manquant** : chaque image `<img>` doit avoir un texte alternatif." },
  { match: "The <script> tag cannot be used in a <head> tag", message: "❌ **Balise `<script>` mal placée** : ne mettez pas vos scripts dans `<head>`. 💡 Placez-les avant `</body>`." },
  { match: "Special characters must be escaped", message: "❌ **Caractères spéciaux non échappés** : certains caractères doivent être remplacés par leur équivalent HTML." },
  { match: "Duplicate meta charset", message: "❌ **Meta charset dupliqué** : une seule balise `<meta charset='UTF-8'>` est autorisée." },
  { match: "Missing doctype", message: "❌ **Doctype manquant** : ajoutez `<!DOCTYPE html>` en haut du fichier." },
  { match: "Missing lang attribute", message: "❌ **Attribut `lang` manquant** sur `<html>`. 💡 Exemple : `<html lang='fr'>`." },
  { match: "Heading levels should only increase by one", message: "❌ **Mauvaise hiérarchie de titres** : n’utilisez pas `<h3>` directement après `<h1>`." },
  { match: "The <section> element should have a heading", message: "❌ **Section sans titre** : chaque `<section>` doit contenir un titre (`<h1>`, `<h2>`, etc.)." },
  { match: "Attribute name must be lowercase", message: "❌ **Nom d'attribut en majuscule** : les attributs doivent être en minuscules." },
  { match: "Attribute value must be in double quotes", message: "❌ **Valeur d'attribut mal formatée** : utilisez toujours des guillemets doubles autour des valeurs d'attribut." },
  { match: "Duplicate attribute", message: "❌ **Attribut dupliqué** sur une même balise." },
  { match: "The value of attribute", message: "❌ **Valeur d'attribut incorrecte ou dangereuse**." },
  { match: "Inline style is not allowed", message: "❌ **Style inline interdit** : n'utilisez pas de `style=\"...\"` dans vos balises." },
  { match: "Inline script is not allowed", message: "❌ **Script inline interdit**." },
  { match: "Space and tab mixed in indentation", message: "❌ **Indentation mixte** : mélange d'espaces et de tabulations." },
  { match: "ID must be unique", message: "❌ **ID dupliqué** : chaque ID doit être unique dans la page." },
  { match: "Tag name must be lowercase", message: "❌ **Nom de balise en majuscule** : utilisez des minuscules." },
  { match: "The src attribute of", message: "❌ **Attribut `src` vide ou incorrect**." },
  { match: "title must be present in", message: "❌ **Titre manquant** : ajoutez une balise `<title>` dans `<head>`." },
  { match: "img alt attribute must be present", message: "❌ **Attribut `alt` manquant sur une image**." },
  { match: "href attribute must be absolute or relative", message: "❌ **Lien `href` mal formaté**." },
  { match: "input elements must have labels", message: "❌ **Champ `<input>` sans label**." },
  { match: "label elements must have for attribute", message: "❌ **Label sans attribut `for`**." },

  // --- CSS ---
  { match: "unexpected missing semicolon", message: "❌ **Point-virgule manquant** : il manque un `;` à la fin de la déclaration." },
  { match: "unexpected hex color", message: "❌ **Couleur hexadécimale invalide**." },
  { match: "unknown property", message: "❌ **Propriété CSS inconnue** : vérifiez l'orthographe." },
  { match: "unexpected unit", message: "❌ **Unité inattendue dans une propriété**." },
  { match: "duplicate property", message: "❌ **Propriété dupliquée** : évitez de répéter la même règle." },
  { match: "unexpected unknown pseudo-class", message: "❌ **Pseudo-classe inconnue** : vérifiez l’orthographe." },
  { match: "unexpected empty source", message: "❌ **Fichier CSS vide**." },
  { match: "unexpected extra semicolon", message: "❌ **Point-virgule en trop**." },
  { match: "unknown word", message: "❌ **Mot inconnu en CSS** : erreur de syntaxe probable." },
  { match: "expected a leading zero", message: "❌ **Zéro manquant avant la décimale**." },
  { match: "unexpected duplicate selector", message: "❌ **Sélecteur dupliqué**." },
  { match: "expected single space after", message: "❌ **Problème d'espacement après une propriété CSS**." },
  { match: "expected closing brace", message: "❌ **Accolade fermante manquante**." },
  { match: "no unknown at-rules", message: "❌ **At-rule inconnu**." },
  { match: "selector should be written in lowercase", message: "❌ **Sélecteur en majuscule** : utilisez des minuscules." },
  { match: "unexpected vendor-prefix", message: "❌ **Préfixe navigateur interdit**." },
  { match: "expected a selector", message: "❌ **Sélecteur manquant ou mal formé**." },
  { match: "unknown property", message: "❌ **Propriété CSS inconnue** : vérifiez l'orthographe." },
  { match: "unexpected unknown property", message: "❌ **Propriété CSS inconnue** : vérifiez l'orthographe." },
  { match: "is not a known property", message: "❌ **Propriété CSS inconnue** : vérifiez l'orthographe." },
  { match: "unknown value", message: "❌ **Valeur inconnue pour une propriété CSS** : vérifiez la valeur utilisée." },
  { match: "unknown unit", message: "❌ **Unité CSS inconnue** : vérifiez l'unité utilisée." },
  { match: "to come before", message: "❌ **Ordre des propriétés CSS incorrect** : respectez l'ordre recommandé." },
  { match: "unknown rule", message: "❌ **Cette règle n'est pas détectée par Stylelint** : vérifiez votre configuration Stylelint." },

  // --- Git ---
  { match: "header-max-length", message: "❌ **Message de commit trop long** : limitez à 100 caractères." },
  { match: "scope-enum", message: "❌ **Scope de commit invalide** : utilisez un scope autorisé (frontend, backend, docs, tests, chore, refactor, style, fix, feat)." },
  { match: "branch-name", message: "❌ **Nom de branche invalide pour le commit**." },
  { match: "type may not be empty", message: "❌ **Type de commit manquant**." },
  { match: "type must be one of", message: "❌ **Type de commit invalide**." },
  { match: "subject may not be empty", message: "❌ **Message de commit vide**." },
  { match: "subject may not be sentence-case", message: "❌ **Le sujet du commit doit commencer par une minuscule**." },
  { match: "subject may not end with", message: "❌ **Le sujet du commit ne doit pas finir par un point**." }
];

// ========================
// Fonction de parsing
// ========================
function parseErrors(inputFile, outputFile, sectionTitle) {
  let content = '';
  try {
    content = fs.readFileSync(inputFile, 'utf-8');
  } catch (e) {
    content = '';
  }
  content = content.replace(/\u001b\[.*?m/g, '');
  const lines = content.split('\n');
  let feedbacks = {};
  let hasError = false;
  lines.forEach(line => {
    rules.forEach(rule => {
      if (line.toLowerCase().includes(rule.match.toLowerCase())) {
        hasError = true;
        if (!feedbacks[rule.message]) feedbacks[rule.message] = [];
        // Recherche du numéro de ligne (pour Stylelint/HTMLHint)
        const m = line.match(/(\d+):(\d+)/);
        if (m) feedbacks[rule.message].push(`ligne ${m[1]}`);
      }
    });
  });
  let feedback = `# ${sectionTitle}\n\n`;
  if (!hasError) {
    feedback += "✅ Aucun problème détecté ! 🎉\n";
  } else {
    Object.entries(feedbacks).forEach(([msg, occurences]) => {
      feedback += `- ${msg}`;
      if (occurences.length > 0) {
        feedback += ` (${occurences.join(', ')})`;
      }
      feedback += '\n\n';
    });
  }
  fs.writeFileSync(outputFile, feedback, 'utf-8');
  console.log(`Feedback généré dans ${outputFile}`);
}

// --- Appels principaux ---
parseErrors('html-report.txt', 'html-feedback.md', 'Feedback HTML');
parseErrors('css-report.txt', 'css-feedback.md', 'Feedback CSS');
parseErrors('commit-report.txt', 'commit-feedback.md', 'Feedback Commit');

// --- Vérification des <section> sans titre (h1-h6) ---
let sectionErrors = [];
const htmlFiles = glob.sync('*.html'); // ou adapte le pattern si besoin
htmlFiles.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  const $ = cheerio.load(html);
  $('section').each((i, section) => {
    const hasTitle = $(section).find('h1,h2,h3,h4,h5,h6').length > 0;
    if (!hasTitle) {
      sectionErrors.push(`❌ Dans ${file} : la balise <section> n°${i + 1} ne contient pas de titre (h1-h6).`);
    }
  });
});

let sectionFeedback = "# Feedback Sections HTML\n\n";
if (sectionErrors.length === 0) {
  sectionFeedback += "✅ Toutes les sections contiennent un titre.\n";
} else {
  sectionErrors.forEach(err => {
    sectionFeedback += `- ${err}\n`;
  });
}
fs.writeFileSync('section-title-feedback.md', sectionFeedback, 'utf-8');

// --- Génération du feedback final ---
function safeRead(file) {
  try {
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '';
  } catch (e) {
    return '';
  }
}

const final = [
  safeRead('html-feedback.md'),
  safeRead('css-feedback.md'),
  safeRead('commit-feedback.md'),
  safeRead('section-title-feedback.md')
].join('\n\n');

fs.writeFileSync('feedback.md', final, 'utf-8');
