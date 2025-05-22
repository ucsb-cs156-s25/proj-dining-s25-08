import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import UsersTable from "main/components/Users/UsersTable";
import { useBackend } from "main/utils/useBackend";
import { useCurrentUser } from "main/utils/currentUser";

const AdminUsersPage = () => {
  const currentUser = useCurrentUser();

  const {
    data: users,
    error: _error,
    status: _status,
    refetch: refetchUsers
  } = useBackend(
    // Stryker disable next-line all : don't test internal caching of React Query
    ["/api/admin/users"],
    { method: "GET", url: "/api/admin/users" },
    [],
  );

  return (
    <BasicLayout>
      <h2>Users</h2>
      <UsersTable users={users} currentUser={currentUser.data} onSuccess={refetchUsers} />
    </BasicLayout>
  );
};

export default AdminUsersPage;
