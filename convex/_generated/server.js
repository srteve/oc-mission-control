/* eslint-disable */
"use strict";
const { makeServerHelpers } = require("convex/server");
const { anyApi } = require("convex/server");

const { query, mutation, action, internalQuery, internalMutation, internalAction } =
  makeServerHelpers?.({ componentDefinitionPath: undefined }) ?? {};

exports.query = query;
exports.mutation = mutation;
exports.action = action;
exports.internalQuery = internalQuery;
exports.internalMutation = internalMutation;
exports.internalAction = internalAction;
