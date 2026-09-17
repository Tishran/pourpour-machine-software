import { useRef, useState, useEffect } from "react";
export default function LaunchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
        aria-label="Close launch updates"
        onClick={onClose}
      >
        ×
      </button>
      <span className="mono">FIRST BREW / EARLY DAYS</span>
      <h2 id="dialog-title">
        The next
        <br />
        chapter.
      </h2>
      {endpoint ? (
        status === "success" ? (
          <p role="status">
            You’re on the list. We’ll email you when First Brew is ready for its
            next chapter.
          </p>
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
            <p>Leave your email for prototype and launch updates.</p>
            <label htmlFor="email">EMAIL ADDRESS</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              maxLength={254}
            />
            <p className="form-note">
              By subscribing, you agree to receive First Brew updates.
              You can unsubscribe at any time.
            </p>
            <button className="action" disabled={status === "sending"}>
              {status === "sending" ? "SUBMITTING…" : "KEEP ME POSTED"}{" "}
              <span>↗</span>
            </button>
            {status === "error" && (
              <p role="alert">We couldn’t save your email. Please try again.</p>
            )}
          </form>
        )
      ) : (
        <>
          <p>
            We’re building the first working prototype. Launch sign-ups will
            open here once our mailing list is ready.
          </p>
          <p className="form-note">
            This preview does not collect email addresses.
          </p>
          <button className="action" onClick={onClose}>
            BACK TO FIRST BREW <span>↗</span>
          </button>
        </>
      )}
    </dialog>
  );
}
