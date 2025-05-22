import OurTable, { ButtonColumn } from "main/components/OurTable";
import { useBackendMutation } from "main/utils/useBackend";
import { hasRole } from "main/utils/currentUser";

export default function UsersTable({ users, currentUser, onSuccess }) {
  const toggleAdminMutation = useBackendMutation(
    (id) => ({
      url: "/api/admin/users/toggleAdmin",
      method: "POST",
      data: { id }
    }),
    { /* Stryker disable next-line all : hard to test asynchronous callback */
      onSuccess: (data) => { 
        console.log("Admin status toggled successfully", data);
        if (onSuccess) onSuccess();
      },
      onError: (error) => { 
        console.error("Error toggling admin status:", error?.response?.data?.message || error);
      }
    },
    []
  );

  const toggleModeratorMutation = useBackendMutation(
    (id) => ({
      url: "/api/admin/users/toggleModerator",
      method: "POST",
      data: { id }
    }),
    { /* Stryker disable next-line all : hard to test asynchronous callback */
      onSuccess: (data) => { 
        console.log("Moderator status toggled successfully", data);
        if (onSuccess) onSuccess();
      },
      onError: (error) => { 
        console.error("Error toggling moderator status:", error?.response?.data?.message || error);
      }
    },
    []
  );

  const columns = [
    {
      Header: "id",
      accessor: "id", // accessor is the "key" in the data
    },
    {
      Header: "First Name",
      accessor: "givenName",
    },
    {
      Header: "Last Name",
      accessor: "familyName",
    },
    {
      Header: "Email",
      accessor: "email",
    },
    {
      Header: "Admin",
      id: "admin",
      accessor: (row, _rowIndex) => String(row.admin), // hack needed for boolean values to show up
    },
    {
      Header: "Moderator",
      id: "moderator",
      accessor: (row, _rowIndex) => String(row.moderator || false), // default to false if not set
    },
    {
      Header: "Alias",
      accessor: "alias",
    },
    {
      Header: "Proposed Alias",
      accessor: "proposedAlias",
    },
    {
      Header: "Status",
      accessor: (row) => {
        if (row.status === "Approved" && row.dateApproved) {
          const formattedDate = new Date(row.dateApproved).toLocaleDateString();
          return `Approved on ${formattedDate}`;
        }
        return row.status;
      },
    }
  ];

  if (hasRole(currentUser, "ROLE_ADMIN")) {
    columns.push(
      ButtonColumn("Toggle Admin", "primary", (cell) => {
        toggleAdminMutation.mutate(cell.row.values.id);
      }, "UsersTable"),
      ButtonColumn("Toggle Moderator", "info", (cell) => {
        toggleModeratorMutation.mutate(cell.row.values.id);
      }, "UsersTable")
    );
  }

  return <OurTable data={users} columns={columns} testid={"UsersTable"} />;
}
