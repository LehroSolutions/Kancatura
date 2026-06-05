import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const getDashboard = query({
  args: {
    planId: v.optional(v.id("plans"))
  },
  handler: async (ctx, args) => {
    const plan = args.planId
      ? await ctx.db.get(args.planId)
      : await ctx.db.query("plans").withIndex("by_updated_at").order("desc").first();

    if (!plan) {
      return null;
    }

    const [sections, stages, blockers, evidenceItems, activity, exportCheckpoints, highlights, metrics, revenue, tasks, documents] = await Promise.all([
      ctx.db
        .query("planSections")
        .withIndex("by_plan_order", (q) => q.eq("planId", plan._id))
        .collect(),
      ctx.db
        .query("businessStages")
        .withIndex("by_plan_order", (q) => q.eq("planId", plan._id))
        .collect(),
      ctx.db
        .query("readinessBlockers")
        .withIndex("by_plan_resolved", (q) => q.eq("planId", plan._id).eq("resolved", false))
        .collect(),
      ctx.db
        .query("evidenceItems")
        .withIndex("by_plan_stage", (q) => q.eq("planId", plan._id))
        .collect(),
      ctx.db
        .query("studioActivity")
        .withIndex("by_plan_created", (q) => q.eq("planId", plan._id))
        .order("desc")
        .take(8),
      ctx.db
        .query("exportCheckpoints")
        .withIndex("by_plan_order", (q) => q.eq("planId", plan._id))
        .collect(),
      ctx.db
        .query("planHighlights")
        .withIndex("by_plan_order", (q) => q.eq("planId", plan._id))
        .collect(),
      ctx.db
        .query("financialMetrics")
        .withIndex("by_plan_order", (q) => q.eq("planId", plan._id))
        .collect(),
      ctx.db
        .query("revenueProjection")
        .withIndex("by_plan_order", (q) => q.eq("planId", plan._id))
        .collect(),
      ctx.db
        .query("planTasks")
        .withIndex("by_plan", (q) => q.eq("planId", plan._id))
        .collect(),
      ctx.db
        .query("planDocuments")
        .withIndex("by_plan_updated", (q) => q.eq("planId", plan._id))
        .order("desc")
        .collect()
    ]);

    return {
      plan,
      sections,
      stages,
      blockers,
      evidenceItems,
      activity,
      exportCheckpoints,
      highlights,
      metrics,
      revenue,
      tasks,
      documents
    };
  }
});

export const getFounderStudio = query({
  args: {
    planId: v.optional(v.id("plans"))
  },
  handler: async (ctx, args) => {
    const plan = args.planId
      ? await ctx.db.get(args.planId)
      : await ctx.db.query("plans").withIndex("by_updated_at").order("desc").first();

    if (!plan) {
      return null;
    }

    const [sections, stages, blockers, evidenceItems, activity, exportCheckpoints, tasks, documents] = await Promise.all([
      ctx.db
        .query("planSections")
        .withIndex("by_plan_order", (q) => q.eq("planId", plan._id))
        .collect(),
      ctx.db
        .query("businessStages")
        .withIndex("by_plan_order", (q) => q.eq("planId", plan._id))
        .collect(),
      ctx.db
        .query("readinessBlockers")
        .withIndex("by_plan_resolved", (q) => q.eq("planId", plan._id).eq("resolved", false))
        .collect(),
      ctx.db
        .query("evidenceItems")
        .withIndex("by_plan_stage", (q) => q.eq("planId", plan._id))
        .collect(),
      ctx.db
        .query("studioActivity")
        .withIndex("by_plan_created", (q) => q.eq("planId", plan._id))
        .order("desc")
        .take(8),
      ctx.db
        .query("exportCheckpoints")
        .withIndex("by_plan_order", (q) => q.eq("planId", plan._id))
        .collect(),
      ctx.db
        .query("planTasks")
        .withIndex("by_plan", (q) => q.eq("planId", plan._id))
        .collect(),
      ctx.db
        .query("planDocuments")
        .withIndex("by_plan_updated", (q) => q.eq("planId", plan._id))
        .order("desc")
        .collect()
    ]);

    return {
      plan,
      sections,
      stages,
      blockers,
      evidenceItems,
      activity,
      exportCheckpoints,
      tasks,
      documents
    };
  }
});

