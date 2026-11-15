// netlify/functions/subscribe.js
// Primește un email de la formularul de newsletter de pe cameravar.ro și îl trimite
// în MailerLite, în grupul "MailerLite".
//
// Double opt-in: în MailerLite e pornită opțiunea "Double opt-in for API and integrations"
// (Account settings -> Subscribe settings). Abonatul nou intră ca "unconfirmed" și
// MailerLite îi trimite singur emailul de confirmare. Devine activ după ce dă click.
//
// Variabile de mediu necesare în Netlify (Site configuration -> Environment variables):
//   MAILERLITE_API_KEY, TURNSTILE_SECRET_KEY
//
// Protecție anti-robot: fiecare cerere trebuie să aibă un token Cloudflare Turnstile
// valid (widget-ul "cameravar-abonare"). Fără token valid, nu se trimite nimic în MailerLite.

const GROUP_NAME = "MailerLite";
const ML_API = "https://connect.mailerlite.com/api";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let email = "";
  let website = "";
  let token = "";
  try {
    const body = JSON.parse(event.body || "{}");
    email = String(body.email || "").trim().toLowerCase();
    website = String(body.website || "");
    token = String(body.token || "");
  } catch {
    return json(400, { error: "Cerere invalidă." });
  }

  // Honeypot anti-spam: câmp ascuns pe care oamenii nu-l văd.
  // Dacă e completat, e aproape sigur un bot — ne prefacem că a mers, fără să chemăm API-ul.
  if (website) {
    return json(200, { ok: true });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: "Adresă de email invalidă." });
  }

  // Verificare Cloudflare Turnstile.
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (!turnstileSecret) {
    console.error("Lipsește variabila TURNSTILE_SECRET_KEY din environment.");
    return json(500, { error: "Configurare lipsă pe server." });
  }
  if (!token) {
    return json(400, { error: "Verificarea anti-robot nu s-a terminat. Așteaptă o secundă și apasă din nou." });
  }
  try {
    const form = new URLSearchParams();
    form.append("secret", turnstileSecret);
    form.append("response", token);
    const ip = event.headers["x-nf-client-connection-ip"];
    if (ip) form.append("remoteip", ip);
    const vr = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const vdata = await vr.json().catch(() => ({}));
    if (!vdata.success) {
      console.warn("Turnstile respins:", JSON.stringify(vdata["error-codes"] || []));
      return json(400, { error: "Verificarea anti-robot a eșuat. Reîncarcă pagina și încearcă din nou." });
    }
  } catch (err) {
    console.error("Eroare la verificarea Turnstile:", err);
    return json(502, { error: "Nu am putut verifica cererea. Mai încearcă o dată." });
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    console.error("Lipsește variabila MAILERLITE_API_KEY din environment.");
    return json(500, { error: "Configurare lipsă pe server." });
  }
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    // Găsim ID-ul grupului după nume.
    const gr = await fetch(`${ML_API}/groups?filter[name]=${encodeURIComponent(GROUP_NAME)}&limit=50`, { headers });
    const gdata = await gr.json().catch(() => ({}));
    const group = (gdata.data || []).find((g) => g.name === GROUP_NAME);
    if (!gr.ok || !group) {
      console.error("Nu am găsit grupul în MailerLite:", gr.status, JSON.stringify(gdata));
      return json(502, { error: "Nu am putut procesa abonarea. Mai încearcă o dată." });
    }

    // Adăugăm (sau actualizăm) abonatul și îl punem în grup.
    const res = await fetch(`${ML_API}/subscribers`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, groups: [String(group.id)] }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      return json(200, { ok: true });
    }

    console.error("MailerLite a răspuns cu eroare:", res.status, JSON.stringify(data));
    if (res.status === 422) {
      return json(400, { error: "Adresă de email invalidă." });
    }
    return json(502, { error: "Nu am putut procesa abonarea. Mai încearcă o dată." });
  } catch (err) {
    console.error("Eroare în funcția subscribe:", err);
    return json(500, { error: "Eroare de server. Mai încearcă o dată." });
  }
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}
