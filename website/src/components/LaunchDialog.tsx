import { useRef, useState, useEffect } from "react";
import { copyFor, type Language } from "../i18n";
export default function LaunchDialog({
  language,
  open,
  onClose,
}: {
  language: Language;
  open: boolean;
  onClose: () => void;
}) {
  const copy = copyFor(language);
  const ref = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const endpoint = import.meta.env.VITE_LAUNCH_ENDPOINT as string | undefined;
  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="launch-dialog"
      aria-labelledby="dialog-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) {
          const b = ref.current!.getBoundingClientRect();
          if (
            e.clientX < b.left ||
            e.clientX > b.right ||
            e.clientY < b.top ||
            e.clientY > b.bottom
          )
            onClose();
        }
      }}
    >
      <button
        className="close-dialog"
        aria-label={copy.dialogClose}
        onClick={onClose}
      >
        ×
      </button>
      <span className="mono">{copy.earlyDays}</span>
      <h2 id="dialog-title">{copy.dialogTitle}</h2>
      {endpoint ? (
        status === "success" ? (
          <p role="status">{copy.subscribed}</p>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (status === "sending") return;
              const email = new FormData(e.currentTarget).get("email");
              setStatus("sending");
              try {
                const response = await fetch(endpoint, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });
                if (!response.ok) throw new Error("Subscription failed");
                setStatus("success");
              } catch {
                setStatus("error");
              }
            }}
          >
            <p>{copy.emailIntro}</p>
            <label htmlFor="email">{copy.email}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              maxLength={254}
            />
            <p className="form-note">{copy.consent}</p>
            <button className="action" disabled={status === "sending"}>
              {status === "sending" ? copy.submitting : copy.keepPosted}{" "}
              <span>↗</span>
            </button>
            {status === "error" && <p role="alert">{copy.subscribeError}</p>}
          </form>
        )
      ) : (
        <>
          <p>{copy.signupSoon}</p>
          <p className="form-note">{copy.noCollection}</p>
          <button className="action" onClick={onClose}>
            {copy.backToFirstBrew} <span>↗</span>
          </button>
        </>
      )}
    </dialog>
  );
}
