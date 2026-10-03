import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";

function formatRole(role) {
  if (!role) return "";
  if (role === "hod") return "HoD";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function ProfilePage({ user, passwordChangeRequired, onChangePassword, onUpdateName }) {
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [nameBusy, setNameBusy] = useState(false);
  const [nameFeedback, setNameFeedback] = useState(null);
  const [editingName, setEditingName] = useState(false);

  async function submitName(event) {
    event.preventDefault();
    setNameFeedback(null);
    const normalizedName = name.trim();
    if (!normalizedName) {
      setNameFeedback({ type: "error", message: "Name cannot be blank." });
      return;
    }

    setNameBusy(true);
    try {
      const result = await onUpdateName(normalizedName);
      setName(result.name);
      setEditingName(false);
      setNameFeedback({ type: "success", message: "Name updated successfully." });
    } catch (error) {
      setNameFeedback({ type: "error", message: error.message });
    } finally {
      setNameBusy(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setFeedback(null);
    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", message: "The new passwords do not match." });
      return;
    }

    setBusy(true);
    try {
      const result = await onChangePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFeedback({ type: "success", message: result.message });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="form-panel profile-panel">
      <h2 className="panel-title">My Profile</h2>
      {passwordChangeRequired && (
        <p className="profile-required-notice">
          Change your temporary password before continuing to the portal.
        </p>
      )}

      <dl className="profile-details">
        <div className="profile-detail">
          <dt>Full name</dt>
          <dd className="profile-name-value">
            {editingName ? (
              <form className="profile-name-edit" onSubmit={submitName}>
                <input
                  aria-label="Updated display name"
                  autoComplete="name"
                  maxLength={100}
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                />
                <button className="profile-edit-button" type="submit" title="Save name" aria-label="Save name" disabled={nameBusy || name.trim() === user.name}>
                  <Check size={17} />
                </button>
                <button
                  className="profile-edit-button"
                  type="button"
                  title="Cancel name edit"
                  aria-label="Cancel name edit"
                  onClick={() => { setName(user.name); setEditingName(false); setNameFeedback(null); }}
                  disabled={nameBusy}
                >
                  <X size={17} />
                </button>
              </form>
            ) : (
              <>
                <span>{user.name}</span>
                <button
                  className="profile-edit-button"
                  type="button"
                  title="Edit name"
                  aria-label="Edit name"
                  onClick={() => { setName(user.name); setEditingName(true); setNameFeedback(null); }}
                >
                  <Pencil size={16} />
                </button>
              </>
            )}
          </dd>
          {nameFeedback && (
            <dd className={`profile-feedback ${nameFeedback.type}`} role={nameFeedback.type === "error" ? "alert" : "status"}>
              {nameFeedback.message}
            </dd>
          )}
        </div>
        <div className="profile-detail">
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="profile-detail">
          <dt>Role</dt>
          <dd>{formatRole(user.role)}</dd>
        </div>
        {user.department && (
          <div className="profile-detail">
            <dt>Department</dt>
            <dd>{user.department}</dd>
          </div>
        )}
      </dl>

      <form className="profile-section profile-password-form" onSubmit={submit}>
        <h3>{passwordChangeRequired ? "Set your password" : "Change password"}</h3>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="current-password">Current password</label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="confirm-new-password">Confirm new password</label>
            <input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        </div>
        {feedback && (
          <p className={`profile-feedback ${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>
            {feedback.message}
          </p>
        )}
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? "Updating..." : "Update password"}
        </button>
      </form>
    </section>
  );
}