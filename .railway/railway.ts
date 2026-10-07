import { defineRailway, project, service } from "railway/iac";

export default defineRailway(() => {
  const web = service("landings-buen-fin", {
    start: "npm start",
    healthcheck: "/health",
    healthcheckTimeout: 60,
    deploy: {
      restartPolicyType: "ON_FAILURE",
      restartPolicyMaxRetries: 5,
    },
  });

  return project("landings-buen-fin", {
    resources: [web],
  });
});
