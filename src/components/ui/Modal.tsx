import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl'
} as const;

export type ModalSize = keyof typeof SIZES;

type ModalProps = {
  /** Called on Esc, backdrop click, or the header ✕ (unless dismissable=false). */
  onClose: () => void;
  /** Dialog title — rendered in the header bar and wired to aria-labelledby. */
  title: ReactNode;
  children: ReactNode;
  size?: ModalSize;
  /** Extra header controls, placed left of the ✕ (e.g. a Rollback action). */
  headerActions?: ReactNode;
  /** Backdrop-click + Esc close. Off for destructive-confirm dialogs. */
  dismissable?: boolean;
  /** Body wrapper classes; pass `p-0` when the children own their padding
      (e.g. a modal with its own footer bar or a full-bleed diff). */
  bodyClassName?: string;
};

// Tab-cycle targets. offsetParent filters out display:none nodes at trap time.
const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Modal — the kit's dialog primitive (ADR-0007). It owns the two halves a
 * hand-rolled overlay always got wrong:
 *
 * - **Surface (paint):** a `panel` card with a content-title `colhead` header +
 *   a ✕ `control`, so it themes from the data-st contract like every other
 *   surface. The body is `data-st="prose"`-free; callers bring their own Roles.
 * - **Behaviour (a11y):** a body portal, `role="dialog"` + `aria-modal`, a
 *   focus trap with focus restored to the opener on close, Esc-to-close, a
 *   backdrop-click close, and scroll-lock while open.
 *
 * Mount === open: sites render `{open && <Modal…/>}` and unmount to close, so
 * there is no `open` prop. The dark scrim is theme-agnostic on purpose (a token
 * backdrop went transparent on themes that never defined it).
 */
const Modal = ({
  onClose,
  title,
  children,
  size = 'md',
  headerActions,
  dismissable = true,
  bodyClassName = 'p-5'
}: ModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    // Focus the first field/control, else the dialog itself, so the trap and
    // screen readers start inside the modal rather than on the page behind it.
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = nodes[0];
      const lastEl = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [onClose, dismissable]);

  const onBackdropMouseDown = (e: React.MouseEvent) => {
    // Only a click that starts AND lands on the backdrop closes — a drag that
    // began inside the panel (text selection) must not.
    if (dismissable && e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4"
      // Backdrop scrim: a pointer-only convenience. The a11y-complete close
      // paths are the native ✕ button and Esc, so keyboard users never need it.
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      onMouseDown={onBackdropMouseDown}
    >
      <div
        ref={panelRef}
        data-st="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`my-8 w-full ${SIZES[size]} shadow-2xl focus:outline-none`}
      >
        <div data-st="colhead" data-st-title>
          <h2 id={titleId} data-st="prose" data-st-strong className="text-sm">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              type="button"
              data-st="control"
              onClick={onClose}
              aria-label="Close"
              className="text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
        <div className={bodyClassName}>{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
