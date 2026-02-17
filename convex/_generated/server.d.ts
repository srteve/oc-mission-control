/* eslint-disable */
import type { GenericMutationCtx, GenericQueryCtx, GenericActionCtx } from "convex/server";
import type { DataModel } from "./dataModel.js";

export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type ActionCtx = GenericActionCtx<DataModel>;

export declare const query: import("convex/server").RegisteredQuery<any, any>;
export declare const mutation: import("convex/server").RegisteredMutation<any, any>;
export declare const action: import("convex/server").RegisteredAction<any, any>;
export declare const internalQuery: import("convex/server").RegisteredQuery<any, any>;
export declare const internalMutation: import("convex/server").RegisteredMutation<any, any>;
export declare const internalAction: import("convex/server").RegisteredAction<any, any>;
