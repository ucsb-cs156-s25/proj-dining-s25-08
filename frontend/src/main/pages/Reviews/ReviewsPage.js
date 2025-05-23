import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import { useParams } from "react-router-dom";

export default function ReviewsPage() {
  const { itemid } = useParams();
  return (
    <BasicLayout>
      <div className="pt-2">
        <h1>Reviews for Menu Item {itemid}</h1>
        <p>Coming soon!</p>
      </div>
    </BasicLayout>
  );
}
