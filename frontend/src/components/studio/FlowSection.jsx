import React from "react";
import styles from "./FlowSection.module.css";

const FlowSection = ({
  prompts,
  flowOrder,
  onFlowOrderChange,
}) => {
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const order = [...flowOrder];
    [order[index - 1], order[index]] = [order[index], order[index - 1]];
    onFlowOrderChange(order);
  };

  const handleMoveDown = (index) => {
    if (index === flowOrder.length - 1) return;
    const order = [...flowOrder];
    [order[index], order[index + 1]] = [order[index + 1], order[index]];
    onFlowOrderChange(order);
  };

  const handleRemove = (id) => {
    onFlowOrderChange(flowOrder.filter((x) => x !== id));
  };

  const handleAdd = (id) => {
    if (!flowOrder.includes(id)) {
      onFlowOrderChange([...flowOrder, id]);
    }
  };

  const available = prompts.filter((p) => !flowOrder.includes(p.id));

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>Flow</h2>
      <p className={styles.text}>
        Define the order in which prompts will process the user's query (e.g., 1→2→3 or
        3→1→2).
      </p>

      <div className={styles.flowList}>
        {flowOrder.length === 0 ? (
          <p className={styles.hint}>
            No prompts in flow. Add prompts below to define execution order.
          </p>
        ) : (
          flowOrder.map((id, index) => {
            const prompt = prompts.find((p) => p.id === id);
            if (!prompt) return null;
            return (
              <div key={id}>
                <div className={styles.flowItem}>
                  <div className={styles.stepCircle}>{index + 1}</div>
                  <div className={styles.flowLabel}>{prompt.label}</div>
                  <div className={styles.flowActions}>
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className={styles.smallButton}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === flowOrder.length - 1}
                      className={styles.smallButton}
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleRemove(id)}
                      className={styles.deleteButton}
                    >
                      ×
                    </button>
                  </div>
                </div>
                {index < flowOrder.length - 1 && (
                  <div className={styles.arrow}>↓</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {available.length > 0 && (
        <div className={styles.addBlock}>
          <p className={styles.addLabel}>Add to flow:</p>
          <div className={styles.addButtons}>
            {available.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAdd(p.id)}
                className={styles.ghostButton}
              >
                + {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowSection;
 