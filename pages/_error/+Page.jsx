import React from "react";

export { Page };

function Page({ pageContext }) {
  const statusCode = pageContext?.abortStatusCode || (pageContext?.is404 ? 404 : 500);
  const isNotFound = statusCode === 404;

  return (
    <main style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
      <h1>{isNotFound ? "Page not found" : "Something went wrong"}</h1>
      <p>{isNotFound ? "The page you requested does not exist." : "Please try again later."}</p>
    </main>
  );
}
