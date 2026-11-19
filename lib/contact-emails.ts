import { contactEmail, type Inquiry } from "./contact";

const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const paragraph = (text: string) => `<p style="line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere">${escape(text)}</p>`;
function frame(title: string, content: string) {
  return `<!doctype html><html><body style="margin:0;background:#f3f1ec;color:#242923;font-family:Arial,sans-serif"><main style="max-width:600px;margin:24px auto;padding:32px;background:#fff;border-top:4px solid #44624b"><p style="font-size:12px;letter-spacing:2px;color:#44624b">MAURICE GARCIA</p><h1 style="font-size:26px;line-height:1.3">${escape(title)}</h1>${content}<hr style="border:0;border-top:1px solid #e4e4df;margin:28px 0"><p style="font-size:12px;color:#626961">mauricegarcia.com · Experience Engineer</p></main></body></html>`;
}

/** The owner notification (with the message) and the visitor confirmation (without it). All visitor text is escaped. */
export function contactEmails(inquiry: Inquiry, now = new Date()) {
  const received = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" }) + " Pacific";
  const who = inquiry.name || inquiry.email;
  const details = [
    ["Name", inquiry.name], ["Email", inquiry.email], ["Received", received], ["Source", "mauricegarcia.com/connect"],
  ].filter((row): row is [string, string] => Boolean(row[1]));
  const rows = details.map(([key, value]) => `<tr><th scope="row" style="text-align:left;vertical-align:top;padding:8px 12px 8px 0;color:#626961">${escape(key)}</th><td style="padding:8px 0;overflow-wrap:anywhere">${escape(value)}</td></tr>`).join("");
  const reply = `mailto:${encodeURIComponent(inquiry.email)}?subject=${encodeURIComponent("Re: your message")}`;
  const owner = {
    subject: `Website message from ${who}`,
    text: [`Website message from ${who}`, "", "Message:", inquiry.message, "", ...details.map(([key, value]) => `${key}: ${value}`), "", `Reply to: ${inquiry.email}`].join("\n"),
    html: frame(`New message from ${who}`, paragraph(inquiry.message) + `<p><a href="${escape(reply)}" style="display:inline-block;background:#44624b;color:white;padding:12px 20px;text-decoration:none;border-radius:6px">Reply to ${escape(who)}</a></p><h2 style="font-size:18px">Details</h2><table role="table" style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>`),
  };
  // The confirmation goes to an address the visitor typed and nobody has verified. So it never repeats anything
  // they wrote (name or message): otherwise the form could be used to make this domain send arbitrary text to a stranger.
  const confirmation = `Thanks for reaching out! Your message made it to my inbox. I'll read it and get back to you when I can.\n\nIf there's anything you'd like to add, just reply to this email.\n\n— Mo\nMaurice Garcia`;
  const notYou = "If you didn't send a message through mauricegarcia.com, you can ignore this email.";
  const visitor = {
    subject: "Thanks for reaching out — Maurice Garcia",
    text: `${confirmation}\n\nThis is an automatic confirmation from mauricegarcia.com. ${notYou} Reply to ${contactEmail}.`,
    html: frame("Your message is in my inbox.", paragraph(confirmation) + paragraph(`This is an automatic confirmation from mauricegarcia.com. ${notYou}`)),
  };
  return { owner, visitor };
}
