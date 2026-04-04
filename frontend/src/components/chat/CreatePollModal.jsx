import { useState } from "react";
import { X, Plus, Trash2, BarChart2 } from "lucide-react";

const CreatePollModal = ({ onClose, onCreate }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddOption = () => {
    if (options.length < 5) setOptions([...options, ""]);
  };

  const handleRemoveOption = (idx) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleOptionChange = (idx, val) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const filledOptions = options.filter((o) => o.trim());
    if (!question.trim()) return setError("Question is required.");
    if (filledOptions.length < 2) return setError("Add at least 2 options.");
    setLoading(true);
    try {
      await onCreate(question.trim(), filledOptions);
      onClose();
    } catch (err) {
      setError("Failed to create poll. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart2 size={18} style={{ color: "var(--primary-400)" }} />
            <h3 style={{ margin: 0 }}>Create Poll</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Question</label>
            <input
              className="form-input"
              type="text"
              placeholder="Ask something..."
              maxLength={200}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Options</label>
            {options.map((opt, idx) => (
              <div
                key={idx}
                style={{ display: "flex", gap: 8, marginBottom: 8 }}
              >
                <input
                  className="form-input"
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  maxLength={100}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="emoji-quick-btn"
                  onClick={() => handleRemoveOption(idx)}
                  disabled={options.length <= 2}
                  title="Remove option"
                  style={{ color: "var(--gray-400)" }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {options.length < 5 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}
                onClick={handleAddOption}
              >
                <Plus size={14} />
                Add option
              </button>
            )}
          </div>

          {error && (
            <p style={{ color: "var(--error)", fontSize: "0.82rem", marginTop: 4 }}>
              {error}
            </p>
          )}

          <div className="modal-footer" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {loading ? (
                <span className="btn-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              ) : (
                <BarChart2 size={14} />
              )}
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePollModal;
