import React, { useState } from "react";
import styles from "./NewAssistantForm.module.css";
import Button from "../common/Button";
import {createAssistant} from "../../api/assistants.js";

const NewAssistantForm = ({onCreated,onCancel,})=>{
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [spec,setSpec] = useState("");
    const [submitting,setSubmiting] = useState(false);
    const [error,setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()){
            setError("Name is required");
            return;
        }
        try {
            setSubmiting(true);
            setError(null);

            const assistant = await createAssistant({
                name:name.trim(),
                description: description.trim() || undefined,
                spec: spec.trim() || undefined,
            });
            if (onCreated){
                onCreated(assistant);
            }
            setName("");
            setDescription("");
            setSpec("");
        } catch (err) {
            setError(err?.message || err?.response?.data?.detail || "Failed to create assistant");
        } finally {
            setSubmiting(false);
        }

    };
return (
    <div className={styles.wrapper}>
        <div className={styles.header}>
            <div>
                <div className={styles.title}>New Assistant</div>
                <div className={styles.subtitle}>Create a new assistant to help you with your tasks.</div>
            </div>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className= {styles.field}>
                <label className={styles.label}>Name *</label>
                <input
                className = {styles.input}
                value = {name}
                onChange = {(e) => setName(e.target.value)}
                placeholder = "Research Copilot, Meeting Prep Agent, Trip Planner..."
                />
            </div>
            <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <input
            className={styles.input}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description for your dashboard"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Spec</label>
          <textarea
            className={styles.textarea}
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            placeholder="Free-text spec, e.g., 'Plan trips given city and dates using planner → researcher → writer agents'"
          />
        </div>
        {error && (
          <div
            style={{
              fontSize: "0.8rem",
              color: "#f97373",
              marginTop: 4,
            }}
          >
            {error}
          </div>
        )} 
        <div className={styles.actions}>
          {onCancel && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Assistant"}
          </Button>
        </div>

        </form>
    </div>
);
    };

export default NewAssistantForm;
