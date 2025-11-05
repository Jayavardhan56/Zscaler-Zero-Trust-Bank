// auth0-login.js — Auth0 SPA Login Integration

(async () => {
  const auth0Client = await createAuth0Client({
    domain: "dev-qlmmy3wsd6z2uizp.us.auth0.com",          // e.g. dev-abc123.us.auth0.com
    clientId: "MdOH5NIKiGYpDkuGvWhyGkc6wUc6RzV6",     // from Auth0 dashboard
    authorizationParams: {
      redirect_uri: window.location.origin + "/dashboard.html"
    }
  });

  // Handle login callback
  if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
    await auth0Client.handleRedirectCallback();
    window.history.replaceState({}, document.title, "/dashboard.html");
  }

  const isAuthenticated = await auth0Client.isAuthenticated();

  if (!isAuthenticated) {
    document.getElementById("loginBtn").addEventListener("click", async () => {
      await auth0Client.loginWithRedirect();
    });
  } else {
    const user = await auth0Client.getUser();
    console.log("Logged in as:", user);
    // Store in sessionStorage (temporary)
    sessionStorage.setItem("ZT_ACTIVE_USER", JSON.stringify(user));
    window.location.href = "dashboard.html";
  }
})();
