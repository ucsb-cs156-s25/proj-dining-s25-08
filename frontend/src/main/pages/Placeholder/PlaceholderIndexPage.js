import BasicLayout from "main/layouts/BasicLayout/BasicLayout";

export default function MyReviewsIndexPage() {
  return (
    <BasicLayout>
      <div className="pt-2">
        <h1>My Reviews</h1>
        <p>
          <a href="/myreviews/create">Create a new review</a>
        </p>
      </div>
    </BasicLayout>
  );
}
