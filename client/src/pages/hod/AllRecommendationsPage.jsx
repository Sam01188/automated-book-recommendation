import { RecommendationTable } from "../../components/RecommendationTable";
import { AppModal } from "../../components/AppModal";
import { useState } from "react";

export function AllRecommendationsPage({ items, filterPriority = "all", onOrderChange, onSubmit, isPeriodOpen, currentPeriod }) {
  const activeItems = items.filter(
    (item) => item.status !== "rejected" && (item.status !== "submitted" || !item.reviewedBy)
  );
  const filteredItems =
    filterPriority === "all"
      ? activeItems
      : filterPriority === "prioritized"
      ? activeItems.filter((item) => item.priority !== "unassigned")
      : activeItems.filter((item) => item.priority === filterPriority);
  const title =
    filterPriority === "prioritized"
      ? "Prioritized Recommendations"
      : filterPriority === "high"
      ? "High Priority Recommendations"
      : "All Recommendations";
  const allAssigned = activeItems.length > 0 && activeItems.every((item) => item.priority !== "unassigned");
  const [modal, setModal] = useState(null);

  return (
    <div>
      {!isPeriodOpen && (
        <div style={{
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)",
          color: "var(--danger)",
          borderRadius: "var(--radius)",
          padding: "1rem 1.25rem",
          fontWeight: 600,
          fontSize: "0.95rem",
          marginBottom: "1.5rem",
          border: "1px solid rgba(239, 68, 68, 0.35)"
        }}>
          ⚠️ HOD Priority Assignment Period is closed. Submitting to the librarian or assigning priorities is disabled.
        </div>
      )}

      {activeItems.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
          <button
            className="primary-button"
            onClick={() => {
              if (!onSubmit) return;
              if (!isPeriodOpen) {
                setModal({ title: "Period Closed", message: "HOD priority assignment period is closed.", confirmText: "OK", onConfirm: () => setModal(null) });
                return;
              }

              if (!allAssigned) {
                setModal({ title: "Incomplete Rankings", message: "Please assign priority to every book before submitting to the librarian.", confirmText: "OK", onConfirm: () => setModal(null) });
                return;
              }

              setModal({
                title: "Submit to Librarian",
                message: "Submit the ordered list to the librarian? This action will mark them as submitted.",
                confirmText: "Submit",
                cancelText: "Cancel",
                variant: "default",
                onConfirm: async () => {
                  setModal(null);
                  try {
                    await onSubmit();
                    setModal({ title: "Submitted", message: "Submitted to librarian successfully.", confirmText: "OK", onConfirm: () => setModal(null) });
                  } catch (err) {
                    setModal({ title: "Submission Failed", message: err.message || "Failed to submit to librarian.", variant: "danger", confirmText: "OK", onConfirm: () => setModal(null) });
                  }
                },
                onCancel: () => setModal(null)
              });
            }}
            style={{ minWidth: "220px", opacity: (!allAssigned || !isPeriodOpen) ? 0.6 : 1, cursor: (!allAssigned || !isPeriodOpen) ? 'not-allowed' : 'pointer' }}
          >
            Submit to Librarian
          </button>
        </div>
      )}

      {filteredItems.length > 0 ? (
        <RecommendationTable
          items={[...filteredItems].sort((a, b) => {
            const aRank = Number.isFinite(a.priorityRank) ? a.priorityRank : Number.MAX_SAFE_INTEGER;
            const bRank = Number.isFinite(b.priorityRank) ? b.priorityRank : Number.MAX_SAFE_INTEGER;
            return aRank - bRank || new Date(a.createdAt) - new Date(b.createdAt);
          })}
          title={title}
        />
      ) : (
        <p>No pending recommendations available.</p>
      )}
      {modal && (
        <AppModal
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          variant={modal.variant}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
        />
      )}
    </div>
  );
}
