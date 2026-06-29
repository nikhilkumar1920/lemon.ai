import { Mastra } from "@mastra/core/mastra";
import { testGeneratorAgent } from "./agents/testGeneratorAgent";
import { executorAgent } from "./agents/executorAgent";
import { editorAgent } from "./agents/editorAgent";
import { integrationGeneratorAgent } from "./agents/integrationGeneratorAgent";
import { e2eGeneratorAgent } from "./agents/e2eGeneratorAgent";

export const mastra = new Mastra({
  agents: { testGeneratorAgent, executorAgent, editorAgent, integrationGeneratorAgent, e2eGeneratorAgent },
});
