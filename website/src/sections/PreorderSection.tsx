import { useState } from "react";
import { goToAct } from "../hooks/useStory";

export default function PreorderSection() {
  const [previewNotice, setPreviewNotice] = useState(false);
  return (
    <section
      id="preorder"
      className="join-section"
      aria-labelledby="preorder-title"
    >
      <div className="join-intro">
        <p className="eyebrow">PREORDER</p>
        <h2 id="preorder-title">
          Preorder
          <br />
          <em>First Brew.</em>
        </h2>
        <p className="body-copy">
          Leave your details to hear when First Brew preorders open.
        </p>
        <p className="body-copy join-note">
          We’re building the first working prototype. This registers your
          interest only—no payment, order, or reservation is made.
        </p>
      </div>
      <form
        className="join-form"
        name="preorder-first-brew"
        method="POST"
        action="/"
        data-netlify="true"
        data-netlify-honeypot="bot-field"
        onSubmit={(event) => {
          // Native POST lets Netlify handle receipt and its confirmation page.
          // Never pretend a local Vite response saved someone's contact details.
          if (import.meta.env.DEV) {
            event.preventDefault();
            setPreviewNotice(true);
          }
        }}
      >
        <input type="hidden" name="form-name" value="preorder-first-brew" />
        <div className="form-trap" aria-hidden="true">
          <label>
            Leave this field empty
            <input name="bot-field" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label htmlFor="join-name">Full name</label>
        <input
          id="join-name"
          name="name"
          autoComplete="name"
          maxLength={120}
          required
        />
        <label htmlFor="join-email">Email address</label>
        <input
          id="join-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
        />
        <label htmlFor="join-message">Questions or notes (optional)</label>
        <textarea id="join-message" name="message" rows={4} maxLength={3000} />
        <label className="join-consent">
          <input type="checkbox" name="contact-consent" value="yes" required />
          <span>I agree to receive emails about First Brew preorders.</span>
        </label>
        <button className="action" type="submit">
          REGISTER PREORDER INTEREST <span aria-hidden="true">↗</span>
        </button>
        {previewNotice && (
          <p role="status" className="join-note">
            Local preview: nothing was sent. This form receives submissions
            after Netlify form detection is enabled and the site is deployed.
          </p>
        )}
      </form>
      <footer className="join-footer mono">
        <span>
          © {new Date().getFullYear()} FIRST BREW
        </span>
        <button onClick={() => goToAct(0)}>BACK TO THE OBJECT ↑</button>
      </footer>
    </section>
  );
}