export const updateSectionReadiness = mutation({
  args: {
    sectionId: v.id("planSections"),
    completion: v.number(),
    status: v.union(v.literal("complete"), v.literal("review"), v.literal("draft")),
    evidence: v.optional(v.string()),
    nextAction: v.optional(v.string()),
    notes: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.sectionId);

    if (!section) {
      throw new Error("Plan section not found.");
    }

    const updatedAt = Date.now();
    const nextSectionCompletion = Math.max(0, Math.min(100, args.completion));

    await ctx.db.patch(args.sectionId, {
      completion: nextSectionCompletion,
      status: args.status,
      evidence: args.evidence ?? section.evidence,
      nextAction: args.nextAction ?? section.nextAction,
      notes: args.notes ?? section.notes,
      updatedAt
    });

    const sections = await ctx.db
      .query("planSections")
      .withIndex("by_plan_order", (q) => q.eq("planId", section.planId))
      .collect();

    const nextCompletion =
      sections.length === 0
        ? 0
        : Math.round(
            sections.reduce((total, item) => total + (item._id === args.sectionId ? nextSectionCompletion : item.completion), 0) /
              sections.length
          );

    await ctx.db.patch(section.planId, {
      completion: nextCompletion,
      updatedAt,
      lastSavedAt: updatedAt
    });

    return { ok: true, completion: nextCompletion };
  }
});

export const updateStageReadiness = mutation({
  args: {
    stageId: v.id("businessStages"),
    readiness: v.number(),
    status: v.union(v.literal("complete"), v.literal("active"), v.literal("blocked"), v.literal("queued")),
    nextAction: v.optional(v.string()),
    blockers: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const stage = await ctx.db.get(args.stageId);

    if (!stage) {
      throw new Error("Business stage not found.");
    }

    const updatedAt = Date.now();
    const nextReadiness = Math.max(0, Math.min(100, args.readiness));

    await ctx.db.patch(args.stageId, {
      readiness: nextReadiness,
      status: args.status,
      nextAction: args.nextAction ?? stage.nextAction,
      blockers: args.blockers ?? stage.blockers,
      updatedAt
    });

    const stages = await ctx.db
      .query("businessStages")
      .withIndex("by_plan_order", (q) => q.eq("planId", stage.planId))
      .collect();

    const nextCompletion =
      stages.length === 0
        ? 0
        : Math.round(
            stages.reduce((total, item) => total + (item._id === args.stageId ? nextReadiness : item.readiness), 0) / stages.length
          );

    await ctx.db.patch(stage.planId, {
      completion: nextCompletion,
      currentStageSlug: stage.slug,
      updatedAt,
      lastSavedAt: updatedAt
    });

    return { ok: true, completion: nextCompletion };
  }
});

export const resolveReadinessBlocker = mutation({
  args: {
    blockerId: v.id("readinessBlockers")
  },
  handler: async (ctx, args) => {
    const blocker = await ctx.db.get(args.blockerId);

    if (!blocker) {
      throw new Error("Readiness blocker not found.");
    }

    await ctx.db.patch(args.blockerId, {
      resolved: true,
      updatedAt: Date.now()
    });

    return { ok: true };
  }
});

export const createTask = mutation({
  args: {
    planId: v.id("plans"),
    label: v.string(),
    dueLabel: v.string(),
    owner: v.string()
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("planTasks", {
      planId: args.planId,
      label: args.label,
      dueLabel: args.dueLabel,
      complete: false,
      owner: args.owner,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const setTaskComplete = mutation({
  args: {
    taskId: v.id("planTasks"),
    complete: v.boolean()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      complete: args.complete,
      updatedAt: Date.now()
    });

    return { ok: true };
  }
});
