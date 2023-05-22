const core = require("@actions/core");
const httpm = require("@actions/http-client");
const auth = require("@actions/http-client/lib/auth");
const uuid = require("uuid");

const mapVariables = (variables, isSecret) => {
  return variables
    .split(",")
    .filter((variable) => variable)
    .map((variable) => ({
      value: variable,
      isSecret,
    }));
};

const main = async () => {
  try {
    // inputs
    const token = core.getInput("spheron-token");
    const instanceId = core.getInput("instance-id");
    const tag = core.getInput("tag");
    const inputVariables = core.getInput("env");
    const secretInputVariables = core.getInput("secret-env");

    const bearerToken = new auth.BearerCredentialHandler(token);
    const http = new httpm.HttpClient("http", [bearerToken]);

    const tokenScopeResponse = await http.get(
      "https://api-v2.spheron.network/v1/api-keys/scope"
    );

    const scope = JSON.parse(await tokenScopeResponse.readBody());
    if (scope.error) {
      core.setFailed(scope.message);
      return;
    }

    const updateRequestBody = {
      env: [
        ...mapVariables(inputVariables, false),
        ...mapVariables(secretInputVariables, true),
      ],
      uniqueTopicId: uuid.v4(),
      organizationId: scope.organizations[0].id,
      tag,
    };

    console.log(JSON.stringify(updateRequestBody));

    const createResponse = await http.patchJson(
      `https://api-v2.spheron.network/v1/cluster-instance/${instanceId}/update`,
      updateRequestBody
    );

    console.log(createResponse.statusCode);
    console.log(createResponse.result);
  } catch (error) {
    core.setFailed(error.message);
  }
};

main();
