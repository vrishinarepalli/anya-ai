import type { IntentType } from "@/types/routing";

interface ClassificationResult {
  intent: IntentType;
  confidence: number;
  requiresTools: boolean;
  requiresVision: boolean;
  estimatedComplexity: "low" | "medium" | "high";
}

const CODE_PATTERN = /```|def |function |class |import |const |var |let |async |await |\.(py|js|ts|go|rs|java|cpp|c)[\s"']/i;
const DOC_PATTERN = /pdf|document|file|attachment|analyze this|summarize this|read this/i;
const SEARCH_PATTERN = /latest|current|today|news|search|find online|look up|recent|2024|2025/i;
const MATH_PATTERN = /calculate|solve|equation|proof|mathematical|integral|derivative|probability|statistics/i;
const CREATIVE_PATTERN = /write a|story|poem|essay|creative|imagine|fiction|blog post|draft/i;
const CODE_REVIEW_PATTERN = /review|debug|fix this|bug|error|why (is|does|isn't)|what('s| is) wrong/i;
const DATA_PATTERN = /data|chart|graph|analyze|trend|csv|excel|spreadsheet|dataset|visualization/i;
const IMAGE_PATTERN = /image|photo|picture|screenshot|diagram|figure|visual|look at this/i;
const MULTI_STEP_PATTERN = /step by step|build me|create a (full|complete|entire)|workflow|plan for|first .* then/i;

export function classifyIntent(
  prompt: string,
  history: Array<{ role: string; content: string }>
): ClassificationResult {
  const lower = prompt.toLowerCase();
  const len = prompt.length;
  const hasHistory = history.length > 0;

  const requiresTools = SEARCH_PATTERN.test(lower);
  const requiresVision = IMAGE_PATTERN.test(lower);

  let intent: IntentType = "simple_qa";
  let confidence = 0.6;

  if (MULTI_STEP_PATTERN.test(lower) && len > 100) {
    intent = "multi_step_task";
    confidence = 0.8;
  } else if (SEARCH_PATTERN.test(lower)) {
    intent = "web_research";
    confidence = 0.85;
  } else if (CODE_REVIEW_PATTERN.test(lower) && CODE_PATTERN.test(prompt)) {
    intent = "code_review";
    confidence = 0.85;
  } else if (CODE_PATTERN.test(prompt) || /build|implement|create.*function|write.*code/.test(lower)) {
    intent = "code_generation";
    confidence = 0.8;
  } else if (DOC_PATTERN.test(lower) || len > 3000) {
    intent = "long_document_analysis";
    confidence = 0.75;
  } else if (MATH_PATTERN.test(lower)) {
    intent = "math_reasoning";
    confidence = 0.85;
  } else if (DATA_PATTERN.test(lower)) {
    intent = "data_analysis";
    confidence = 0.75;
  } else if (CREATIVE_PATTERN.test(lower)) {
    intent = "creative_writing";
    confidence = 0.8;
  } else if (requiresVision) {
    intent = "image_understanding";
    confidence = 0.9;
  }

  const estimatedComplexity =
    len > 500 || intent === "multi_step_task" || intent === "long_document_analysis"
      ? "high"
      : len > 100 || hasHistory
      ? "medium"
      : "low";

  return { intent, confidence, requiresTools, requiresVision, estimatedComplexity };
}
