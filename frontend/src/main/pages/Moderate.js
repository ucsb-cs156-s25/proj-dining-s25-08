import React from "react";
import { useCurrentUser, hasRole } from "main/utils/currentUser";
import { Navigate } from "react-router-dom";
import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import AliasApprovalTable from "main/components/AliasApprovalTable/AliasApprovalTable";

export default function Moderate() {
  const { data: currentUser } = useCurrentUser();

  if (!currentUser.loggedIn || !hasRole(currentUser, "ROLE_ADMIN")) {
    return <Navigate to="/" />;
  }

  return (
    <BasicLayout>
      <div className="pt-2">
        <h1>Moderation Page</h1>
        <p>Below are all users awaiting alias approval:</p>
        <AliasApprovalTable />
      </div>
    </BasicLayout>
  );
}
