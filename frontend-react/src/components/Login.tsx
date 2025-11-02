import React, { useState, useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_USERS } from "../graphql/queries";

interface UserOption {
  _id: string;
  name: string;
  email: string;
}

export default function Login() {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [users, setUsers] = useState<UserOption[]>([]);

  const [getUsers, { data }] = useLazyQuery(GET_USERS);

  useEffect(() => {
    getUsers();
  }, []);

  useEffect(() => {
    if (data?.users) {
      setUsers(data.users);
      setSelectedUser(data.users[0]?._id || "");
    }
  }, [data]);

  const handleLogin = () => {
    if (!selectedUser) return;
    // 直接保存用户 id 到前端状态（或 context）
    localStorage.setItem("currentUserId", selectedUser);
    window.location.href = "/dashboard";
  };

  return (
    <div>
      <h2>选择用户登录</h2>
      <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
        {users.map(u => (
          <option key={u._id} value={u._id}>
            {u.name} ({u.email})
          </option>
        ))}
      </select>
      <button onClick={handleLogin}>登录</button>
    </div>
  );
}
