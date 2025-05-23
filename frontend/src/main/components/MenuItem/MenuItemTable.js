import OurTable, { ButtonColumn } from "../OurTable";
import { hasRole } from "../../utils/currentUser";
import { useNavigate } from "react-router-dom";

export default function MenuItemTable({ menuItems, currentUser }) {
  const testid = "MenuItemTable";
  const navigate = useNavigate();

  const reviewCallback = (cell) => {
    const item = cell.row.original;
    navigate(
      `/myreviews/create?itemId=${item.id}&itemName=${encodeURIComponent(item.name)}`,
    );
  };

  const reviewCallback = async (_cell) => {
    alert("Reviews coming soon!");
  };
  const viewCallback = async (_cell) => {
    navigate(`/reviews/${_cell.row.original.id}`);
  };
  const columns = [
    {
      Header: "Item Name",
      accessor: "name",
    },
    {
      Header: "Station",
      accessor: "station",
    },
  ];

  if (hasRole(currentUser, "ROLE_USER")) {
    columns.push(
      ButtonColumn("Review Item", "warning", reviewCallback, testid),
    );
    columns.push(ButtonColumn("All Reviews", "warning", viewCallback, testid));
  }

  return <OurTable columns={columns} data={menuItems} testid={testid} />;
}
