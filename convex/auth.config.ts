export default {
  providers: [
    {
      // Your Clerk Frontend API URL from JWT template
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};