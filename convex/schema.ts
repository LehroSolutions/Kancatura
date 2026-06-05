import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const sectionStatus = v.union(v.literal("complete"), v.literal("review"), v.literal("draft"));
const stageStatus = v.union(v.literal("complete"), v.literal("active"), v.literal("blocked"), v.literal("queued"));
const riskLevel = v.union(v.literal("Low"), v.literal("Medium"), v.literal("High"));
const severityLevel = v.union(v.literal("Low"), v.literal("Medium"), v.literal("High"));
const accentTone = v.union(v.literal("green"), v.literal("blue"), v.literal("violet"), v.literal("orange"), v.literal("amber"));
const documentKind = v.union(v.literal("DOCX"), v.literal("XLSX"), v.literal("PDF"), v.literal("PPTX"));
const evidenceStatus = v.union(v.literal("verified"), v.literal("review"), v.literal("draft"), v.literal("needed"));
const exportCheckpointStatus = v.union(v.literal("ready"), v.literal("review"), v.literal("blocked"));

export default defineSchema({
  plans: defineTable({
    name: v.string(),
    subtitle: v.string(),
    market: v.string(),
    ownerLabel: v.string(),
    completion: v.number(),
    financialReadiness: v.optional(v.number()),
    evidenceCoverage: v.optional(v.number()),
    exportReadiness: v.optional(v.number()),
    currentStageSlug: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("review"), v.literal("export_ready"), v.literal("archived")),
    lastSavedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_status", ["status"])
    .index("by_updated_at", ["updatedAt"]),

  planSections: defineTable({
    planId: v.id("plans"),
    stageSlug: v.optional(v.string()),
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    completion: v.number(),
    status: sectionStatus,
    owner: v.string(),
    evidence: v.string(),
    risk: riskLevel,
    nextAction: v.string(),
    notes: v.array(v.string()),
    order: v.number(),
    updatedAt: v.number()
  })
    .index("by_plan_order", ["planId", "order"])
    .index("by_plan_status", ["planId", "status"])
    .index("by_plan_stage", ["planId", "stageSlug"]),

  businessStages: defineTable({
    planId: v.id("plans"),
    slug: v.string(),
    phase: v.string(),
    title: v.string(),
    description: v.string(),
    owner: v.string(),
    readiness: v.number(),
    status: stageStatus,
    tone: accentTone,
    sectionSlug: v.optional(v.string()),
    nextAction: v.string(),
    blockers: v.array(v.string()),
    evidence: v.array(v.string()),
    linkedTaskSlugs: v.array(v.string()),
    linkedDocumentSlugs: v.array(v.string()),
    order: v.number(),
    updatedAt: v.number()
  })
    .index("by_plan_order", ["planId", "order"])
    .index("by_plan_status", ["planId", "status"]),

  readinessBlockers: defineTable({
    planId: v.id("plans"),
    stageSlug: v.string(),
    label: v.string(),
    severity: severityLevel,
    owner: v.string(),
    action: v.string(),
    resolved: v.boolean(),
    order: v.number(),
    updatedAt: v.number()
  })
    .index("by_plan_stage", ["planId", "stageSlug"])
    .index("by_plan_resolved", ["planId", "resolved"]),

  evidenceItems: defineTable({
    planId: v.id("plans"),
    stageSlug: v.string(),
    title: v.string(),
    source: v.string(),
    status: evidenceStatus,
    detail: v.string(),
    order: v.number(),
    updatedAt: v.number()
  })
    .index("by_plan_stage", ["planId", "stageSlug"])
    .index("by_plan_status", ["planId", "status"]),

  studioActivity: defineTable({
    planId: v.id("plans"),
    actor: v.string(),
    action: v.string(),
    target: v.string(),
    tone: accentTone,
    createdAt: v.number()
  }).index("by_plan_created", ["planId", "createdAt"]),

  exportCheckpoints: defineTable({
    planId: v.id("plans"),
    stageSlug: v.optional(v.string()),
    label: v.string(),
    status: exportCheckpointStatus,
    detail: v.string(),
    order: v.number(),
    updatedAt: v.number()
  })
    .index("by_plan_order", ["planId", "order"])
    .index("by_plan_status", ["planId", "status"]),

  planHighlights: defineTable({
    planId: v.id("plans"),
    title: v.string(),
    body: v.string(),
    tone: accentTone,
    order: v.number()
  }).index("by_plan_order", ["planId", "order"]),

  financialMetrics: defineTable({
    planId: v.id("plans"),
    label: v.string(),
    value: v.string(),
    status: v.string(),
    delta: v.string(),
    tone: accentTone,
    trend: v.array(v.number()),
    order: v.number()
  }).index("by_plan_order", ["planId", "order"]),

  revenueProjection: defineTable({
    planId: v.id("plans"),
    quarter: v.string(),
    yearOne: v.number(),
    yearTwo: v.number(),
    yearThree: v.number(),
    margin: v.number(),
    order: v.number()
  }).index("by_plan_order", ["planId", "order"]),

  planTasks: defineTable({
    planId: v.id("plans"),
    stageSlug: v.optional(v.string()),
    slug: v.optional(v.string()),
    label: v.string(),
    dueLabel: v.string(),
    dueAt: v.optional(v.number()),
    complete: v.boolean(),
    owner: v.string(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_plan", ["planId"])
    .index("by_plan_complete", ["planId", "complete"])
    .index("by_plan_stage", ["planId", "stageSlug"]),

  planDocuments: defineTable({
    planId: v.id("plans"),
    stageSlug: v.optional(v.string()),
    slug: v.optional(v.string()),
    name: v.string(),
    kind: documentKind,
    status: v.string(),
    storageId: v.optional(v.id("_storage")),
    updatedAt: v.number()
  })
    .index("by_plan_updated", ["planId", "updatedAt"])
    .index("by_plan_stage", ["planId", "stageSlug"])
});
