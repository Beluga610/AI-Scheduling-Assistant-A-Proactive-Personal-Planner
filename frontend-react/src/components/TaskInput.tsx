import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_TASK, GET_TASKS } from "../graphql/queries";

export default function TaskInput() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [createTask, { loading }] = useMutation(CREATE_TASK, {
    refetchQueries: [{ query: GET_TASKS }]
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: add validation
    try {
      await createTask({ variables: { input: { title, description } } });
      setTitle("");
      setDescription("");
    } catch (err) {
      console.error("createTask failed", err);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label>Title</label><br/>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task title" style={{width:"100%"}}/>
      </div>
      <div>
        <label>Description</label><br/>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Optional" style={{width:"100%"}}/>
      </div>
      <div style={{marginTop:8}}>
        <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Task"}</button>
      </div>
    </form>
  );
}
